import { LazyMotion, MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

// The animation features are fetched after the page has painted, so they never delay it.
const loadFeatures = () => import("./features").then((m) => m.default);

/** Loads only the animation features we use, and makes every animation honour "reduce motion". */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
