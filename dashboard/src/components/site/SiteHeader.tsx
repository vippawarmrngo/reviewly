import { m, useScroll } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { parseRoute, goToSection } from "../../route";
import { useMotionOk } from "../../motion/useMotionOk";
import { useScrollSpy } from "../../motion/useScrollSpy";
import { useScrolled } from "../../motion/useScrolled";
import type { Theme } from "../../theme";
import { LogoMark } from "../brand/Logo";
import { Icon } from "../Icon";
import { Link } from "../Link";

interface Props {
  theme: Theme;
  onToggleTheme: () => void;
  installUrl: string | null;
}

export const SECTIONS = [
  ["how", "How it works"],
  ["features", "Features"],
  ["security", "Security"],
  ["pricing", "Pricing"],
  ["faq", "FAQ"],
] as const;
const IDS = SECTIONS.map(([id]) => id);

function ProgressBar() {
  const { scrollYProgress } = useScroll();
  return <m.div className="progress" style={{ scaleX: scrollYProgress }} aria-hidden="true" />;
}

/** The public site's header: section links that follow the page, sign in, and the one thing we want people to do. */
export function SiteHeader({ theme, onToggleTheme, installUrl }: Props) {
  const ok = useMotionOk();
  const scrolled = useScrolled();
  const route = parseRoute(window.location.pathname);
  const onHome = route === "home";
  const onDocs = route === "docs";
  const active = useScrollSpy(IDS, onHome);
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  // Escape closes the menu and gives focus back to the button that opened it.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const go = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setOpen(false);
    goToSection(id);
  };

  return (
    <header className={`header site-header${scrolled ? " scrolled" : ""}`}>
      {ok && onHome && <ProgressBar />}
      <Link className="brand" to="/" aria-label="Reviewly home" onClick={() => setOpen(false)}>
        <LogoMark size={26} />
        Reviewly
      </Link>
      <nav aria-label="Sections" className="nav site-nav">
        {SECTIONS.map(([id, label]) => (
          <Link key={id} to="/" onClick={go(id)} aria-current={active === id ? "location" : undefined}>
            {label}
          </Link>
        ))}
        <Link to="/docs" aria-current={onDocs ? "page" : undefined}>
          Docs
        </Link>
      </nav>
      <span className="spacer" />
      <button className="btn" onClick={onToggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
        <Icon name={theme === "dark" ? "sun" : "moon"} size={14} />
      </button>
      <Link className="link hide-narrow" to="/signin">
        Sign in
      </Link>
      {installUrl && (
        <a className="btn primary hide-narrow" href={installUrl}>
          <Icon name="plus" size={14} />
          Install on GitHub
        </a>
      )}
      <button
        ref={button}
        type="button"
        className="btn menu-btn"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((o) => !o)}
      >
        <Icon name={open ? "close" : "menu"} size={16} />
      </button>
      <div id="mobile-menu" ref={panel} className="mobile-menu" hidden={!open}>
        {SECTIONS.map(([id, label]) => (
          <Link key={id} to="/" onClick={go(id)}>
            {label}
          </Link>
        ))}
        <Link to="/docs" onClick={() => setOpen(false)}>
          Docs
        </Link>
        <Link to="/signin" onClick={() => setOpen(false)}>
          Sign in
        </Link>
        {installUrl && (
          <a className="btn primary" href={installUrl}>
            <Icon name="plus" size={14} />
            Install on GitHub
          </a>
        )}
      </div>
    </header>
  );
}
