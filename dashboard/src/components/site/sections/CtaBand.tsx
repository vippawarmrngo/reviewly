import type { ReactNode } from "react";
import { Reveal } from "../../../motion/Reveal";

export function CtaBand({ cta }: { cta: ReactNode }) {
  return (
    <Reveal className="cta-band card">
      <h2>Ready for your next pull request?</h2>
      <p className="site-lead">It takes a minute to install and there is nothing to configure.</p>
      {cta}
    </Reveal>
  );
}
