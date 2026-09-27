.PHONY: run lint test dashboard-dev dashboard-test dashboard-build

# Local dev: needs Postgres (with pgvector) and Redis running, and a .env (see .env.example).
run:
	uv run alembic upgrade head && uv run uvicorn app.main:app --reload
lint:
	uv run ruff check . && uv run ruff format --check . && uv run mypy
test:
	uv run pytest -q

dashboard-dev:
	cd dashboard && npm run dev
dashboard-test:
	cd dashboard && npm run typecheck && npm test
dashboard-build:
	cd dashboard && npm ci && npm run build
