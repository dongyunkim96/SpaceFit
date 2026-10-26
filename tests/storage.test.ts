import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import { db, localProjects } from "../src/lib/persistence";
import { createDemo } from "../src/data/templates";
afterEach(async () => {
  await db.projects.clear();
  await db.accountCache.clear();
});
describe("durable local storage and revisions", () => {
  it("round trips the entire layout and room dimensions", async () => {
    const p = createDemo();
    p.rooms[0].width = 6350;
    const saved = await localProjects.save(p, 0);
    const restored = await localProjects.get(p.id);
    expect(restored).toEqual(saved);
    expect(restored!.rooms[0].width).toBe(6350);
    expect(restored!.furniture).toHaveLength(9);
  });
  it("rejects stale revisions and preserves the newer version", async () => {
    const p = createDemo();
    const first = await localProjects.save(p, 0);
    await localProjects.save({ ...first, name: "Newer edit" }, 1);
    await expect(
      localProjects.save({ ...first, name: "Late edit" }, 1),
    ).rejects.toThrow("another tab or device");
    expect((await localProjects.get(p.id))!.name).toBe("Newer edit");
  });
  it("serializes concurrent saves so only the matching revision succeeds", async () => {
    const p = await localProjects.save(createDemo(), 0);
    const results = await Promise.allSettled([
      localProjects.save({ ...p, name: "Tab A" }, 1),
      localProjects.save({ ...p, name: "Tab B" }, 1),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((r) => r.status === "rejected")).toHaveLength(1);
    expect((await localProjects.get(p.id))!.revision).toBe(2);
  });
  it("isolates account caches from guest drafts and from other accounts", async () => {
    const p = createDemo();
    await db.accountCache.put({
      key: `a:${p.id}`,
      owner: "a",
      project: p,
      pending: true,
    });
    expect(await localProjects.list()).toEqual([]);
    expect(await db.accountCache.where("owner").equals("b").toArray()).toEqual(
      [],
    );
    expect(await db.accountCache.get(`b:${p.id}`)).toBeUndefined();
  });
});
