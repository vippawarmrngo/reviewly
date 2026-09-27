import { type RefObject, useEffect, useState } from "react";

/** True once the element has been on screen. Without IntersectionObserver it is true straight away,
 *  so content never waits for a signal that cannot come. */
export function useSeen(ref: RefObject<Element>): boolean {
  const [seen, setSeen] = useState(typeof IntersectionObserver === "undefined");
  useEffect(() => {
    if (seen || !ref.current) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        setSeen(true);
        observer.disconnect();
      }
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref, seen]);
  return seen;
}
