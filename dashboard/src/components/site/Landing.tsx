import type { PublicConfig } from "../../types";
import { Icon } from "../Icon";
import { Link } from "../Link";
import { CtaBand } from "./sections/CtaBand";
import { Faq } from "./sections/Faq";
import { Features } from "./sections/Features";
import { Hero } from "./sections/Hero";
import { HowItWorks } from "./sections/HowItWorks";
import { Pricing } from "./sections/Pricing";
import { ProofStrip } from "./sections/ProofStrip";
import { Security } from "./sections/Security";

interface Props {
  config: PublicConfig | null;
  installUrl: string | null;
}

export function Landing({ config, installUrl }: Props) {
  const cta = installUrl ? (
    <a className="btn primary big" href={installUrl}>
      <Icon name="plus" size={15} />
      Install on GitHub
    </a>
  ) : (
    <Link className="btn primary big" to="/signin">
      <Icon name="log-in" size={15} />
      Sign in
    </Link>
  );
  return (
    <div className="site">
      <Hero cta={cta} free={config?.free_reviews_per_month} />
      <ProofStrip />
      <HowItWorks />
      <Features />
      <Security />
      <Pricing config={config} cta={cta} />
      <Faq />
      <CtaBand cta={cta} />
    </div>
  );
}
