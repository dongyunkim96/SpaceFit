import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "firebase/auth";
import { accountConfigured, getAuthInstance } from "./firebase";
const Context = createContext<{ user: User | null; loading: boolean }>({
  user: null,
  loading: false,
});
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ user: User | null; loading: boolean }>({
    user: null,
    loading: accountConfigured,
  });
  useEffect(() => {
    let disposed = false;
    let unsubscribe: (() => void) | undefined;
    void getAuthInstance()
      .then(async (auth) => {
        if (disposed) return;
        if (!auth) {
          setState({ user: null, loading: false });
          return;
        }
        const { onAuthStateChanged } = await import("firebase/auth");
        if (!disposed)
          unsubscribe = onAuthStateChanged(auth, (user) =>
            setState({ user, loading: false }),
          );
      })
      .catch(() => {
        if (!disposed) setState({ user: null, loading: false });
      });
    return () => {
      disposed = true;
      unsubscribe?.();
    };
  }, []);
  return <Context.Provider value={state}>{children}</Context.Provider>;
}
export const useAuth = () => useContext(Context);
