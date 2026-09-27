import { Reveal } from "../../../motion/Reveal";
import { Icon, type IconName } from "../../Icon";
import { Link } from "../../Link";
import { Section } from "./Section";

const ITEMS: [IconName, string, string][] = [
  ["shield", "Secrets are redacted first.", "Keys, tokens, private keys and passwords in a diff are masked before anything is sent to a model. It is pattern-based, so treat it as risk reduction rather than a guarantee."],
  ["lock", "Your API key is encrypted", "at rest, never shown again, and used only to review your repositories."],
  ["check-circle", "Minimal permissions.", "Read access to code and metadata, write access to pull requests."],
  ["alert", "Hostile code cannot give it orders.", "Text in a diff is treated as data. Attempts to instruct the reviewer are ignored and flagged for a human."],
  ["trash", "You stay in control.", "Uninstall the App and repository context is deleted immediately."],
];

export function Security() {
  return (
    <Section id="security" title="Security and privacy" lead="Your code is sensitive. Here is exactly what Reviewly does with it.">
      <div className="security-grid">
        <ul className="checks">
          {ITEMS.map(([icon, strong, rest], i) => (
            <Reveal as="li" key={strong} delay={i * 0.06}>
              <Icon name={icon} size={16} />
              <span>
                <strong>{strong}</strong> {rest}
              </span>
            </Reveal>
          ))}
        </ul>
        <Reveal delay={0.1} className="redact card">
          <div className="redact-title">What the model receives</div>
          <pre className="mini-code" aria-label="A secret in a diff, and what the model sees instead">
            <span className="del">{'- API_KEY = "sk_live_9f8a1c…"'}</span>
            {"\n"}
            <span className="add">{'+ API_KEY = "[REDACTED]"'}</span>
          </pre>
          <p className="muted small">An example. The real masking covers common key formats, private keys, passwords and credentials in URLs.</p>
        </Reveal>
      </div>
      <p className="muted small">
        Read the full <Link className="inline-link" to="/privacy">data handling</Link> page.
      </p>
    </Section>
  );
}
