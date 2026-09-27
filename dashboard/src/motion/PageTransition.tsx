import { m } from "framer-motion";
import type { ReactNode } from "react";
import { useMotionOk } from "./useMotionOk";

/** A short fade-and-rise when the page changes. Enter-only, so content is never held back on the way out. */
export function PageTransition({ pageKey, children }: { pageKey: string; children: ReactNode }) {
  const ok = useMotionOk();
  if (!ok) return <>{children}</>;
  return (
    <m.div key={pageKey} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, ease: "easeOut" }}>
      {children}
    </m.div>
  );
}
