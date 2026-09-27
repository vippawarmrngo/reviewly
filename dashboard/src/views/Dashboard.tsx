import { GettingStarted } from "../components/GettingStarted";
import { Icon } from "../components/Icon";
import { ModelSettings } from "../components/ModelSettings";
import { PlanCard } from "../components/PlanCard";
import { RuleBars } from "../components/RuleBars";
import { SectionTitle } from "../components/SectionTitle";
import { RecentTable, RepoTable } from "../components/Tables";
import { Tile } from "../components/Tile";
import { UsageChart } from "../components/UsageChart";
import { compact, int, pct, relativeTime, usd } from "../format";
import { Reveal } from "../motion/Reveal";
import type { Overview } from "../types";

interface Props {
  overview: Overview;
  view: "overview" | "settings";
  subtitle: string;
  updatedAt: Date | null;
  refreshing: boolean;
  onRefresh: () => void;
  ownKey: boolean;
  onOwnKeyChange: (usesOwnKey: boolean) => void;
  installUrl: string | null;
  billing: boolean;
}

/** The signed-in pages. Loaded on demand, so a visitor to the public site never downloads them. */
export default function Dashboard({ overview, view, subtitle, updatedAt, refreshing, onRefresh, ownKey, onOwnKeyChange, installUrl, billing }: Props) {
  const t = overview.totals;
  const whole = (n: number) => int(Math.round(n));
  return (
    <>
      <div className="toolbar">
        <div>
          <h1 className="page-title">{view === "settings" ? "Settings" : "Overview"}</h1>
          <p className="subtitle">{subtitle}</p>
        </div>
        <span className="row">
          <span className="muted" aria-live="polite">
            {updatedAt ? `Updated ${relativeTime(updatedAt.toISOString()) || "just now"}` : ""}
          </span>
          <button className="btn" onClick={onRefresh} disabled={refreshing} aria-label="Refresh data">
            <Icon name="refresh" size={14} />
            <span className="hide-narrow">{refreshing ? "Refreshing…" : "Refresh"}</span>
          </button>
        </span>
      </div>

      {view === "overview" ? (
        <>
          {t.reviews === 0 && <GettingStarted hasReviews={false} usesOwnKey={ownKey} installUrl={installUrl} />}

          <Reveal as="section" label="Summary" y={10}>
            <SectionTitle icon="grid">Summary</SectionTitle>
            <div className="tiles">
              <Tile icon="check-circle" label="Reviews" value={int(t.reviews)} count={{ value: t.reviews, format: whole }} />
              <Tile icon="git-pull-request" label="Pull requests" value={int(t.prs)} count={{ value: t.prs, format: whole }} />
              <Tile icon="message-square" label="Findings posted" value={int(t.findings)} count={{ value: t.findings, format: whole }} />
              <Tile
                icon="target"
                label="Precision"
                value={pct(t.precision)}
                hint={t.precision === null ? "No feedback yet" : "Accepted of judged"}
                count={t.precision === null ? undefined : { value: t.precision, format: pct }}
              />
              <Tile icon="thumbs-up" label="Accepted" value={int(t.accepted)} tone="good" count={{ value: t.accepted, format: whole }} />
              <Tile icon="thumbs-down" label="Dismissed" value={int(t.dismissed)} tone="bad" count={{ value: t.dismissed, format: whole }} />
              <Tile icon="cpu" label="Tokens" value={compact(t.tokens)} tone="neutral" count={{ value: t.tokens, format: (n) => compact(Math.round(n)) }} />
              <Tile icon="coins" label="Cost" value={usd(t.cost_usd)} hint={t.cost_usd ? undefined : "No verified price yet"} tone="neutral" />
            </div>
          </Reveal>

          <Reveal as="section" label="Precision by rule" y={10}>
            <SectionTitle icon="target">Precision by rule</SectionTitle>
            <p className="sub">Of the findings people judged, the share they accepted.</p>
            <RuleBars rules={overview.rules} />
          </Reveal>

          <Reveal as="section" label="Monthly usage" y={10}>
            <SectionTitle icon="calendar">Reviews per month</SectionTitle>
            <UsageChart rows={overview.usage} />
          </Reveal>

          <Reveal as="section" label="Repositories" y={10}>
            <SectionTitle icon="folder">Repositories</SectionTitle>
            <RepoTable repos={overview.repos} />
          </Reveal>

          <Reveal as="section" label="Recent reviews" y={10}>
            <SectionTitle icon="clock">Recent reviews</SectionTitle>
            <RecentTable recent={overview.recent} />
          </Reveal>
        </>
      ) : (
        <>
          <Reveal as="section" label="Plan" y={10}>
            <SectionTitle icon="credit-card">Plan and usage</SectionTitle>
            <PlanCard plan={overview.plan} period={overview.period} installation={overview.installation_id} billing={billing} />
          </Reveal>

          <Reveal as="section" label="AI model" y={10}>
            <SectionTitle icon="cpu">AI model</SectionTitle>
            <p className="sub">Reviews use Reviewly's models unless you add your own key.</p>
            <ModelSettings installation={overview.installation_id} onChange={onOwnKeyChange} />
          </Reveal>
        </>
      )}
    </>
  );
}
