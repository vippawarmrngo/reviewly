import type { ReactNode } from "react";
import { goToSection } from "../../route";
import { Link } from "../Link";
import type { PublicConfig } from "../../types";
import { Icon, type IconName } from "../Icon";
import { ReviewPreview } from "./ReviewPreview";

const SOURCE = "https://github.com/vippawar1104/meeting-summarizer";

function Section({ id, title, lead, children }: { id: string; title: string; lead?: string; children: ReactNode }) {
  return (
    <section id={id} className="site-section" aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`} className="site-h2">
        {title}
      </h2>
      {lead && <p className="site-lead">{lead}</p>}
      {children}
    </section>
  );
}

function Feature({ icon, title, children, tone }: { icon: IconName; title: string; children: ReactNode; tone?: "good" | "neutral" }) {
  return (
    <li className="feature card">
      <div className={tone ? `tile-icon ${tone}` : "tile-icon"}>
        <Icon name={icon} size={16} />
      </div>
      <h3>{title}</h3>
      <p>{children}</p>
    </li>
  );
}

const STEPS: [string, string, string][] = [
  ["1", "Install the GitHub App", "Pick the repositories you want reviewed. It needs read access to code and write access to pull requests, nothing else."],
  ["2", "Open a pull request", "Reviewly reads the diff, checks every change and drops anything it cannot support from the code shown."],
  ["3", "Get one focused review", "A single review with inline comments and suggested fixes. Reply to accept or dismiss and it learns what your team wants."],
];

const FAQ: [string, ReactNode][] = [
  [
    "Does Reviewly store my code?",
    "It stores the results of a review (each comment, its file and line, and usage counts), not your repository. Optional repository context search is off by default; when it is on, indexed code is deleted after 30 days unused or as soon as you uninstall.",
  ],
  [
    "Where does my code go?",
    "The diff of a pull request is sent to an AI model to be reviewed, after secrets are redacted. By default that is a model run by this Reviewly service. If you add your own API key, it goes only to the provider you chose. See the data handling page for details.",
  ],
  [
    "Can it approve or block my pull requests?",
    "No. It only ever posts comments. It never approves, never requests changes and never merges, so it cannot get in the way of your review process.",
  ],
  [
    "Which languages does it support?",
    "It reviews the diff, so any language you can read in a diff. The optional repository context search understands Python, JavaScript, TypeScript, Go and Java.",
  ],
  [
    "How accurate is it?",
    <>
      On a small internal benchmark of 58 labeled changes, about 84–86% of the comments it posted were valid and it found 95–98% of the
      seeded bugs. That set is small and the recall figure is probably optimistic, so treat these as a rough guide, not a promise. Method and
      limits are in the{" "}
      <a className="inline-link" href={`${SOURCE}#evaluation-m6`} target="_blank" rel="noopener noreferrer">
        source repository <Icon name="external-link" size={11} />
      </a>
      .
    </>,
  ],
  [
    "Can I choose the AI model?",
    "Yes. Add your own key for OpenAI, Anthropic, Google Gemini, Groq, Mistral or any OpenAI-compatible endpoint under Settings. Reviews with your own key do not count against the free allowance.",
  ],
  [
    "Can I tell it what to ignore?",
    <>
      Yes. Add a <code>.reviewly.yml</code> to your repository with paths to ignore, your own rules, a strictness level and a comment limit.
    </>,
  ],
  [
    "Is it open source?",
    <>
      Yes, under the MIT license. You can read the code, or run your own copy:{" "}
      <a className="inline-link" href={SOURCE} target="_blank" rel="noopener noreferrer">
        source repository <Icon name="external-link" size={11} />
      </a>
      .
    </>,
  ],
];

interface Props {
  config: PublicConfig | null;
  installUrl: string | null;
}

