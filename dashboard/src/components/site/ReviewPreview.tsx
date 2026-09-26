import { m } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useMotionOk } from "../../motion/useMotionOk";
import { useOnScreen } from "../../motion/useOnScreen";
import { Icon } from "../Icon";

/** How long each step of the demo is shown, in milliseconds. The last one is the "hold" before it loops. */
export const STEP_MS = [800, 650, 650, 1100, 900, 900, 3400] as const;
export const LAST_STEP = STEP_MS.length - 1;

/** Steps: 0 context, 1 first added line, 2 second added line, 3 "reviewing", 4 comment, 5 fix, 6 accepted. */
export function ReviewFrame({ step }: { step: number }) {
  const line = (n: number, text: string, kind: "ctx" | "add" | "bad", show: boolean) =>
    show && (
      <m.div
        key={n}
        className={`dl ${kind}`}
        initial={{ opacity: 0, x: -6 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25 }}
      >
        <span className="ln">{n}</span>
        <span>{text}</span>
      </m.div>
    );
  return (
    <>
      <div className="diff" aria-label="Changed code">
        {line(12, "  def apply_discount(total, pct):", "ctx", true)}
        {line(13, "      if pct > 0:", "ctx", true)}
        {line(14, "+         return total * (1 - pct / 100)", "add", step >= 1)}
        {line(15, "+     return total / pct", step >= 4 ? "bad" : "add", step >= 2)}
      </div>
      {step === 3 && (
        <div className="thinking" role="status">
          <span className="spinner" aria-hidden="true" />
          Reviewly is reading the change…
        </div>
      )}
      {step >= 4 && (
        <m.div className="comment" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <div className="comment-head">
            <span className="mark small">
              <Icon name="check" size={11} />
            </span>
            <strong>Reviewly</strong>
            <span className="status dead">
              <Icon name="alert" size={12} />
              High · bug
            </span>
          </div>
          <p>
            When <code>pct</code> is 0 this falls through to <code>total / pct</code>, which divides by zero. A zero discount should return{" "}
            <code>total</code> unchanged.
          </p>
          {step >= 5 && (
            <m.pre className="suggest" aria-label="Suggested fix" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
              {"-     return total / pct\n+     return total"}
            </m.pre>
          )}
          {step >= 6 && (
            <m.div className="accepted" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.25 }}>
              <Icon name="thumbs-up" size={13} /> Accepted by the author
            </m.div>
          )}
        </m.div>
      )}
    </>
  );
}

/** A made-up review that plays out like a real one: the code appears, the review lands, the fix is accepted.
 *  It is labeled "Example". It loops only while on screen, and shows its finished state when motion is off. */
export function ReviewPreview() {
  const ok = useMotionOk();
  const ref = useRef<HTMLElement>(null);
  const onScreen = useOnScreen(ref);
  const [step, setStep] = useState(ok ? 0 : LAST_STEP);

  useEffect(() => {
    if (!ok) {
      setStep(LAST_STEP);
      return;
    }
    if (!onScreen) return;
    const id = window.setTimeout(() => setStep((s) => (s >= LAST_STEP ? 0 : s + 1)), STEP_MS[step]);
    return () => window.clearTimeout(id);
  }, [ok, onScreen, step]);

  return (
    <figure ref={ref} className="preview card" aria-label="Example review comment">
      <div className="preview-bar">
        <span className="dots" aria-hidden="true">
          <i /> <i /> <i />
        </span>
        <span className="muted">orders/pricing.py</span>
        <span className="pill">Example</span>
      </div>
      <ReviewFrame step={step} />
    </figure>
  );
}
