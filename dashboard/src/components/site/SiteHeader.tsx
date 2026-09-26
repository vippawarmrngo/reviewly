import { goToSection } from "../../route";
import { Link } from "../Link";
import type { Theme } from "../../theme";
import { Icon } from "../Icon";

interface Props {
  theme: Theme;
  onToggleTheme: () => void;
  installUrl: string | null;
}

const LINKS = [
  ["how", "How it works"],
  ["features", "Features"],
  ["security", "Security"],
  ["pricing", "Pricing"],
  ["faq", "FAQ"],
] as const;

/** The public site's header: section links, sign in, and the one thing we want people to do. */
export function SiteHeader({ theme, onToggleTheme, installUrl }: Props) {
  return (
    <header className="header site-header">
      <Link className="brand" to="/" aria-label="Reviewly home">
        <span className="mark">
          <Icon name="check" size={14} />
        </span>
        Reviewly
      </Link>
      <nav aria-label="Sections" className="nav site-nav">
        {LINKS.map(([id, label]) => (
          <Link
            key={id}
            to="/"
            onClick={(e) => {
              e.preventDefault();
              goToSection(id);
            }}
          >
            {label}
          </Link>
        ))}
      </nav>
      <span className="spacer" />
      <button className="btn" onClick={onToggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
        <Icon name={theme === "dark" ? "sun" : "moon"} size={14} />
      </button>
      <Link className="link" to="/signin">
        Sign in
      </Link>
      {installUrl && (
        <a className="btn primary" href={installUrl}>
          <Icon name="plus" size={14} />
          <span className="hide-narrow">Install on GitHub</span>
          <span className="show-narrow">Install</span>
        </a>
      )}
    </header>
  );
}
