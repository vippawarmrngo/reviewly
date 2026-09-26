import { type ReactNode, useMemo } from "react";
import exampleConfig from "../../content/reviewly.example.yml?raw";
import behavior from "../../content/behavior.json";
import providers from "../../content/providers.json";
import { useScrollSpy } from "../../motion/useScrollSpy";
import { CodeBlock } from "../docs/CodeBlock";
import { Icon } from "../Icon";
import { Link } from "../Link";

export const DOC_SECTIONS = [
  ["start", "Quick start"],
  ["review", "How a review works"],
  ["teach", "Teaching Reviewly"],
  ["config", "Configuration"],
  ["key", "Use your own AI key"],
  ["skips", "Why a pull request gets no review"],
] as const;

function H2({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2 id={id} className="doc-h2">
      {children}
    </h2>
  );
}

export const SKIP_MEANINGS: Record<string, string> = {
  "pull request is not open": "It was closed or merged before the review started.",
  "superseded by a newer commit": "A newer commit arrived; the newest one is reviewed instead.",
  "already reviewed": "That commit already has a Reviewly review, so it is not reviewed twice.",
  "no reviewable files": "Every changed file was a lock file, generated file, or matched your ignore list.",
  "free-tier monthly review limit reached": "The installation used its free allowance for the month.",
  "no AI model configured": "The service has no built-in model. Add your own key in Settings.",
  "daily token budget exhausted": "The installation reached its daily limit on the service's models.",
  "the installation's own API key configuration is invalid": "Your saved key could not be used (for example it can no longer be decrypted). Enter it again in Settings.",
};
export const SKIP_REASONS: [string, string][] = behavior.skip_reasons.map((r) => [r, SKIP_MEANINGS[r] ?? ""]);

const codes = (words: string[]) =>
  words.map((w, i) => (
    <span key={w}>
      {i > 0 && (i === words.length - 1 ? " or " : ", ")}
      <code>{w}</code>
    </span>
  ));

