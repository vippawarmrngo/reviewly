"""Runs the worker loop inside the API process, for platforms with no separate worker process/service
(REVIEWLY_EMBEDDED_WORKER=true — e.g. a free-tier host that only offers one web service). Off by
default: the tested design is two processes (api, worker), and that stays the default everywhere.

This reuses worker.main's build_github/build_handler and its background loops unchanged rather than
re-implementing them, so there is exactly one place that logic lives.
"""

import asyncio
from dataclasses import dataclass

import httpx
import structlog
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.core.config import Settings
from app.queue.redis_queue import RedisJobQueue
from app.rag.pg_store import PgChunkStore
from worker.main import build_github, build_handler, feedback_loop, reconcile_loop, retention_loop
from worker.runner import Worker

log = structlog.get_logger()


@dataclass
class EmbeddedWorker:
    worker: Worker
    stop: asyncio.Event
    tasks: list[asyncio.Task[None]]

    async def shutdown(self, grace_s: float) -> None:
        """Mirrors worker.main.run()'s shutdown: stop claiming, let in-flight jobs finish or requeue."""
        self.stop.set()
        await self.worker.shutdown(grace_s)
        await asyncio.gather(*self.tasks, return_exceptions=True)


async def start(
    settings: Settings,
    sm: async_sessionmaker[AsyncSession],
    redis: Redis,
    http: httpx.AsyncClient,
    queue: RedisJobQueue,
) -> EmbeddedWorker:
    store = PgChunkStore(sm)
    github = build_github(settings, redis, http)
    handler = build_handler(settings, sm, redis, http, store, github)
    worker = Worker(sessionmaker=sm, queue=queue, handler=handler, settings=settings)
    stop = asyncio.Event()
    tasks = [
        asyncio.create_task(worker.run()),
        asyncio.create_task(reconcile_loop(stop, sm, queue, settings)),
        asyncio.create_task(retention_loop(stop, store, settings)),
        asyncio.create_task(feedback_loop(stop, sm, github)),
    ]
    log.info("embedded_worker_started", concurrency=settings.worker_concurrency)
    return EmbeddedWorker(worker=worker, stop=stop, tasks=tasks)
