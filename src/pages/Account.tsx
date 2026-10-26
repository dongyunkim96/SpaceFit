import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { ArrowUpRight, Check, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { accountConfigured, getAuthInstance } from "../lib/firebase";
import { useAuth } from "../lib/auth";
const schema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string(),
});
type Values = z.infer<typeof schema>;
export default function Account() {
  const location = useLocation(),
    navigate = useNavigate(),
    { user } = useAuth();
  const signup = location.pathname === "/sign-up",
    forgot = location.pathname === "/forgot-password";
  const [visible, setVisible] = useState(false),
    [error, setError] = useState(""),
    [sent, setSent] = useState(false),
    [busy, setBusy] = useState(false);
  const {
    register,
    handleSubmit,
    setError: fieldError,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });
  async function submit(v: Values) {
    setError("");
    const auth = await getAuthInstance();
    if (!auth) {
      setError(
        "Cloud accounts are not configured in this installation. You can still plan and save as a guest.",
      );
      return;
    }
    if (!forgot && v.password.length < (signup ? 8 : 1)) {
      fieldError("password", {
        message: signup ? "Use at least 8 characters." : "Enter your password.",
      });
      return;
    }
    setBusy(true);
    try {
      if (forgot) {
        await sendPasswordResetEmail(auth, v.email);
        setSent(true);
      } else {
        if (signup)
          await createUserWithEmailAndPassword(auth, v.email, v.password);
        else await signInWithEmailAndPassword(auth, v.email, v.password);
        navigate("/my-spaces");
      }
    } catch (e) {
      const code = (e as { code?: string }).code;
      setError(
        code === "auth/email-already-in-use"
          ? "An account already uses this email. Try signing in."
          : code === "auth/invalid-credential"
            ? "The email or password does not match. Please try again."
            : code === "auth/too-many-requests"
              ? "Too many attempts. Give it a moment, then try again."
              : "We could not complete that request. Check your connection and try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (user)
    return (
      <main id="main" className="account-page page-width">
        <div className="form-panel account-panel">
          <span className="eyebrow">YOUR SPACE, CONNECTED</span>
          <h1>
            Welcome <em>home.</em>
          </h1>
          <p>Signed in as {user.email}.</p>
          <Link className="button full" to="/my-spaces">
            Open my spaces <ArrowUpRight size={18} />
          </Link>
          <button
            className="button secondary full"
            onClick={() => {
              void getAuthInstance()
                .then((auth) => (auth ? signOut(auth) : undefined))
                .then(() => navigate("/"));
            }}
          >
            Sign out
          </button>
          <p className="form-note">
            Your account projects remain in your account. Guest drafts stay in
            this browser.
          </p>
        </div>
      </main>
    );
  return (
    <main id="main" className="account-page page-width">
      <div className="account-copy">
        <span className="eyebrow">MAKE ROOM FOR WHAT’S NEXT</span>
        <h1>
          {forgot ? (
            <>
              A fresh
              <br />
              <em>start.</em>
            </>
          ) : signup ? (
            <>
              Your ideas.
              <br />
              <em>At home.</em>
            </>
          ) : (
            <>
              Welcome
              <br />
              <em>back.</em>
            </>
          )}
        </h1>
        <p>
          {forgot
            ? "A small reset. Then back to making room."
            : "A place for all the possibilities of your home."}
        </p>
        <div className="account-line-art" aria-hidden="true">
          <span>sf.</span>
        </div>
        <div className="account-benefits">
          <span>
            <Check size={16} /> Plan with real dimensions
          </span>
          <span>
            <Check size={16} /> Arrange around your everyday
          </span>
          <span>
            <Check size={16} /> Keep your favorite possibilities
          </span>
        </div>
      </div>
      <div className="form-panel account-panel">
        <div className="form-heading">
          <LockKeyhole size={20} />
          <h2>
            {forgot
              ? "Reset your password"
              : signup
                ? "Make yourself at home"
                : "Sign in to your space"}
          </h2>
        </div>
        {!accountConfigured && (
          <div className="notice">
            <strong>Guest planning is ready.</strong>
            <p>
              Cloud accounts are not configured for this installation yet. You
              can create, edit, and save spaces in this browser without signing
              in.
            </p>
            <Link className="text-link" to="/new">
              Continue as a guest <ArrowUpRight size={16} />
            </Link>
          </div>
        )}
        {sent ? (
          <div className="notice" role="status">
            <Check />
            <p>
              If an account exists for that email, you’ll receive a password
              reset link.
            </p>
            <Link to="/sign-in" className="text-link">
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(submit)} noValidate>
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@home.com"
              {...register("email")}
              aria-invalid={Boolean(errors.email)}
            />
            {errors.email && (
              <p className="field-error">{errors.email.message}</p>
            )}
            {!forgot && (
              <>
                <label htmlFor="password">Password</label>
                <div className="password-input">
                  <input
                    id="password"
                    type={visible ? "text" : "password"}
                    autoComplete={signup ? "new-password" : "current-password"}
                    placeholder={
                      signup ? "At least 8 characters" : "Your password"
                    }
                    {...register("password")}
                    aria-invalid={Boolean(errors.password)}
                  />
                  <button
                    type="button"
                    aria-label={visible ? "Hide password" : "Show password"}
                    className="icon-button"
                    onClick={() => setVisible(!visible)}
                  >
                    {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="field-error">{errors.password.message}</p>
                )}
                {!signup && (
                  <Link className="forgot-link" to="/forgot-password">
                    Forgot your password?
                  </Link>
                )}
              </>
            )}
            {error && (
              <p className="notice error" role="alert">
                {error}
              </p>
            )}
            <button
              className="button full"
              disabled={busy || !accountConfigured}
            >
              {busy
                ? "One moment…"
                : forgot
                  ? "Send reset link"
                  : signup
                    ? "Create account"
                    : "Sign in"}
              <ArrowUpRight size={17} />
            </button>
          </form>
        )}
        <div className="account-switch">
          {forgot ? (
            <Link to="/sign-in">Back to sign in</Link>
          ) : signup ? (
            <>
              Already have a space? <Link to="/sign-in">Sign in</Link>
            </>
          ) : (
            <>
              New around here? <Link to="/sign-up">Create an account</Link>
            </>
          )}
        </div>
        <p className="form-note">
          Your plans are personal.{" "}
          <Link to="/privacy">Read about privacy and storage.</Link>
        </p>
      </div>
    </main>
  );
}