export default function Docs() {
  const ids = useMemo(() => DOC_SECTIONS.map(([id]) => id), []);
  const active = useScrollSpy(ids);
  return (
    <div className="docs site">
      <aside className="docs-toc" aria-label="On this page">
        <div className="docs-toc-title">On this page</div>
        {DOC_SECTIONS.map(([id, label]) => (
          <a key={id} href={`#${id}`} aria-current={active === id ? "location" : undefined}>
            {label}
          </a>
        ))}
      </aside>
      <article className="docs-body">
        <h1>Docs</h1>
        <p className="site-lead">Everything you need to install Reviewly, teach it what your team wants, and use your own AI model.</p>

        <H2 id="start">Quick start</H2>
        <ol className="doc-steps">
          <li>
            <strong>Install the GitHub App</strong> on the repositories you want reviewed. It needs read access to code and metadata, and write access to pull requests.
          </li>
          <li>
            <strong>Open a pull request.</strong> That is all: there is nothing to configure to get a first review.
          </li>
          <li>
            <strong>Read the review.</strong> One review per commit, with inline comments on the exact lines and, when it is sure of the fix, replacement code.
          </li>
          <li>
            <strong>Reply to teach it.</strong> Accept or dismiss a comment and it learns what your team wants (see below).
          </li>
        </ol>

        <H2 id="review">How a review works</H2>
        <ul>
          <li>A review starts when a pull request is opened, gets a new commit, is reopened, or is marked ready for review.</li>
          <li>Each commit gets at most one review. If a newer commit arrives first, the older one is skipped.</li>
          <li>Lock files and other non-reviewable files are skipped. Very large pull requests are reviewed in part, and the summary says what was left out.</li>
          <li>Every comment points at a line that is really in the diff. Findings that cannot be tied to a changed line are dropped, not posted.</li>
          <li>Reviewly only ever posts comments. It never approves, requests changes or merges.</li>
        </ul>

        <H2 id="teach">Teaching Reviewly</H2>
        <p>Reply to any Reviewly comment, or react to it:</p>
        <div className="table-wrap card">
          <table>
            <thead>
              <tr>
                <th>You want to say</th>
                <th>Reply with</th>
                <th>Or react</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>This was useful</td>
                <td><code>@reviewly</code> {codes(behavior.accept_words)}</td>
                <td>{behavior.positive_reactions.join(" ")}</td>
              </tr>
              <tr>
                <td>This was wrong or noise</td>
                <td><code>@reviewly</code> {codes(behavior.dismiss_words)}</td>
                <td>{behavior.negative_reactions.join(" ")}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <ul>
          <li>Replies count at once. Reactions are picked up about every 10 minutes, because GitHub does not announce them.</li>
          <li>A reply beats a reaction. Resolving a thread is shown in the dashboard but does not count as feedback.</li>
          <li>A kind of finding that has been dismissed at least {behavior.suppress_after_dismissals} times in a repository, and never accepted, is not raised there again.</li>
        </ul>

        <H2 id="config">Configuration</H2>
        <p>
          Add a <code>.reviewly.yml</code> to the root of your repository. Every field is optional. It is read from the pull request's <strong>base branch</strong>,
          never from the pull request itself, so a change cannot loosen its own review.
        </p>
        <CodeBlock code={exampleConfig} label=".reviewly.yml example" />
        <div className="table-wrap card">
          <table>
            <thead>
              <tr>
                <th>Field</th>
                <th>What it does</th>
                <th>Limits</th>
              </tr>
            </thead>
            <tbody>
              <tr><td><code>ignore</code></td><td>Glob patterns for files not to review.</td><td>up to {behavior.config.ignore_max} patterns</td></tr>
              <tr><td><code>strictness</code></td><td>How sure Reviewly must be before it comments.</td><td><code>low</code>, <code>medium</code> (default), <code>high</code></td></tr>
              <tr><td><code>max_comments</code></td><td>The most comments in one review.</td><td>{behavior.config.max_comments_min} to {behavior.config.max_comments_max} (default {behavior.config.default_max_comments})</td></tr>
              <tr><td><code>rules</code></td><td>Your own rules, in plain language, checked on every review.</td><td>up to {behavior.config.rules_max}, {behavior.config.rule_chars} characters each</td></tr>
            </tbody>
          </table>
        </div>
        <p>
          <strong>Strictness works like a confidence bar.</strong> <code>low</code> only reports findings it is very sure about (at least {Math.round(behavior.strictness.low * 100)}%), <code>medium</code> needs{" "}
          {Math.round(behavior.strictness.medium * 100)}%, and <code>high</code> also reports findings it is less sure about ({Math.round(behavior.strictness.high * 100)}%), so you get more comments. If the file is not valid YAML, or a value is out of range, the review runs with
          the defaults and says so.
        </p>

        <H2 id="key">Use your own AI key</H2>
        <ol className="doc-steps">
          <li>Sign in, open <Link className="inline-link" to="/app/settings">Settings</Link> and find <em>AI model</em>.</li>
          <li>Choose a provider, type the model name exactly as your provider spells it, and paste your key.</li>
          <li>Press <em>Save and test key</em>. Reviewly makes one real call first; a key that does not work is never saved.</li>
        </ol>
        <div className="table-wrap card">
          <table>
            <thead>
              <tr>
                <th>Provider</th>
                <th>Get a key</th>
              </tr>
            </thead>
            <tbody>
              {providers.map((p) => (
                <tr key={p.id}>
                  <td>{p.label}</td>
                  <td>
                    {p.keyUrl ? (
                      <a className="inline-link" href={p.keyUrl} target="_blank" rel="noopener noreferrer">
                        {new URL(p.keyUrl).hostname} <Icon name="external-link" size={11} />
                      </a>
                    ) : (
                      <span className="muted">Any public https endpoint that speaks the OpenAI chat API</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul>
          <li>Your key is encrypted, never shown again (only its last four characters), and used only to review your repositories.</li>
          <li>Your code goes to the provider you chose, not to Reviewly's models. If your key stops working, the pull request gets a notice; there is no silent fallback to another model.</li>
          <li>Reviews with your own key do not count against the free allowance. Repository context search is not used with your own key.</li>
        </ul>

        <H2 id="skips">Why a pull request gets no review</H2>
        <p>The dashboard shows these as <em>Skipped</em>, with the reason:</p>
        <div className="table-wrap card">
          <table>
            <thead>
              <tr>
                <th>Reason</th>
                <th>What it means</th>
              </tr>
            </thead>
            <tbody>
              {SKIP_REASONS.map(([reason, meaning]) => (
                <tr key={reason}>
                  <td><code>{reason}</code></td>
                  <td className="wrap">{meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Still stuck? Check the <Link className="inline-link" to="/status">status page</Link>, then read <Link className="inline-link" to="/privacy">data handling</Link> for what is sent where.
        </p>
      </article>
    </div>
  );
}
