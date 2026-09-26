import { goToSection } from "../../route";
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
      <a className="brand" href="#/" aria-label="Reviewly home">
        <span className="mark">
          <Icon name="check" size={14} />
        </span>
        Reviewly
      </a>
      <nav aria-label="Sections" className="nav site-nav">
        {LINKS.map(([id, label]) => (
          <a
            key={id}
            href="#/"
            onClick={(e) => {
              e.preventDefault();
              goToSection(id);
            }}
          >
            {label}
          </a>
        ))}
      </nav>
      <span className="spacer" />
      <button className="btn" onClick={onToggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
        <Icon name={theme === "dark" ? "sun" : "moon"} size={14} />
      </button>
      <a className="link" href="#/signin">
        Sign in
      </a>
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
