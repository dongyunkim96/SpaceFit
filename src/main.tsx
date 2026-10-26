import { StrictMode, Suspense, lazy, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth";
import { cloudProjects } from "./lib/firebase";
import { localProjects } from "./lib/persistence";
import { createDemo } from "./data/templates";
import { copyProject, parseProject } from "./lib/model";
import { Header, Footer } from "./components/Brand";
import Home from "./pages/Home";
import "./styles.css";
const Planner = lazy(() => import("./pages/Planner")),
  Templates = lazy(() => import("./pages/Templates")),
  NewSpace = lazy(() => import("./pages/NewSpace")),
  Dashboard = lazy(() => import("./pages/Dashboard")),
  Account = lazy(() => import("./pages/Account")),
  About = lazy(() => import("./pages/About")),
  Supporting = lazy(() => import("./pages/Supporting"));
function Marketing() {
  return (
    <>
      <Header />
      <Outlet />
      <Footer />
    </>
  );
}
let demoPromise: Promise<string> | null = null;
function Demo() {
  const navigate = useNavigate(),
    location = useLocation(),
    { user, loading } = useAuth(),
    [error, setError] = useState("");
  useEffect(() => {
    if (loading) return;
    let cancelled = false;
    if (!demoPromise) {
      let p = createDemo();
      try {
        if (location.state?.project)
          p = copyProject(
            parseProject(location.state.project),
            location.state.project.name,
          );
      } catch {
        /* An invalid preview falls back to the built-in demo. */
      }
      demoPromise = (user ? cloudProjects(user.uid) : localProjects)
        .save(p, 0)
        .then((p) => p.id)
        .finally(() => {
          setTimeout(() => {
            demoPromise = null;
          }, 500);
        });
    }
    void demoPromise
      .then((id) => {
        if (!cancelled) navigate(`/planner/${id}`, { replace: true });
      })
      .catch(() =>
        setError(
          "Your demo could not be saved. Check browser storage permissions and try again.",
        ),
      );
    return () => {
      cancelled = true;
    };
  }, [user, loading, navigate, location.state]);
  return (
    <main className="empty-state" role="status">
      <h1>
        {error ? "A little interruption." : "Making room for your ideas…"}
      </h1>
      <p>{error || "Opening an editable demo, just for you."}</p>
    </main>
  );
}
function PageTitle() {
  const { pathname } = useLocation();
  useEffect(() => {
    const name = pathname.startsWith("/planner")
      ? "Your space"
      : {
          "/": "Make room for better living",
          "/templates": "A place to begin",
          "/about": "A thoughtful approach",
          "/my-spaces": "My spaces",
          "/new": "Start planning",
          "/sign-in": "Welcome back",
          "/sign-up": "Make yourself at home",
          "/forgot-password": "A fresh start",
          "/privacy": "Your privacy",
          "/help": "Planning guide",
        }[pathname] || "Find your way home";
    document.title = `${name} — SPACEFIT`;
  }, [pathname]);
  return null;
}
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <PageTitle />
        <Suspense
          fallback={
            <div className="page-loading" role="status">
              Making a little room…
            </div>
          }
        >
          <Routes>
            <Route element={<Marketing />}>
              <Route index element={<Home />} />
              <Route path="templates" element={<Templates />} />
              <Route path="new" element={<NewSpace />} />
              <Route path="my-spaces" element={<Dashboard />} />
              <Route path="about" element={<About />} />
              <Route path="sign-in" element={<Account key="sign-in" />} />
              <Route path="sign-up" element={<Account key="sign-up" />} />
              <Route
                path="forgot-password"
                element={<Account key="forgot" />}
              />
              <Route path="privacy" element={<Supporting />} />
              <Route path="help" element={<Supporting />} />
              <Route path="*" element={<Supporting />} />
            </Route>
            <Route path="demo" element={<Demo />} />
            <Route path="planner/:projectId" element={<Planner />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
