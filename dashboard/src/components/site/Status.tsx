import { useCallback, useEffect, useState } from "react";
import { Icon } from "../Icon";

type Check = "ok" | "down";
type State =
  | { kind: "checking" }
  | { kind: "done"; checks: Record<string, Check>; at: Date }
  | { kind: "unreachable"; at: Date };

const COMPONENTS: [string, string][] = [
  ["db", "Database"],
  ["redis", "Queue and cache"],
];
const REFRESH_MS = 30_000;

export async function readStatus(): Promise<State> {
  try {
    const res = await fetch("/readyz", { cache: "no-store" });
    const body = (await res.json()) as Record<string, string>;
    const checks: Record<string, Check> = {};
    for (const [key] of COMPONENTS) checks[key] = body[key] === "ok" ? "ok" : "down";
    return { kind: "done", checks, at: new Date() };
  } catch {
    return { kind: "unreachable", at: new Date() };
  }
}

export default function Status() {
  const [state, setState] = useState<State>({ kind: "checking" });
  const check = useCallback(async () => setState(await readStatus()), []);

  useEffect(() => {
    void check();
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") void check();
    }, REFRESH_MS);
    return () => window.clearInterval(id);
  }, [check]);

  const allOk = state.kind === "done" && Object.values(state.checks).every((c) => c === "ok");
  const headline =
    state.kind === "checking" ? "Checking…" : state.kind === "unreachable" ? "Could not reach the service" : allOk ? "All systems operational" : "Some systems are having problems";
  const tone = state.kind === "checking" ? "queued" : allOk ? "done" : "dead";

  return (
    <article className="prose site">
      <h1>Status</h1>
      <p className="site-lead">The live health of this Reviewly service.</p>
      <div className={`status-banner ${tone}`} role="status">
        <Icon name={tone === "done" ? "check-circle" : tone === "dead" ? "alert" : "clock"} size={18} />
        <strong>{headline}</strong>
      </div>
      <ul className="status-list">
        {COMPONENTS.map(([key, label]) => {
          const c = state.kind === "done" ? state.checks[key] : undefined;
          return (
            <li key={key} className="card">
              <span>{label}</span>
              <span className={`status ${c === "ok" ? "done" : c === "down" ? "dead" : "queued"}`}>
                <Icon name={c === "ok" ? "check-circle" : c === "down" ? "x-circle" : "clock"} size={14} />
                {c === "ok" ? "Operational" : c === "down" ? "Down" : state.kind === "unreachable" ? "Unknown" : "Checking"}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="muted small" aria-live="polite">
        {state.kind !== "checking" && `Last checked ${state.at.toLocaleTimeString()}. `}
        <button className="link" type="button" onClick={() => void check()}>
          Check again
        </button>
      </p>
      <p className="muted small">
        This page shows the current state only, read directly from the service. It does not record history or uptime figures, because none are measured.
      </p>
    </article>
  );
}
