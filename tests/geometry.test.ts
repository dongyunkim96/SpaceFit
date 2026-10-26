import { describe, it, expect, beforeEach } from "vitest";
import {
  area,
  bounds,
  constrain,
  footprint,
  formatLength,
  inRoom,
  inputLength,
  overlaps,
  parseLength,
  pointerToWorld,
  snap,
} from "../src/lib/geometry";
import { createDemo, createProject, templates } from "../src/data/templates";
import { catalog, getCatalog } from "../src/data/catalog";
import { copyProject, parseProject } from "../src/lib/model";
import { useEditor } from "../src/lib/editor";
describe("measurements and canvas geometry", () => {
  it("converts imperial and metric measurements to millimeters", () => {
    expect(parseLength(`12' 6"`, "imperial")).toBe(3810);
    expect(parseLength("150", "imperial")).toBe(3810);
    expect(parseLength("381", "metric")).toBe(3810);
    expect(formatLength(3810)).toBe("12′ 6″");
  });
  it("unit display changes do not change geometry; input retains submillimeter precision", () => {
    for (const mm of [100, 1234.567, 4500, 9999.9]) {
      expect(parseLength(inputLength(mm, "metric"), "metric")).toBeCloseTo(
        mm,
        1,
      );
      expect(parseLength(inputLength(mm, "imperial"), "imperial")).toBeCloseTo(
        mm,
        1,
      );
    }
  });
  it("rejects invalid and unrealistic values", () => {
    for (const n of ["0", "-12", "NaN", "hello", "1000000"])
      expect(() => parseLength(n, "metric")).toThrow();
  });
  it("translates letterboxed canvas coordinates after zoom and pan", () => {
    expect(
      pointerToWorld(
        { x: 250, y: 150 },
        { left: 0, top: 0, width: 500, height: 300 },
        { x: 1000, y: 2000, width: 2000, height: 1000 },
      ),
    ).toEqual({ x: 2000, y: 2500 });
  });
  it("snaps to a 50 mm grid", () => {
    expect(snap(127)).toBe(150);
    expect(snap(-127)).toBe(-150);
  });
  it("rotates the bounding box and constrains furniture to walls", () => {
    const p = createDemo(),
      i = { ...p.furniture[1], rotation: 90 as const, x: 5990, y: 4790 };
    expect(footprint(i)).toEqual({ width: i.depth, depth: i.width });
    expect(inRoom(i, p.rooms[0])).toBe(false);
    expect(inRoom(constrain(i, p.rooms[0]), p.rooms[0])).toBe(true);
  });
  it("detects solid overlaps while keeping rugs in their own layer", () => {
    const p = createDemo(),
      a = p.furniture[1],
      b = { ...a, id: "other" };
    expect(overlaps(a, b)).toBe(true);
    expect(overlaps(a, { ...b, x: 10000 })).toBe(false);
    expect(getCatalog("rug").layer).toBe("floor");
  });
});
describe("template integrity and schemas", () => {
  it("provides at least eight valid, nonoverlapping layouts with valid openings and contained furniture", () => {
    expect(templates.length).toBeGreaterThanOrEqual(8);
    for (const t of templates) {
      const p = createProject(t);
      expect(() => parseProject(p)).not.toThrow();
      for (const i of p.furniture)
        expect(
          inRoom(
            i,
            p.rooms.find((r) => r.id === i.roomId)!,
          ),
        ).toBe(true);
      for (const [index, r] of p.rooms.entries()) {
        for (const other of p.rooms.slice(index + 1))
          expect(
            r.x < other.x + other.width &&
              r.x + r.width > other.x &&
              r.y < other.y + other.depth &&
              r.y + r.depth > other.y,
          ).toBe(false);
      }
      for (const o of p.openings) {
        const r = p.rooms.find((r) => r.id === o.roomId)!;
        expect(o.width).toBeLessThanOrEqual(
          o.wall === "top" || o.wall === "bottom" ? r.width : r.depth,
        );
      }
      expect(area(p)).toBeGreaterThan(0);
      expect(bounds(p.rooms).width).toBeGreaterThan(0);
    }
  });
  it("provides 40 unique furniture footprints with realistic editable limits", () => {
    expect(catalog.length).toBeGreaterThanOrEqual(40);
    expect(new Set(catalog.map((c) => c.id)).size).toBe(catalog.length);
    expect(new Set(catalog.map((c) => c.shape)).size).toBeGreaterThan(5);
  });
  it("rejects corrupt data and unsupported versions without silently migrating", () => {
    const p = createDemo();
    expect(() => parseProject({ ...p, schemaVersion: 2 })).toThrow();
    expect(() =>
      parseProject({ ...p, rooms: [{ ...p.rooms[0], width: -1 }] }),
    ).toThrow();
    expect(() =>
      parseProject({
        ...p,
        furniture: [{ ...p.furniture[0], roomId: "missing" }],
      }),
    ).toThrow();
  });
  it("duplicates projects without changing the source or its ownership document ID", () => {
    const p = createDemo(),
      copy = copyProject(p);
    expect(copy.id).not.toBe(p.id);
    expect(copy.revision).toBe(0);
    copy.rooms[0].width = 100;
    expect(p.rooms[0].width).not.toBe(100);
  });
});
describe("editor transactions", () => {
  beforeEach(() => useEditor.getState().load(createDemo()));
  it("groups a move into one undo action and restores it with redo", () => {
    const before = useEditor.getState().project!,
      item = before.furniture[1];
    useEditor.getState().updateItem(item.id, { x: item.x + 250 });
    expect(useEditor.getState().past).toHaveLength(1);
    useEditor.getState().undo();
    expect(useEditor.getState().project!.furniture[1].x).toBe(item.x);
    useEditor.getState().redo();
    expect(useEditor.getState().project!.furniture[1].x).toBe(item.x + 250);
  });
  it("keeps furniture when a room is resized smaller", () => {
    useEditor.getState().edit((p) => {
      p.rooms[0].width = 1000;
    });
    expect(useEditor.getState().project!.furniture).toHaveLength(9);
  });
  it("does not introduce history or mutate geometry for a display-only read", () => {
    const p = useEditor.getState().project!;
    formatLength(p.rooms[0].width, "metric");
    expect(useEditor.getState().past).toHaveLength(0);
  });
  it("preserves the current revision through undo", () => {
    const s = useEditor.getState();
    s.edit((p) => {
      p.name = "New name";
    });
    s.ack(5);
    s.undo();
    expect(useEditor.getState().project!.revision).toBe(5);
  });
});
