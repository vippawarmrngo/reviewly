import { goToSection } from "../../route";
import { LogoMark } from "../brand/Logo";
import { Link } from "../Link";
import { Icon } from "../Icon";

const SOURCE = "https://github.com/vipawar1104/reviewly";

export function SiteFooter({ installUrl }: { installUrl: string | null }) {
  const year = new Date().getFullYear();
  const jump = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    goToSection(id);
  };
  return (
    <footer className="site-footer">
      <div className="site-footer-grid">
        <div>
          <span className="brand">
            <LogoMark size={26} />
            Reviewly
          </span>
          <p className="muted">AI code review for GitHub pull requests.</p>
        </div>
        <div>
          <h3>Product</h3>
          <Link to="/" onClick={jump("how")}>How it works</Link>
          <Link to="/" onClick={jump("features")}>Features</Link>
          <Link to="/" onClick={jump("pricing")}>Pricing</Link>
          <Link to="/" onClick={jump("faq")}>FAQ</Link>
          <Link to="/docs">Docs</Link>
          <Link to="/changelog">Changelog</Link>
        </div>
        <div>
          <h3>Trust</h3>
          <Link to="/" onClick={jump("security")}>Security</Link>
          <Link to="/status">Status</Link>
          <Link to="/privacy">Data handling</Link>
          <a href={SOURCE} target="_blank" rel="noopener noreferrer">
            Source code <Icon name="external-link" size={11} />
          </a>
        </div>
        <div>
          <h3>Get started</h3>
          {installUrl && <a href={installUrl}>Install on GitHub</a>}
          <Link to="/signin">Sign in</Link>
        </div>
      </div>
      <div className="site-footer-base">
        <span>© {year} Reviewly. Released under the MIT license.</span>
        <button type="button" className="link" onClick={() => window.scrollTo?.({ top: 0, behavior: "smooth" })}>
          Back to top
        </button>
      </div>
    </footer>
  );
}
