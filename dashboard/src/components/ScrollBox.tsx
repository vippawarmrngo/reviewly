import type { ReactNode } from "react";

/** A table that scrolls sideways on small screens. It is a focusable, named region, so keyboard users can
 *  reach it and scroll it with the arrow keys. */
export function ScrollBox({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="table-wrap card" role="region" aria-label={label} tabIndex={0}>
      {children}
    </div>
  );
}
