// @vitest-environment node
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, it, expect } from "vitest";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { createDemo } from "../src/data/templates";
let env: RulesTestEnvironment;
beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-spacefit",
    firestore: {
      host: "127.0.0.1",
      port: 8080,
      rules: readFileSync("firestore.rules", "utf8"),
    },
  });
});
afterAll(async () => {
  await env?.cleanup();
});
describe("Firestore ownership and revision isolation", () => {
  it("permits an owner and rejects user B and anonymous reads and writes", async () => {
    const p = { ...createDemo(), revision: 1 };
    const a = env.authenticatedContext("user-a").firestore(),
      b = env.authenticatedContext("user-b").firestore(),
      anon = env.unauthenticatedContext().firestore();
    await assertSucceeds(setDoc(doc(a, "users/user-a/projects", p.id), p));
    expect(
      (
        await assertSucceeds(getDoc(doc(a, "users/user-a/projects", p.id)))
      ).exists(),
    ).toBe(true);
    await assertFails(getDoc(doc(b, "users/user-a/projects", p.id)));
    await assertFails(
      setDoc(doc(b, "users/user-a/projects", p.id), { ...p, revision: 2 }),
    );
    await assertFails(getDoc(doc(anon, "users/user-a/projects", p.id)));
    await assertFails(setDoc(doc(anon, "users/user-a/projects", p.id), p));
  });
  it("requires sequential revisions and immutable creation timestamps", async () => {
    const p = { ...createDemo(), revision: 1 },
      fs = env.authenticatedContext("owner").firestore(),
      ref = doc(fs, "users/owner/projects", p.id);
    await assertSucceeds(setDoc(ref, p));
    await assertFails(setDoc(ref, { ...p, revision: 3 }));
    await assertFails(
      setDoc(ref, {
        ...p,
        revision: 2,
        createdAt: new Date(Date.now() + 1000).toISOString(),
      }),
    );
    await assertSucceeds(
      setDoc(ref, { ...p, revision: 2, name: "Revised space" }),
    );
  });
});
