import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";
import type { Project } from "./model";
import { parseProject } from "./model";
import { ConflictError, db } from "./persistence";
const env = import.meta.env;
export const accountConfigured = Boolean(
  env.VITE_FIREBASE_API_KEY &&
  env.VITE_FIREBASE_PROJECT_ID &&
  env.VITE_FIREBASE_APP_ID,
);
let initialized: Promise<{ auth: Auth; firestore: Firestore }> | null = null;
async function initialize() {
  if (!accountConfigured)
    throw Error("Account storage has not been configured.");
  if (!initialized)
    initialized = (async () => {
      const [
        { initializeApp },
        { getAuth, connectAuthEmulator },
        { getFirestore, connectFirestoreEmulator },
      ] = await Promise.all([
        import("firebase/app"),
        import("firebase/auth"),
        import("firebase/firestore"),
      ]);
      const app = initializeApp({
        apiKey: env.VITE_FIREBASE_API_KEY,
        authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: env.VITE_FIREBASE_PROJECT_ID,
        appId: env.VITE_FIREBASE_APP_ID,
      });
      const auth = getAuth(app),
        firestore = getFirestore(app);
      if (env.VITE_USE_FIREBASE_EMULATORS === "true") {
        connectAuthEmulator(auth, "http://127.0.0.1:9099", {
          disableWarnings: true,
        });
        connectFirestoreEmulator(firestore, "127.0.0.1", 8080);
      }
      return { auth, firestore };
    })();
  return initialized;
}
export async function getAuthInstance() {
  return accountConfigured ? (await initialize()).auth : null;
}
export function cloudProjects(userId: string) {
  const ready = async () => ({
    ...(await initialize()),
    api: await import("firebase/firestore"),
  });
  return {
    list: async () => {
      const { firestore, api } = await ready();
      const s = await api.getDocs(
        api.collection(firestore, "users", userId, "projects"),
      );
      return s.docs.map((d) => parseProject(d.data()));
    },
    get: async (id: string) => {
      const { firestore, api } = await ready();
      const d = await api.getDoc(
        api.doc(firestore, "users", userId, "projects", id),
      );
      return d.exists() ? parseProject(d.data()) : undefined;
    },
    remove: async (id: string) => {
      const { firestore, api } = await ready();
      await api.deleteDoc(api.doc(firestore, "users", userId, "projects", id));
      await db.accountCache.delete(`${userId}:${id}`);
    },
    save: async (p: Project, expectedRevision: number) => {
      const { firestore, api } = await ready();
      return api.runTransaction(firestore, async (t) => {
        const r = api.doc(firestore, "users", userId, "projects", p.id),
          old = await t.get(r);
        if (
          old.exists()
            ? old.data().revision !== expectedRevision
            : expectedRevision !== 0
        )
          throw new ConflictError();
        const next = {
          ...p,
          revision: expectedRevision + 1,
          updatedAt: new Date().toISOString(),
        };
        t.set(r, next);
        return next;
      });
    },
  };
}
