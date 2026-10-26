import Dexie, { type Table } from "dexie";
import type { Project } from "./model";
class SpaceDatabase extends Dexie {
  projects!: Table<Project, string>;
  accountCache!: Table<
    { key: string; owner: string; project: Project; pending: boolean },
    string
  >;
  constructor() {
    super("spacefit-drafts");
    this.version(1).stores({ projects: "id,updatedAt,name" });
    this.version(2).stores({
      projects: "id,updatedAt,name",
      accountCache: "key,owner",
    });
  }
}
export const db = new SpaceDatabase();
export class ConflictError extends Error {
  constructor() {
    super(
      "This space changed in another tab or device. Save a copy or reload the latest version.",
    );
  }
}
export const localProjects = {
  list: () => db.projects.orderBy("updatedAt").reverse().toArray(),
  get: (id: string) => db.projects.get(id),
  remove: (id: string) => db.projects.delete(id),
  save: async (p: Project, expectedRevision: number) =>
    db.transaction("rw", db.projects, async () => {
      const old = await db.projects.get(p.id);
      if (old ? old.revision !== expectedRevision : expectedRevision !== 0)
        throw new ConflictError();
      const next = {
        ...p,
        revision: expectedRevision + 1,
        updatedAt: new Date().toISOString(),
      };
      await db.projects.put(next);
      return next;
    }),
};
export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export const exportJSON = (p: Project) =>
  download(
    new Blob([JSON.stringify(p, null, 2)], { type: "application/json" }),
    `${p.name}.spacefit.json`,
  );
export async function exportPNG(svg: SVGSVGElement, name: string) {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", "1800");
  clone.setAttribute("height", "1400");
  const url = URL.createObjectURL(
    new Blob([new XMLSerializer().serializeToString(clone)], {
      type: "image/svg+xml",
    }),
  );
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = 1800;
    c.height = 1400;
    const ctx = c.getContext("2d");
    if (!ctx) throw Error("Image export is unavailable in this browser.");
    ctx.fillStyle = "#f7f5ef";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0, c.width, c.height);
    const blob = await new Promise<Blob>((resolve, reject) =>
      c.toBlob(
        (b) =>
          b ? resolve(b) : reject(Error("The image could not be created.")),
        "image/png",
      ),
    );
    download(blob, `${name}.png`);
  } finally {
    URL.revokeObjectURL(url);
  }
}
