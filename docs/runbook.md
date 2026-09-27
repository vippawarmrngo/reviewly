# Runbook

Metrics: API `GET /metrics` (set `REVIEWLY_METRICS_TOKEN` to require `Authorization: Bearer ...`), worker on
port `REVIEWLY_WORKER_METRICS_PORT` (9100). Logs are JSON with a `correlation_id` that follows a delivery from
webhook to job to worker: `grep <id>` across both services shows one PR's whole path. Tracing is off until
`REVIEWLY_OTLP_ENDPOINT` is set (spans carry the same `correlation_id` attribute; they are not linked by W3C
trace context). The live instance runs on Render (below).

## First deploy (Render, free tier)
Deployed once via Render's API, not the dashboard; these are the equivalent manual steps.

1. **Database and cache**, both free plan: a Postgres instance (`version: 16`) and a Key Value (Redis)
   instance, same region. Free Postgres **expires 30 days after creation** and is then deleted — upgrade
   it or export the data before then. Free Key Value has `persistenceMode: off`: a restart loses queued
   jobs' in-flight state, which is why Postgres (not Redis) is the system's source of truth — the
   reconciler re-enqueues anything Redis lost.
2. **Web service**: Docker runtime from this repo, branch `reviewly-main`, health check path `/healthz`.
   Render's free plan allows only one service type per project (**no background workers on free**), so:
   - Set `REVIEWLY_EMBEDDED_WORKER=true` — the API process also drains the queue (`app/embedded_worker.py`).
     This is an opt-in single-process mode; the tested default everywhere else is two processes.
   - Env vars: `REVIEWLY_ENV=prod`, `REVIEWLY_DATABASE_URL` / `REVIEWLY_REDIS_URL` (the **internal**
     connection strings — Postgres needs `+psycopg` added to the scheme: `postgresql+psycopg://...`),
     `REVIEWLY_GITHUB_WEBHOOK_SECRET`, `REVIEWLY_DASHBOARD_SECRET` (both `openssl rand -hex 32`),
     `REVIEWLY_ENCRYPTION_KEY` (`python -m app.core.crypto`), `REVIEWLY_SETUP_TOKEN` (`openssl rand -hex
     24`), `REVIEWLY_PUBLIC_URL` (the service's own `https://<name>.onrender.com` URL, set *after* the
     service exists so the URL is known).
3. **Migrations are not automatic on the free plan** — `preDeployCommand` (Render's usual mechanism for
   this) is accepted by the API but does not take effect on `starter`/free build plans, confirmed by
   checking the service after setting it. Run them by hand after every schema change, from anywhere, using
   the database's **external** connection string (Postgres dashboard → Connect → temporarily add your IP
   under Access Control, since the external endpoint has an IP allow list; empty list = nobody, not
   everyone):
   ```
   REVIEWLY_DATABASE_URL=postgresql+psycopg://<external-connection-string> uv run alembic upgrade head
   ```
   Remove the temporary IP allow-list entry afterward — the deployed app itself uses the internal
   connection string and never needs it.
4. Open `https://<service>.onrender.com/setup?token=<REVIEWLY_SETUP_TOKEN>`, press the button, and put the
   printed credentials (app id, private key, webhook secret, OAuth client id/secret, slug) into the
   service's env vars. Then remove `REVIEWLY_SETUP_TOKEN` and redeploy.
5. Check `/readyz` returns `{"db":"ok","redis":"ok"}`, and that a signed test webhook to
   `/webhooks/github` returns `{"status": "enqueued"}` and shows up in the logs as `job_enqueued` then
   `job_done` (or `review_stub_no_credentials` before step 4 is done).

**Known limits of this free deployment, honestly stated:**
- The free web service **spins down after 15 minutes idle** and cold-starts on the next request, which can
  take well over the several seconds a webhook delivery usually allows before GitHub treats it as failed
  (GitHub does retry, so a delayed review is more likely than a lost one, but the first PR after any idle
  period will be slow). A paid plan (`starter`, ~$7/month) removes this.
