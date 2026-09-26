import { m } from "framer-motion";
import type { ReactNode } from "react";
import exampleConfig from "../../../content/reviewly.example.yml?raw";
import providers from "../../../content/providers.json";
import { Reveal } from "../../../motion/Reveal";
import { useMotionOk } from "../../../motion/useMotionOk";
import { Icon, type IconName } from "../../Icon";
import { Section } from "./Section";

/** The example config without its comments, so it fits a small card. */
export function configPreview(yaml: string): string {
  return yaml
    .split("\n")
    .filter((l) => l.trim() && !l.trim().startsWith("#"))
    .map((l) => l.replace(/\s+#.*$/, ""))
    .join("\n");
}

const PROVIDERS = providers.map((p) => (p.id === "custom" ? "Any compatible endpoint" : p.label));

function Card({ icon, title, tone, wide, children, visual, delay }: { icon: IconName; title: string; tone?: "good" | "neutral"; wide?: boolean; children: ReactNode; visual?: ReactNode; delay: number }) {
  return (
    <Reveal as="li" delay={delay} className={`feature card${wide ? " wide" : ""}`}>
      <div className={tone ? `tile-icon ${tone}` : "tile-icon"}>
        <Icon name={icon} size={16} />
      </div>
      <h3>{title}</h3>
      <p>{children}</p>
      {visual && (
        <div className="mini" aria-hidden="true">
          {visual}
        </div>
      )}
    </Reveal>
  );
}

function Bars() {
  const ok = useMotionOk();
  const heights = [34, 52, 44, 68, 58, 82];
  return (
    <div className="mini-bars">
      {heights.map((h, i) =>
        ok ? (
          <m.i key={i} initial={{ scaleY: 0 }} whileInView={{ scaleY: 1 }} viewport={{ once: true }} transition={{ delay: 0.15 + i * 0.07, duration: 0.5, ease: "easeOut" }} style={{ height: `${h}%`, originY: 1 }} />
        ) : (
          <i key={i} style={{ height: `${h}%` }} />
        ),
      )}
    </div>
  );
}

export function Features() {
  return (
    <Section id="features" title="Built to be trusted, not ignored" lead="A reviewer that cries wolf gets muted. Reviewly is designed to say less and be right more.">
      <ul className="bento">
        <Card
          delay={0}
          wide
          icon="target"
          title="Real lines, real problems"
          visual={
            <div className="mini-diff">
              <div><span className="ln">14</span>+ return total * (1 - pct / 100)</div>
              <div className="hit"><span className="ln">15</span>+ return total / pct <span className="chip good"><Icon name="check-circle" size={11} /> line is in the diff</span></div>
            </div>
          }
        >
          Every comment points at a line that is actually in the diff. Comments it cannot support from the code shown are dropped, not posted.
        </Card>
        <Card delay={0.06} icon="message-square" tone="good" title="Suggested fixes" visual={<pre className="mini-code">{"- return total / pct\n+ return total"}</pre>}>
          When it is sure of the fix, the comment includes replacement code you can apply.
        </Card>
        <Card
          delay={0.12}
          icon="thumbs-up"
          title="Learns your team"
          visual={
            <div className="chips">
              <span className="chip good"><Icon name="thumbs-up" size={11} /> @reviewly accept</span>
              <span className="chip bad"><Icon name="thumbs-down" size={11} /> @reviewly dismiss</span>
            </div>
          }
        >
          Comments your team keeps dismissing stop appearing in that repository. Reply to a comment, or react 👍 / 👎.
        </Card>
        <Card
          delay={0.18}
          wide
          icon="key"
          tone="neutral"
          title="Bring your own model"
          visual={
            <div className="chips">
              {PROVIDERS.map((p) => (
                <span key={p} className="chip">{p}</span>
              ))}
            </div>
          }
        >
          Use your own key. Your code goes to the provider you chose, and reviews do not count against the free allowance.
        </Card>
        <Card delay={0.24} wide icon="wrench" title="Tell it what matters" visual={<pre className="mini-code yaml">{configPreview(exampleConfig)}</pre>}>
          A <code>.reviewly.yml</code> sets paths to ignore, your own rules, how strict to be and how many comments to post.
        </Card>
        <Card delay={0.3} icon="grid" tone="neutral" title="See how it is doing" visual={<Bars />}>
          A dashboard shows reviews, findings and precision per rule, based on what your team accepted and dismissed.
        </Card>
      </ul>
    </Section>
  );
}
