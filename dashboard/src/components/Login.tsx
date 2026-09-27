import type { PublicConfig } from "../types";
import { Icon } from "./Icon";

/** Offers only the ways to sign in that this server actually supports. */
export function Login({ config, error }: { config: PublicConfig | null; error?: string }) {
  // Until the config is known (or if it could not be loaded) assume GitHub sign-in works.
  const githubReady = config === null || config.github_login;

  return (
    <div className="signin">
      <span className="mark">
        <Icon name="check" size={22} />
      </span>
      <h1>Sign in to Reviewly</h1>
      <p className="muted">See your reviews, findings and precision. New here? Install the GitHub App from the home page first.</p>

      {githubReady ? (
        <a className="btn primary" href="/auth/github/login">
          <Icon name="log-in" size={15} />
          Sign in with GitHub
        </a>
      ) : (
        <p role="status" className="notice">
          GitHub sign-in is not set up on this server yet. Whoever hosts Reviewly needs to finish the GitHub App setup (see the README).
        </p>
      )}

      {error && <p role="alert">{error}</p>}
    </div>
  );
}
