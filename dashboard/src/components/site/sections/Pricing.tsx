import type { ReactNode } from "react";
import { Reveal } from "../../../motion/Reveal";
import type { PublicConfig } from "../../../types";
import { Icon } from "../../Icon";
import { Link } from "../../Link";
import { Section } from "./Section";

const Tick = ({ children }: { children: ReactNode }) => (
  <li>
    <Icon name="check" size={14} />
    {children}
  </li>
);

export function Pricing({ config, cta }: { config: PublicConfig | null; cta: ReactNode }) {
  const free = config?.free_reviews_per_month;
  const billing = config?.billing ?? false;
  return (
    <Section id="pricing" title="Pricing" lead="Start free. Bring your own key any time.">
      <div className="plans">
        <Reveal className="card plan-card featured">
          <h3>Free</h3>
          <p className="price">{free === 0 ? "Unlimited" : free ? `${free} reviews / month` : "Monthly allowance"}</p>
          <ul>
            <Tick>Every feature</Tick>
            <Tick>Reviewly's built-in models</Tick>
            <Tick>Dashboard and feedback learning</Tick>
          </ul>
          {cta}
        </Reveal>
        <Reveal delay={0.08} className={`card plan-card${billing ? "" : " muted-card"}`}>
          <h3>Pro</h3>
          <p className="price">Unlimited reviews</p>
          <ul>
            <Tick>Everything in Free</Tick>
            <Tick>No monthly limit</Tick>
          </ul>
          {billing ? (
            <Link className="btn" to="/signin">
              Sign in to upgrade
            </Link>
          ) : (
            <span className="muted small">Paid plans are not enabled on this server.</span>
          )}
        </Reveal>
        <Reveal delay={0.16} className="card plan-card">
          <h3>Your own key</h3>
          <p className="price">Pay your provider</p>
          <ul>
            <Tick>Choose any model you have access to</Tick>
            <Tick>Doesn't count against the free allowance</Tick>
          </ul>
          <Link className="btn" to="/signin">
            Add a key
          </Link>
        </Reveal>
      </div>
    </Section>
  );
}
