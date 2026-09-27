# Reviewly

AI pull request reviewer delivered as a GitHub App. It reads each pull request's diff and posts one focused review:
inline comments on the exact lines, with suggested fixes, and it stays quiet when there is nothing to say.

**Live:** [reviewly-api.onrender.com](https://reviewly-api.onrender.com) · Operations: [docs/runbook.md](docs/runbook.md) ·
Load and failure tests: [docs/load-test.md](docs/load-test.md)

Every number in this README was measured; the limits of each are stated next to it.

```
GitHub --webhook--> API (verify HMAC, dedupe, insert job, enqueue) --> Postgres (source of truth: jobs, findings, usage)
                                   |                                        ^
                                   v                                        | reconciler re-enqueues lost jobs
                               Redis queue (fair per installation, retries, DLQ, visibility timeout)
                                   |
                                   v
                    Worker: diff -> filter -> redact -> LLM (fallback + circuit breaker) -> verify lines -> rank
                                   |                          ^ optional repo context (pgvector + full-text)
                                   v
                     one batched GitHub review  -->  dashboard, feedback (dismiss/accept)
```

## Stack
FastAPI, SQLModel/SQLAlchemy (async), Alembic, Postgres + pgvector, Redis, structlog, Prometheus, OpenTelemetry;
React 18 + TypeScript + Vite dashboard and public site, served by the same app. Deployed on Render from the `Dockerfile`.

## Using Reviewly
**As a user:** install the GitHub App on your repositories and open a pull request. Reviewly posts one review with inline
comments and suggested fixes. Sign in to the dashboard to see reviews, findings and precision per rule. Reply
`@reviewly accept` or `@reviewly dismiss` to a comment (or react 👍 / 👎) and it learns what your team wants: a kind of
finding dismissed at least twice and never accepted in a repository is not raised there again.

**Use your own AI model.** In the dashboard, open *Settings → AI model*, pick a provider (OpenAI, Anthropic, Google Gemini,
Groq, Mistral, or any OpenAI-compatible endpoint), type the model name, paste your key and press *Save and test key*. The key
is checked with a real call before it is saved, encrypted at rest, never shown again (only its last four characters), and used
only for your repositories. Your code then goes only to the provider you chose; there is no silent fallback to other models.

**Configure per repository** with a `.reviewly.yml` (paths to ignore, strictness, comment limit, your own rules). It is read
from the pull request's base branch, so a change cannot loosen its own review. Full reference: the `/docs` page of the site.

## Run it locally
Needs Python 3.12, [uv](https://docs.astral.sh/uv/), Node 20, Postgres 16 with pgvector, and Redis.
```
cp .env.example .env            # set REVIEWLY_DATABASE_URL, REVIEWLY_REDIS_URL, and an LLM key if you have one
uv sync
cd dashboard && npm ci && npm run build && cd ..
make run                        # migrations, then the API + site on http://localhost:8000
uv run python -m worker.main    # the worker, in a second terminal
```
Or set `REVIEWLY_EMBEDDED_WORKER=true` to run the worker inside the API process (one process only).
Signing in always goes through GitHub OAuth, locally too; see the next section for creating the GitHub App.
`make lint`, `make test`, `make dashboard-test` run the checks.

## Hosting it
1. Deploy the `Dockerfile` with Postgres (pgvector) and Redis. The exact Render steps, env vars and free-tier limits are in
   [docs/runbook.md](docs/runbook.md).
2. Set `REVIEWLY_ENV=prod`, `REVIEWLY_PUBLIC_URL`, `REVIEWLY_GITHUB_WEBHOOK_SECRET` and `REVIEWLY_DASHBOARD_SECRET` (random, 32+
   chars), `REVIEWLY_ENCRYPTION_KEY` (`python -m app.core.crypto`) and `REVIEWLY_SETUP_TOKEN`. The app refuses to start in
   production with missing or placeholder secrets.
3. Open `https://your-host/setup?token=<REVIEWLY_SETUP_TOKEN>` and press the button: GitHub creates the App with every
   setting pre-filled and the page shows its credentials once. Put them in your host's env vars, remove the setup token, redeploy.
4. Add a platform model key (e.g. `REVIEWLY_GROQ_API_KEY`), or leave none so every installation brings its own.

## Measured review quality
The review pipeline was scored on 58 labeled changes (37 with a known bug, 15 clean, 6 prompt-injection attempts) from
real open-source projects, with bootstrap 95% confidence intervals. The evaluation harness itself is kept outside this repository.

| Model | Prompt | Precision (95% CI) | Recall (95% CI) | False alarms / clean PR | Latency p50 / p95 |
|---|---|---|---|---|---|
| groq:openai/gpt-oss-120b | v1 | 67% (52–82%) | 98% (92–100%) | 1.18 | 9.7s / 46.3s |
| groq:openai/gpt-oss-120b | v3 | 84% (73–93%) | 98% (91–100%) | 0.53 | 15.3s / 101.3s |
| groq:qwen/qwen3.8-27b | v1 | 79% (67–90%) | 95% (88–100%) | 0.59 | 6.5s / 72.4s |
| groq:qwen/qwen3.8-27b | v3 | 86% (76–94%) | 95% (88–100%) | 0.41 | 17.3s / 79.3s |

- **Prompt v3 (rules of evidence) is a significant improvement on `gpt-oss-120b`:** paired over the same cases, precision
  +16.8 points (95% CI +6.1 to +28.0) and false alarms per clean PR 1.18 → 0.53, recall unchanged. It is the default.
- **Read these carefully:** 58 cases is small and the intervals are wide. Recall is probably optimistic (labels cover whole
  regions, and the bugs come from well-known libraries a model may have seen). Precision is probably slightly pessimistic
  (clean PRs are only assumed clean). Latency includes waiting out free-tier rate limits.

## Measured performance
On one laptop, with a stand-in model answering in 1 s (details and limits: [docs/load-test.md](docs/load-test.md)):
- Webhook endpoint: p99 64 ms at 10 concurrent senders on one process; about 440 requests/s per process, 990/s with four.
- 500 pull requests drained with no lost jobs and no duplicate reviews at 4, 8, 16 and 32 worker slots
  (226, 446, 881 and 1576 reviews/min; real models are slower).
- Every PR reviewed exactly once through: primary model down, all models down for 45 s, Redis restart, Redis wiped, worker `kill -9`.
- Public site: Lighthouse on `/` scored 97–98 performance on mobile and 100 on desktop, 100 for accessibility, best practices
  and SEO; about 90 KB gzip of JavaScript on first visit (CI fails above 120 KB).

## How it stays safe and cheap
- **Secret redaction** before anything reaches a model (keys, tokens, private keys, passwords, credentials in URLs, high-entropy
  strings), in two independent layers, line-preserving so diff positions stay exact. Pattern-based: risk reduction, not a guarantee.
- **Prompt injection:** diffs and titles are delimited as untrusted data; instructions aimed at the reviewer are ignored and
  flagged; the model's reply is sanitized (no images, links, HTML comments or @mentions). It only ever posts `COMMENT` reviews.
- **Every comment points at a real line** in the diff; findings that cannot be tied to a changed line are dropped.
- **Cost controls:** daily token budget and rate limit per installation, and a cache of reviews for repeated changes.
- **Your own key:** encrypted with Fernet (rotatable); custom endpoints must be public `https` and the connection is pinned to
  the checked address, so DNS rebinding cannot reach internal services.
- **Web hardening:** strict Content-Security-Policy, no framing, HSTS in production, `Origin` checks on dashboard actions,
  `SameSite=Lax` session cookies, no analytics or trackers.
- **Optional repo context** (off by default): tree-sitter chunks in pgvector + full-text search fused with RRF; indexed code is
  redacted, deleted after 30 days unused and immediately on uninstall.

## Status and limits
- Deployed on Render's free tier: it sleeps after 15 minutes idle (the first webhook after that is slow), and the free Postgres
  expires 30 days after creation unless upgraded.
- The free product has no paid plan; Stripe code exists but is not configured.
- Verified live: health and readiness against the real database and Redis, and a signed webhook traced to a finished job.
  Not yet verified live: GitHub sign-in and a real pull request review, which need the GitHub App registered against the deployment.
- The Anthropic, OpenAI and custom-endpoint adapters are tested against mocked HTTP only; Groq was exercised live.

## License
MIT
