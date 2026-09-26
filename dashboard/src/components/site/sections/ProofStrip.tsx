import { CountUp } from "../../../motion/CountUp";
import { Reveal } from "../../../motion/Reveal";
import { EVAL_URL, LOAD_TEST_URL } from "../links";
import { Icon } from "../../Icon";

const pct = (n: number) => `${Math.round(n)}%`;

/** Only figures that were measured and are documented in the repository, each with its caveat. */
export function ProofStrip() {
  return (
    <section className="proof" aria-label="Measured results">
      <Reveal className="proof-grid">
        <div className="proof-item">
          <div className="proof-num">
            <CountUp value={84} format={pct} />–<CountUp value={86} format={pct} />
          </div>
          <div className="proof-label">of comments were valid</div>
        </div>
        <div className="proof-item">
          <div className="proof-num">
            <CountUp value={95} format={pct} />–<CountUp value={98} format={pct} />
          </div>
          <div className="proof-label">of seeded bugs found</div>
        </div>
        <div className="proof-item">
          <div className="proof-num">
            <CountUp value={0} />
          </div>
          <div className="proof-label">jobs lost or reviewed twice in a 500-PR burst</div>
        </div>
      </Reveal>
      <p className="proof-note">
        Measured on 58 labeled changes (small, and recall is probably optimistic) and a load test on one laptop with a stand-in model.{" "}
        <a className="inline-link" href={EVAL_URL} target="_blank" rel="noopener noreferrer">
          Method <Icon name="external-link" size={11} />
        </a>{" "}
        ·{" "}
        <a className="inline-link" href={LOAD_TEST_URL} target="_blank" rel="noopener noreferrer">
          Load test <Icon name="external-link" size={11} />
        </a>
      </p>
    </section>
  );
}
