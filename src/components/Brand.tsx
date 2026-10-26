import { ArrowUpRight, Menu, X, ArrowRight, MoveUpRight } from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link
      to="/"
      className={`logo ${light ? "light" : ""}`}
      aria-label="SPACEFIT home"
    >
      <svg
        width="29"
        height="29"
        viewBox="0 0 30 30"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M3 13V3H27V27H17M3 18V27H12V13H27M3 13H17V3"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
      SPACEFIT<span className="logo-dot">®</span>
    </Link>
  );
}
export function Header() {
  const [open, setOpen] = useState(false),
    [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 15);
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className={`site-header ${scrolled ? "scrolled" : ""}`}>
        <div className="nav-inner">
          <Logo />
          <nav
            aria-label="Main navigation"
            className={open ? "nav-links open" : "nav-links"}
          >
            <Link
              to="/#how-it-works"
              onClick={() => {
                setOpen(false);
                setTimeout(
                  () =>
                    document
                      .getElementById("how-it-works")
                      ?.scrollIntoView({ behavior: "smooth" }),
                  50,
                );
              }}
            >
              How it works
            </Link>
            <NavLink to="/templates">Templates</NavLink>
            <NavLink to="/about">About</NavLink>
            <span className="mobile-nav">
              <NavLink to="/my-spaces">My spaces</NavLink>
              <NavLink to="/sign-in">{user ? "Account" : "Sign in"}</NavLink>
            </span>
          </nav>
          <div className="nav-actions">
            <NavLink to="/my-spaces" className="my-spaces-link">
              My spaces
            </NavLink>
            <Link to="/sign-in" className="sign-in-link">
              {user ? "Account" : "Sign in"}
            </Link>
            <Link className="button small" to="/new">
              Start planning <ArrowUpRight size={16} />
            </Link>
          </div>
          <button
            className="menu-toggle icon-button"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </header>
    </>
  );
}
export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top">
        <div>
          <Logo />
          <p>Make room for better living.</p>
        </div>
        <div className="footer-links">
          <Link to="/templates">
            Find your starting point <ArrowUpRight size={16} />
          </Link>
          <Link to="/about">
            A more thoughtful approach <ArrowUpRight size={16} />
          </Link>
          <Link to="/help">
            Planning help <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>
      <div className="footer-bottom">
        <span>
          © {new Date().getFullYear()} SPACEFIT. A concept for considered
          living.
        </span>
        <div>
          <Link to="/privacy">Privacy & storage</Link>
          <span>Designed with space in mind.</span>
        </div>
      </div>
    </footer>
  );
}
export function FinalCTA() {
  return (
    <section className="final-cta">
      <div>
        <span className="eyebrow light">A BETTER FIT STARTS HERE</span>
        <h2>
          Make space for
          <br />
          <em>your kind of living.</em>
        </h2>
      </div>
      <div>
        <p>
          Big ideas. Small adjustments.
          <br />A home that feels more like you.
        </p>
        <Link to="/new" className="button cream">
          Plan my space <ArrowUpRight size={18} />
        </Link>
        <span className="cta-note">Free to explore. No account needed.</span>
      </div>
      <MoveUpRight className="cta-watermark" aria-hidden="true" />
    </section>
  );
}
export function TextLink({
  to,
  children,
}: {
  to: string;
  children: React.ReactNode;
}) {
  return (
    <Link to={to} className="text-link">
      {children}
      <ArrowRight size={17} />
    </Link>
  );
}
