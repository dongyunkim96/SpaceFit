import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor } from "./editor";
import { db, exportJSON, localProjects } from "./persistence";
import { cloudProjects } from "./firebase";
import { useAuth } from "./auth";
import { useNavigate } from "react-router-dom";
import { copyProject } from "./model";
export function useProject(id: string | undefined) {
  const { user, loading: authLoading } = useAuth(),
    navigate = useNavigate();
  const generation = useEditor((s) => s.generation);
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [status, setStatus] = useState("Saved on this device"),
    [retry, setRetry] = useState(0);
  const revision = useRef(0),
    queue = useRef(Promise.resolve()),
    session = useRef(0),
    savedGeneration = useRef(0);
  const userId = user?.uid;
  const scope = `${userId ?? "guest"}:${id}`;
  const [loadedScope, setLoadedScope] = useState("");
  useEffect(() => {
    if (authLoading) return;
    let disposed = false;
    const token = ++session.current;
    savedGeneration.current = 0;
    setLoading(true);
    setError("");
    useEditor.getState().clear();
    const repo = userId ? cloudProjects(userId) : localProjects;
    void (async () => {
      try {
        const cached = userId
          ? await db.accountCache.get(`${userId}:${id}`)
          : undefined;
        const p = cached?.pending ? cached.project : await repo.get(id || "");
        if (disposed || session.current !== token) return;
        if (!p) {
          setError(
            "This space could not be found. It may belong to another browser or account.",
          );
          return;
        }
        revision.current = p.revision;
        useEditor.getState().load(p);
        setLoadedScope(`${userId ?? "guest"}:${id}`);
        setStatus(
          cached?.pending
            ? "Offline — changes kept locally"
            : userId
              ? "Saved"
              : "Saved on this device",
        );
        if (cached?.pending) {
          savedGeneration.current = -1;
          setRetry((n) => n + 1);
        }
      } catch {
        if (!disposed)
          setError(
            "This space could not be opened. Check your connection or browser storage settings.",
          );
      } finally {
        if (!disposed) {
          setLoadedScope(`${userId ?? "guest"}:${id}`);
          setLoading(false);
        }
      }
    })();
    return () => {
      disposed = true;
      session.current++;
      useEditor.getState().clear();
    };
  }, [id, userId, authLoading]);
  useEffect(() => {
    if (loading || error || generation === savedGeneration.current) return;
    setStatus(
      navigator.onLine ? "Unsaved changes" : "Offline — saving locally",
    );
    const token = session.current,
      gen = generation;
    const timeout = setTimeout(() => {
      queue.current = queue.current
        .catch(() => {})
        .then(async () => {
          if (session.current !== token) return;
          const s = useEditor.getState();
          if (
            !s.project ||
            s.generation !== gen ||
            s.generation === savedGeneration.current
          )
            return;
          const p = structuredClone(s.project);
          setStatus("Saving");
          try {
            let next;
            if (userId) {
              await db.accountCache.put({
                key: `${userId}:${p.id}`,
                owner: userId,
                project: { ...p, revision: revision.current },
                pending: true,
              });
              if (!navigator.onLine) {
                if (session.current === token) {
                  setStatus("Offline — changes kept locally");
                  savedGeneration.current = gen;
                }
                return;
              }
              next = await cloudProjects(userId).save(p, revision.current);
              await db.accountCache.put({
                key: `${userId}:${p.id}`,
                owner: userId,
                project: next,
                pending: false,
              });
            } else next = await localProjects.save(p, revision.current);
            if (session.current !== token) return;
            revision.current = next.revision;
            useEditor.getState().ack(next.revision);
            savedGeneration.current = gen;
            if (useEditor.getState().generation === gen)
              setStatus(userId ? "Saved" : "Saved on this device");
          } catch (e) {
            if (session.current !== token) return;
            setStatus("Save failed — retry");
            setError(
              e instanceof Error
                ? e.message
                : "Your latest changes could not be saved. Export a backup or retry.",
            );
          }
        });
    }, 700);
    return () => clearTimeout(timeout);
  }, [generation, retry, loading, error, userId]);
  useEffect(() => {
    const online = () => {
      savedGeneration.current = -1;
      setError("");
      setRetry((n) => n + 1);
    };
    window.addEventListener("online", online);
    return () => window.removeEventListener("online", online);
  }, []);
  useEffect(() => {
    const f = (e: BeforeUnloadEvent) => {
      if (useEditor.getState().generation !== savedGeneration.current) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", f);
    return () => window.removeEventListener("beforeunload", f);
  }, []);
  const saveCopy = useCallback(async () => {
    const p = useEditor.getState().project;
    if (!p) return;
    try {
      const next = await (userId ? cloudProjects(userId) : localProjects).save(
        copyProject(p),
        0,
      );
      if (userId) await db.accountCache.delete(`${userId}:${p.id}`);
      setError("");
      navigate(`/planner/${next.id}`);
    } catch {
      exportJSON(p);
      setError(
        "A copy could not be stored. Your JSON backup has been downloaded.",
      );
    }
  }, [userId, navigate]);
  function flush() {
    const token = session.current;
    const task = queue.current
      .catch(() => {})
      .then(async () => {
        if (session.current !== token) return false;
        const state = useEditor.getState();
        if (!state.project || state.generation === savedGeneration.current)
          return true;
        const project = structuredClone(state.project);
        try {
          setStatus("Saving");
          if (userId && !navigator.onLine) {
            await db.accountCache.put({
              key: `${userId}:${project.id}`,
              owner: userId,
              project: { ...project, revision: revision.current },
              pending: true,
            });
            savedGeneration.current = state.generation;
            setStatus("Offline — changes kept locally");
            return true;
          }
          const next = await (
            userId ? cloudProjects(userId) : localProjects
          ).save(project, revision.current);
          if (userId)
            await db.accountCache.put({
              key: `${userId}:${project.id}`,
              owner: userId,
              project: next,
              pending: false,
            });
          if (session.current !== token) return false;
          revision.current = next.revision;
          useEditor.getState().ack(next.revision);
          savedGeneration.current = state.generation;
          setStatus(userId ? "Saved" : "Saved on this device");
          return true;
        } catch (e) {
          setStatus("Save failed — retry");
          setError(
            e instanceof Error
              ? e.message
              : "Your changes could not be saved. Export a backup before leaving.",
          );
          return false;
        }
      });
    queue.current = task.then(() => {});
    return task;
  }
  async function reloadLatest() {
    const project = useEditor.getState().project;
    if (userId && project)
      await db.accountCache.delete(`${userId}:${project.id}`);
    savedGeneration.current = useEditor.getState().generation;
    window.location.reload();
  }
  return {
    loading: loading || loadedScope !== scope,
    error,
    status,
    retry: () => {
      setError("");
      savedGeneration.current = -1;
      setRetry((n) => n + 1);
    },
    saveCopy,
    flush,
    reloadLatest,
  };
}
