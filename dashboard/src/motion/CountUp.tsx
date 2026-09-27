import { animate } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useMotionOk } from "./useMotionOk";
import { useSeen } from "./useSeen";

interface Props {
  value: number;
  format?: (n: number) => string;
  /** Seconds. */
  duration?: number;
}

/** A number that counts up from zero when it first appears. Screen readers get the final value at once. */
export function CountUp({ value, format = (n) => String(Math.round(n)), duration = 1.1 }: Props) {
  const ok = useMotionOk();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useSeen(ref);
  const [shown, setShown] = useState(ok ? 0 : value);

  useEffect(() => {
    if (!ok) {
      setShown(value);
      return;
    }
    if (!inView) return;
    const controls = animate(0, value, { duration, ease: [0.22, 1, 0.36, 1], onUpdate: setShown });
    return () => controls.stop();
  }, [ok, inView, value, duration]);

  // While counting, screen readers get the final value at once; the moving digits are hidden from them.
  if (shown === value) return <span ref={ref}>{format(value)}</span>;
  return (
    <span ref={ref}>
      <span aria-hidden="true">{format(shown)}</span>
      <span className="sr-only">{format(value)}</span>
    </span>
  );
}
