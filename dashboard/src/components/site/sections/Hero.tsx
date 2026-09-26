import type { ReactNode } from "react";
import { goToSection } from "../../../route";
import { Icon } from "../../Icon";
import { Reveal } from "../../../motion/Reveal";
import { ReviewPreview } from "../ReviewPreview";

export function Hero({ cta, free }: { cta: ReactNode; free: number | undefined }) {
  return (
    <div className="hero">
      <div className="hero-glow" aria-hidden="true" />
      <div className="hero-copy">
        <Reveal y={10}>
          <span className="pill accent">
            <Icon name="zap" size={12} />
            GitHub App · works with your own AI key
          </span>
        </Reveal>
        <Reveal delay={0.05}>
          <h1>Catch bugs in pull requests before your teammates have to</h1>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="site-lead">
            Reviewly reads every pull request and posts one focused review: inline comments on the exact lines, with suggested fixes. It stays
            quiet when there is nothing to say.
          </p>
        </Reveal>
        <Reveal delay={0.15}>
          <div className="hero-cta">
            {cta}
            <button className="btn big" onClick={() => goToSection("how")}>
              See how it works
            </button>
          </div>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="muted small">
            {free === 0 ? "Free to use." : "Free plan included."} Comments only: it never approves, blocks or merges.
          </p>
        </Reveal>
      </div>
      <Reveal delay={0.12} y={24} className="hero-visual">
        <ReviewPreview />
      </Reveal>
    </div>
  );
}
