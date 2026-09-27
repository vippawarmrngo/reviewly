import { useReducedMotion } from "framer-motion";

/** Whether to animate at all. False when the user asked for reduced motion, or when the browser cannot
 *  tell us that something scrolled into view: in both cases components show their finished state at once. */
export function useMotionOk(): boolean {
  const reduce = useReducedMotion();
  return !reduce && typeof IntersectionObserver !== "undefined";
}
