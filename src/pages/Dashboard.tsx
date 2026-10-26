import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  Copy,
  Download,
  FolderOpen,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { useAuth } from "../lib/auth";
import { cloudProjects } from "../lib/firebase";
import { exportJSON, localProjects } from "../lib/persistence";
import { copyProject, parseProject, type Project } from "../lib/model";
import { area, formatArea } from "../lib/geometry";
import { PlanSvg } from "../components/PlanSvg";
import { Dialog } from "../components/Dialog";
export default function Dashboard() {
  const { user, loading: authLoading } = useAuth(),
    navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [query, setQuery] = useState(""),
    [sort, setSort] = useState("updated"),
    [menu, setMenu] = useState<string | null>(null),
    [action, setAction] = useState<{
      kind: "rename" | "delete";
      project: Project;
    } | null>(null),
    [name, setName] = useState(""),
    [busy, setBusy] = useState(false),
    [guests, setGuests] = useState<Project[]>([]);
  const input = useRef<HTMLInputElement>(null);
  const request = useRef(0);
  const scope = user?.uid ?? "guest";
  const [projectsScope, setProjectsScope] = useState("");
  const repo = () => (user ? cloudProjects(user.uid) : localProjects);
  const refresh = useCallback(async () => {
    if (authLoading) return;
    const token = ++request.current;
    setLoading(true);
    setProjects([]);
    setError("");
    try {
      const [nextProjects, nextGuests] = await Promise.all([
        (user ? cloudProjects(user.uid) : localProjects).list(),
        user ? localProjects.list() : Promise.resolve([]),
      ]);
      if (token !== request.current) return;
      setProjects(nextProjects);
      setGuests(nextGuests);
      setProjectsScope(user?.uid ?? "guest");
    } catch {
      if (token === request.current)
        setError(
          "Your spaces could not be loaded. Check your connection or browser storage permissions, then try again.",
        );
    } finally {
      if (token === request.current) setLoading(false);
    }
  }, [user, authLoading]);
  useEffect(() => {
    setAction(null);
    setMenu(null);
    void refresh();
    return () => {
      request.current++;
    };
  }, [refresh]);
  async function duplicate(p: Project) {
    setMenu(null);
    try {
      await repo().save(copyProject(p), 0);
      await refresh();
    } catch {
      setError("We could not copy this space. Please try again.");
    }
  }
  async function confirm() {
    if (!action) return;
    setBusy(true);
    try {
      if (action.kind === "delete") await repo().remove(action.project.id);
      else {
        if (!name.trim()) throw Error("Enter a name for your space.");
        await repo().save(
          { ...action.project, name: name.trim() },
          action.project.revision,
        );
      }
      setAction(null);
      await refresh();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "This change could not be saved.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function importFile(file?: File) {
    if (!file) return;
    try {
      if (file.size > 2e6) throw Error("Choose a JSON file smaller than 2 MB.");
      const p = copyProject(parseProject(JSON.parse(await file.text())));
      const saved = await repo().save(p, 0);
      navigate(`/planner/${saved.id}`);
    } catch {
      setError(
        "That file is not a valid SPACEFIT project. Choose an exported .spacefit.json file with valid room and furniture dimensions.",
      );
    }
    if (input.current) input.current.value = "";
  }
  async function importGuests() {
    setBusy(true);
    try {
      for (const p of guests)
        await repo().save(copyProject(p, `${p.name} (imported)`), 0);
      setGuests([]);
      await refresh();
      setGuests([]);
    } catch {
      setError(
        "Some drafts could not be imported. Your browser copies are still safe.",
      );
    } finally {
      setBusy(false);
    }
  }
  const list = (projectsScope === scope ? projects : [])
    .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) =>
      sort === "name"
        ? a.name.localeCompare(b.name)
        : b.updatedAt.localeCompare(a.updatedAt),
    );
  return (
    <main id="main" className="page-width dashboard-page">
      <div className="dashboard-heading">
        <div>
          <span className="eyebrow">YOUR IDEAS. ROOM TO GROW.</span>
          <h1>
            My <em>spaces.</em>
          </h1>
          <p>
            {user
              ? "Your personal collection of possibilities."
              : "Thoughtful plans, saved in this browser."}
          </p>
        </div>
        <div className="dashboard-actions">
          <button
            className="button secondary"
            onClick={() => input.current?.click()}
          >
            <Upload size={16} /> Import a space
          </button>
          <Link className="button" to="/new">
            New space <Plus size={18} />
          </Link>
          <input
            ref={input}
            hidden
            type="file"
            accept=".json,application/json"
            aria-label="Import project JSON"
            onChange={(e) => void importFile(e.target.files?.[0])}
          />
        </div>
      </div>
      {user && guests.length > 0 && (
        <div className="notice">
          <p>
            You have {guests.length} guest drafts in this browser. Import copies
            into your account? Existing account projects stay as they are.
          </p>
          <button
            className="button small"
            disabled={busy}
            onClick={() => void importGuests()}
          >
            Import guest drafts
          </button>
          <button className="text-button" onClick={() => setGuests([])}>
            Not now
          </button>
        </div>
      )}
      {error && (
        <div className="notice error" role="alert">
          {error}
          <button className="text-button" onClick={() => void refresh()}>
            Retry loading
          </button>
        </div>
      )}
      <div className="dashboard-tools">
        <div className="search-field">
          <Search size={17} />
          <input
            aria-label="Search spaces"
            value={query}
            placeholder="Find a space…"
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div>
          <span className="storage-badge">
            <span className="status-dot" />
            {user ? "Your account" : "This browser"}
          </span>
          <select
            aria-label="Sort projects"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="updated">Recently edited</option>
            <option value="name">Name A–Z</option>
          </select>
        </div>
      </div>
      {loading ? (
        <div className="empty-state" role="status">
          Opening your collection…
        </div>
      ) : list.length ? (
        <div className="templates-grid saved-grid">
          {list.map((p) => (
            <article className="saved-card" key={p.id}>
              <Link
                className="saved-preview"
                to={`/planner/${p.id}`}
                aria-label={`Edit ${p.name}`}
              >
                <PlanSvg project={p} measurements={false} />
                <span className="card-arrow">
                  <ArrowUpRight size={21} />
                </span>
              </Link>
              <div className="saved-card-heading">
                <h3>
                  <Link to={`/planner/${p.id}`}>{p.name}</Link>
                </h3>
                <div className="card-menu-wrap">
                  <button
                    className="icon-button"
                    aria-label={`Actions for ${p.name}`}
                    aria-expanded={menu === p.id}
                    onClick={() => setMenu(menu === p.id ? null : p.id)}
                  >
                    <MoreHorizontal size={20} />
                  </button>
                  {menu === p.id && (
                    <div className="card-menu">
                      <button
                        onClick={() => {
                          setName(p.name);
                          setAction({ kind: "rename", project: p });
                          setMenu(null);
                        }}
                      >
                        <Pencil size={14} />
                        Rename
                      </button>
                      <button onClick={() => void duplicate(p)}>
                        <Copy size={14} />
                        Duplicate
                      </button>
                      <button
                        onClick={() => {
                          exportJSON(p);
                          setMenu(null);
                        }}
                      >
                        <Download size={14} />
                        Export JSON
                      </button>
                      <button
                        onClick={() => {
                          setAction({ kind: "delete", project: p });
                          setMenu(null);
                        }}
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="saved-card-meta">
                <span>
                  {formatArea(area(p), p.unit)} · {p.rooms.length}{" "}
                  {p.rooms.length === 1 ? "room" : "rooms"}
                </span>
                <span>
                  {new Date(p.updatedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">
            <FolderOpen size={44} strokeWidth={1} />
          </div>
          <span className="eyebrow">A LITTLE ROOM FOR POSSIBILITY</span>
          <h2>
            {query
              ? "No matching spaces."
              : "Your next great space starts here."}
          </h2>
          <p>
            {query
              ? "Try a different name to find your project."
              : "Measure your room, move a few pieces, and discover what feels right. Your saved plans will be waiting here."}
          </p>
          <Link
            to={query ? "/my-spaces" : "/templates"}
            className="button"
            onClick={() => setQuery("")}
          >
            {query ? "Clear search" : "Find your starting point"}
            <ArrowUpRight size={18} />
          </Link>
          <Link className="text-link" to="/demo">
            Take the demo for a spin <ArrowUpRight size={16} />
          </Link>
        </div>
      )}
      <p className="concept-note">
        {user
          ? "Account projects are stored with Firebase. Export a backup for your own records."
          : "Browser drafts are stored on this device only. Clearing site data removes them. Export a JSON backup to keep your ideas safe."}
      </p>
      {action && (
        <Dialog
          title={
            action.kind === "delete"
              ? "Let this space go?"
              : "A new name, same possibilities."
          }
          onClose={() => setAction(null)}
        >
          {action.kind === "delete" ? (
            <p>
              “{action.project.name}” will be permanently removed from{" "}
              {user ? "your account" : "this browser"}. Export a copy first if
              you’d like to keep it.
            </p>
          ) : (
            <>
              <label htmlFor="rename">Space name</label>
              <input
                id="rename"
                value={name}
                maxLength={100}
                onChange={(e) => setName(e.target.value)}
              />
            </>
          )}
          <div className="dialog-actions">
            <button
              className="button secondary"
              onClick={() => setAction(null)}
            >
              Keep it
            </button>
            <button
              className={`button ${action.kind === "delete" ? "danger" : ""}`}
              disabled={busy}
              onClick={() => void confirm()}
            >
              {busy
                ? "Saving…"
                : action.kind === "delete"
                  ? "Delete space"
                  : "Save name"}
            </button>
          </div>
        </Dialog>
      )}
    </main>
  );
}
