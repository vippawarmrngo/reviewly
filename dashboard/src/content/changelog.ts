export interface ChangelogEntry {
  /** ISO date of the last commit in the group (from the repository history). */
  date: string;
  title: string;
  items: string[];
}

/** Newest first. Written from the repository's commit history; nothing here is a marketing claim. */
export const CHANGELOG: ChangelogEntry[] = [
  {
    date: "2026-09-26",
    title: "Public site, docs and status",
    items: [
      "A landing page with an animated example review, real URLs for every page, per-page titles and a sitemap.",
      "Docs, this changelog, and a live status page.",
      "The dashboard now has Overview and Settings views, loading placeholders, auto-refresh while a review runs, and a refreshed design with dark mode.",
      "Security headers (strict Content-Security-Policy, no framing) and a cross-site request check on dashboard actions.",
    ],
  },
  {
    date: "2026-09-26",
    title: "Hardening",
    items: [
      "Custom model endpoints are checked again at connection time and connect only to the address that was checked, closing the DNS-rebinding gap.",
      "An optional second-pass verification of findings, off by default until it is measured.",
    ],
  },
  {
    date: "2026-09-26",
    title: "Operations",
    items: [
      "Prometheus metrics and OpenTelemetry tracing.",
      "Load tests of a 500-pull-request burst, and failure tests (model down, Redis restart, worker killed).",
      "Fixes they found: an outage of every model no longer kills reviews, and webhooks return a retryable error instead of a 500 when Redis is down.",
      "Deploy configuration for Fly.io and an operations runbook.",
    ],
  },
  {
    date: "2026-09-26",
    title: "Bring your own key",
    items: [
      "Use your own API key for OpenAI, Anthropic, Google Gemini, Groq, Mistral or any OpenAI-compatible endpoint. Keys are encrypted and never shown again.",
      "A getting-started checklist and one-click GitHub App creation for whoever hosts the service.",
    ],
  },
  {
    date: "2026-09-25",
    title: "Dashboard, feedback and billing",
    items: [
      "A React dashboard: reviews, findings, precision per rule, usage.",
      "Learning from your team: accept or dismiss by reply or reaction; repeatedly dismissed findings stop appearing.",
      "Monthly usage, a free allowance, and Stripe test-mode checkout.",
      "Sign in with GitHub.",
    ],
  },
  {
    date: "2026-09-25",
    title: "Evaluation",
    items: [
      "A benchmark of 58 labeled changes with confidence intervals, baselines and a check that fails CI if quality regresses.",
      "Prompt v3 (rules of evidence), which raised precision on the benchmark, and a two-model fallback chain.",
    ],
  },
  {
    date: "2026-09-25",
    title: "Cost and safety",
    items: [
      "Secret redaction before anything is sent to a model, and defence against instructions hidden in code.",
      "A daily token budget and rate limit per installation, and a cache for repeated changes.",
    ],
  },
  {
    date: "2026-09-25",
    title: "Repository context",
    items: [
      "Optional, off by default: an index of your code (Python, JavaScript, TypeScript, Go, Java) so reviews understand surrounding code, with hybrid search and re-ranking.",
    ],
  },
  {
    date: "2026-09-24",
    title: "Foundations",
    items: [
      "Webhook intake with signature checks and de-duplication, and a job queue with retries, fairness and crash recovery.",
      "Diff parsing, one batched review per pull request, and verification that every comment points at a real line.",
    ],
  },
];
