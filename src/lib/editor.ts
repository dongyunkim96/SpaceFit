import { create } from "zustand";
import { constrain, footprint, inRoom } from "./geometry";
import { getCatalog } from "../data/catalog";
import { furniture } from "../data/templates";
import { uid, type Item, type Project } from "./model";
interface Editor {
  project: Project | null;
  selected: string | null;
  past: Project[];
  future: Project[];
  generation: number;
  message: string;
  load: (p: Project) => void;
  clear: () => void;
  edit: (fn: (p: Project) => void) => void;
  select: (id: string | null) => void;
  updateItem: (id: string, patch: Partial<Item>) => void;
  add: (catalogId: string, roomId: string) => void;
  remove: () => void;
  duplicate: () => void;
  undo: () => void;
  redo: () => void;
  ack: (revision: number) => void;
}
export const useEditor = create<Editor>((set, get) => ({
  project: null,
  selected: null,
  past: [],
  future: [],
  generation: 0,
  message: "",
  load: (p) =>
    set({
      project: p,
      selected: null,
      past: [],
      future: [],
      generation: 0,
      message: "",
    }),
  clear: () => set({ project: null, selected: null, past: [], future: [] }),
  select: (selected) => set({ selected }),
  edit: (fn) => {
    const { project, past } = get();
    if (!project) return;
    const next = structuredClone(project);
    fn(next);
    if (JSON.stringify(next) === JSON.stringify(project)) return;
    set({
      project: next,
      past: [...past.slice(-49), project],
      future: [],
      generation: get().generation + 1,
      message: "",
    });
  },
  updateItem: (id, patch) => {
    get().edit((p) => {
      const i = p.furniture.findIndex((f) => f.id === id);
      if (i < 0) return;
      const next = { ...p.furniture[i], ...patch };
      const r = p.rooms.find((r) => r.id === next.roomId);
      if (!r) return;
      const b = footprint(next);
      if (b.width > r.width || b.depth > r.depth) {
        set({
          message:
            "This item is larger than the room. Reduce its dimensions first.",
        });
        return;
      }
      const adjusted = constrain(next, r);
      p.furniture[i] = adjusted;
      if (!inRoom(next, r))
        queueMicrotask(() =>
          set({
            message:
              "The wall is the limit. This item was kept inside the room.",
          }),
        );
    });
  },
  add: (catalogId, roomId) => {
    const p = get().project,
      r = p?.rooms.find((r) => r.id === roomId),
      c = getCatalog(catalogId);
    if (!r || !p) return;
    if (p.furniture.length >= 500) {
      set({ message: "A project can contain up to 500 furniture pieces." });
      return;
    }
    if (c.width > r.width || c.depth > r.depth) {
      set({ message: "This furniture is too large for this room." });
      return;
    }
    const offset = (p.furniture.length % 5) * 150;
    const item = constrain(
      furniture(
        catalogId,
        roomId,
        r.x + (r.width - c.width) / 2 + offset,
        r.y + (r.depth - c.depth) / 2 + offset,
      ),
      r,
    );
    get().edit((p) => {
      p.furniture.push(item);
    });
    set({ selected: item.id });
  },
  remove: () => {
    const id = get().selected;
    get().edit((p) => {
      p.furniture = p.furniture.filter((f) => f.id !== id);
    });
    set({ selected: null });
  },
  duplicate: () => {
    const p = get().project,
      i = p?.furniture.find((f) => f.id === get().selected);
    if (!i || !p) return;
    if (p.furniture.length >= 500) {
      set({ message: "A project can contain up to 500 furniture pieces." });
      return;
    }
    const r = p.rooms.find((r) => r.id === i.roomId)!;
    const copy = constrain({ ...i, id: uid(), x: i.x + 150, y: i.y + 150 }, r);
    get().edit((p) => {
      p.furniture.push(copy);
    });
    set({ selected: copy.id });
  },
  undo: () => {
    const { past, project, future, generation } = get();
    if (!past.length || !project) return;
    set({
      project: { ...past[past.length - 1], revision: project.revision },
      past: past.slice(0, -1),
      future: [project, ...future],
      generation: generation + 1,
      selected: null,
    });
  },
  redo: () => {
    const { past, project, future, generation } = get();
    if (!future.length || !project) return;
    set({
      project: { ...future[0], revision: project.revision },
      past: [...past, project],
      future: future.slice(1),
      generation: generation + 1,
      selected: null,
    });
  },
  ack: (revision) =>
    set((s) => ({ project: s.project ? { ...s.project, revision } : null })),
}));
