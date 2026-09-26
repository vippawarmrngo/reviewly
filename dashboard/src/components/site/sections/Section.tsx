import type { ReactNode } from "react";
import { Reveal } from "../../../motion/Reveal";

export function Section({ id, title, lead, children }: { id: string; title: string; lead?: string; children: ReactNode }) {
  return (
    <section id={id} className="site-section" aria-labelledby={`${id}-h`}>
      <Reveal>
        <h2 id={`${id}-h`} className="site-h2">
          {title}
        </h2>
        {lead && <p className="site-lead">{lead}</p>}
      </Reveal>
      {children}
    </section>
  );
}
