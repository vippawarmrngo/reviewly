import { type RefObject, useEffect, useState } from "react";

/** Whether the element is currently visible (unlike useSeen, it goes back to false). Used to pause loops off-screen. */
export function useOnScreen(ref: RefObject<Element>): boolean {
  const [on, setOn] = useState(typeof IntersectionObserver === "undefined");
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined" || !ref.current) return;
    const observer = new IntersectionObserver((entries) => setOn(entries.some((e) => e.isIntersecting)));
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref]);
  return on;
}