- Free Postgres is deleted after 30 days unless upgraded.
- No autoscaling is configured; `numInstances: 1` is what free enforces anyway, which is also what makes
  the embedded-worker mode safe here (see `app/core/config.py`'s note on `embedded_worker`).

Sizing: each web process holds up to 10 Postgres connections (`REVIEWLY_DB_POOL_SIZE` + `REVIEWLY_DB_MAX_OVERFLOW`);
instances x `WEB_CONCURRENCY` x 10 (plus a separate worker, if you run one) must stay under the database's connection limit.

## Symptoms and what to do
| Symptom | Look at | Action |
|---|---|---|
| PRs not reviewed at all | `reviewly_webhook_requests_total{result}`; GitHub App > Advanced > Recent deliveries | `bad_signature`: webhook secret differs between GitHub and the app. No deliveries: wrong webhook URL. |
| Webhook returns 503 | `/readyz`, logs `webhook_failed` / `webhook_dedupe_failed` | Postgres or Redis is down. GitHub redelivers 5xx automatically; nothing is lost. |
| Queue growing (`reviewly_queue_depth{state="ready"}`) | `reviewly_llm_seconds`, `reviewly_job_seconds`, worker logs | Slow model: raise `REVIEWLY_WORKER_CONCURRENCY` or add worker machines. Throughput scales ~linearly with slots. |
| `reviewly_llm_breaker_open` = 1 | `reviewly_llm_calls_total{outcome="error"}` | A provider is failing; traffic uses the next in `REVIEWLY_PROVIDER_ORDER`. If all are open, jobs are *deferred* (retried ~every 30 s, attempts kept) for up to `REVIEWLY_LLM_OUTAGE_WINDOW_S`. Nothing to do but fix or replace the key/provider. |
| Jobs `dead` | `select id,last_error from jobs where status='dead'` | Fix the cause, then `python -m scripts.requeue_dead` (dry run) and `--apply` (optionally `--installation N --since-hours 6`). Reviews are idempotent per head SHA: an already reviewed PR is skipped. |
| Redis restarted or wiped | worker log `reconciled_jobs` | Automatic. Postgres is the source of truth; the reconciler re-enqueues jobs within `REVIEWLY_RECONCILE_INTERVAL_S` + `REVIEWLY_RECONCILE_GRACE_S`; jobs that were in flight wait up to `REVIEWLY_VISIBILITY_TIMEOUT_S` (120 s). |
| Worker crashed / deploy | log `job_reaped` | Automatic after the visibility timeout. SIGTERM finishes or requeues in-flight jobs within `REVIEWLY_SHUTDOWN_GRACE_S` (25 s); give the platform's stop timeout more than that. |
| "no AI model configured" notices on PRs | dashboard > AI model | The platform has no model key and the installation has not added its own. Set a platform key or ask them to add one. |
| A user's own key stopped working | PR notice; dashboard | They are told; there is deliberately no fallback to platform models. Ask them to re-enter it. If `REVIEWLY_ENCRYPTION_KEY` was lost, all stored keys are unreadable and must be re-entered. |
| Free-tier notices unexpectedly | `usage` table, `REVIEWLY_FREE_REVIEWS_PER_MONTH` | 0 disables the limit. |
| Cost surprise | `reviewly_llm_cost_usd_total`, `reviewly_llm_tokens_total`, `REVIEWLY_DAILY_TOKEN_BUDGET` | Per-installation daily token budget caps spend on platform models. Cost uses an unverified price table: treat as an estimate. |

## Migrations and rollback
On Render's free plan migrations are run by hand after a schema change (see the Render section). Migrations are
additive so far (0001-0006); to roll back the app, redeploy a previous commit from the Render dashboard. Do not run
`alembic downgrade` in production without a backup.

## Secrets rotation
- Encryption key: set `REVIEWLY_ENCRYPTION_KEY=<new>,<old>` (first encrypts, all decrypt), deploy, later drop the old one.
- Webhook secret: change it in the GitHub App settings and on the host at the same time; deliveries fail with
  `bad_signature` in between.

## The public site
- Routes: `/`, `/docs`, `/changelog`, `/status`, `/privacy`, `/signin`, `/app`, `/app/settings`. The server (`app/core/site.py`) answers them all with `index.html`, filling
  in each page's title, description, canonical URL and social tags from `REVIEWLY_PUBLIC_URL`. **If it is wrong or unset, canonical links, the sitemap and the social preview
  point at `http://localhost:8000`.** Unknown paths return a real 404 (with the site's not-found page); `/api`, `/auth`, `/webhooks`, `/assets` and friends are never answered with HTML.
- The API's interactive docs are at `/api/docs` (not `/docs`, which is the site's).
- `/status` reads `/readyz` in the visitor's browser; it shows the current state only.
- After changing the dashboard: `cd dashboard && npm run build && npm run size`. Brand images: `node scripts/render_brand.mjs` (needs Playwright). Browser audits: `scripts/audit.mjs`,
  `scripts/lighthouse.mjs` (dev-only, need a running server and a browser).
- Editing docs facts: change `dashboard/src/content/behavior.json` (or `reviewly.example.yml`, `providers.json`) together with the code; `tests/test_docs_content.py` fails if they disagree.