export function Landing({ config, installUrl }: Props) {
  const free = config?.free_reviews_per_month;
  const billing = config?.billing ?? false;
  const cta = installUrl ? (
    <a className="btn primary big" href={installUrl}>
      <Icon name="plus" size={15} />
      Install on GitHub
    </a>
  ) : (
    <Link className="btn primary big" to="/signin">
      <Icon name="log-in" size={15} />
      Sign in
    </Link>
  );

  return (
    <div className="site">
      <div className="hero">
        <div className="hero-copy">
          <span className="pill accent">
            <Icon name="zap" size={12} />
            GitHub App · works with your own AI key
          </span>
          <h1>Catch bugs in pull requests before your teammates have to</h1>
          <p className="site-lead">
            Reviewly reads every pull request and posts one focused review: inline comments on the exact lines, with suggested fixes. It stays
            quiet when there is nothing to say.
          </p>
          <div className="hero-cta">
            {cta}
            <button className="btn big" onClick={() => goToSection("how")}>
              See how it works
            </button>
          </div>
          <p className="muted small">
            {free === 0 ? "Free to use." : "Free plan included."} Comments only: it never approves, blocks or merges.
          </p>
        </div>
        <ReviewPreview />
      </div>

      <Section id="how" title="How it works" lead="Three steps, and no configuration to start.">
        <ol className="steps-3">
          {STEPS.map(([n, title, body]) => (
            <li key={n} className="card">
              <span className="step-n">{n}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="features" title="Built to be trusted, not ignored" lead="A reviewer that cries wolf gets muted. Reviewly is designed to say less and be right more.">
        <ul className="features">
          <Feature icon="target" title="Real lines, real problems">
            Every comment points at a line that is actually in the diff. Comments it cannot support from the code shown are dropped, not posted.
          </Feature>
          <Feature icon="message-square" title="Suggested fixes" tone="good">
            When it is sure of the fix, the comment includes replacement code you can apply.
          </Feature>
          <Feature icon="thumbs-up" title="Learns your team">
            Reply <code>@reviewly dismiss</code> or <code>@reviewly accept</code>, or react 👍 / 👎. Comments your team keeps dismissing stop appearing.
          </Feature>
          <Feature icon="key" title="Bring your own model" tone="neutral">
            Use your own key for OpenAI, Anthropic, Gemini, Groq, Mistral or any compatible endpoint. Your code goes to the provider you chose.
          </Feature>
          <Feature icon="wrench" title="Tell it what matters">
            A <code>.reviewly.yml</code> in your repo sets paths to ignore, your own rules, how strict to be and how many comments to post.
          </Feature>
          <Feature icon="grid" title="See how it is doing" tone="neutral">
            A dashboard shows reviews, findings, and precision per rule, based on what your team accepted and dismissed.
          </Feature>
        </ul>
      </Section>

      <Section id="security" title="Security and privacy" lead="Your code is sensitive. Here is exactly what Reviewly does with it.">
        <ul className="checks">
          <li>
            <Icon name="shield" size={16} />
            <span>
              <strong>Secrets are redacted first.</strong> Keys, tokens, private keys and passwords in a diff are masked before anything is sent to a model.
              It is pattern-based, so treat it as risk reduction rather than a guarantee.
            </span>
          </li>
          <li>
            <Icon name="lock" size={16} />
            <span>
              <strong>Your API key is encrypted</strong> at rest, never shown again, and used only to review your repositories.
            </span>
          </li>
          <li>
            <Icon name="check-circle" size={16} />
            <span>
              <strong>Minimal permissions.</strong> Read access to code and metadata, write access to pull requests.
            </span>
          </li>
          <li>
            <Icon name="alert" size={16} />
            <span>
              <strong>Hostile code cannot give it orders.</strong> Text in a diff is treated as data. Attempts to instruct the reviewer are ignored and flagged for a human.
            </span>
          </li>
          <li>
            <Icon name="trash" size={16} />
            <span>
              <strong>You stay in control.</strong> Uninstall the App and repository context is deleted immediately.
            </span>
          </li>
        </ul>
        <p className="muted small">
          Read the full <Link className="inline-link" to="/privacy">data handling</Link> page.
        </p>
      </Section>

      <Section id="pricing" title="Pricing" lead="Start free. Bring your own key any time.">
        <div className="plans">
          <div className="card plan-card">
            <h3>Free</h3>
            <p className="price">{free === 0 ? "Unlimited" : free ? `${free} reviews / month` : "Monthly allowance"}</p>
            <ul>
              <li><Icon name="check" size={14} />Every feature</li>
              <li><Icon name="check" size={14} />Reviewly's built-in models</li>
              <li><Icon name="check" size={14} />Dashboard and feedback learning</li>
            </ul>
            {cta}
          </div>
          <div className={`card plan-card${billing ? "" : " muted-card"}`}>
            <h3>Pro</h3>
            <p className="price">Unlimited reviews</p>
            <ul>
              <li><Icon name="check" size={14} />Everything in Free</li>
              <li><Icon name="check" size={14} />No monthly limit</li>
            </ul>
            {billing ? <Link className="btn" to="/signin">Sign in to upgrade</Link> : <span className="muted small">Paid plans are not enabled on this server.</span>}
          </div>
          <div className="card plan-card">
            <h3>Your own key</h3>
            <p className="price">Pay your provider</p>
            <ul>
              <li><Icon name="check" size={14} />Choose any model you have access to</li>
              <li><Icon name="check" size={14} />Doesn't count against the free allowance</li>
            </ul>
            <Link className="btn" to="/signin">Add a key</Link>
          </div>
        </div>
      </Section>

      <Section id="faq" title="Questions">
        <div className="faq">
          {FAQ.map(([q, a]) => (
            <details key={q} className="card">
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </Section>

      <div className="cta-band card">
        <h2>Ready for your next pull request?</h2>
        <p className="site-lead">It takes a minute to install and there is nothing to configure.</p>
        {cta}
      </div>
    </div>
  );
}
