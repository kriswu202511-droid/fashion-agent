import logging

import redis.asyncio as aioredis

from app.config import settings

logger = logging.getLogger(__name__)

_pool: aioredis.Redis | None = None
_available: bool = False


async def connect() -> None:
    global _pool, _available
    try:
        _pool = aioredis.from_url(
            settings.redis_url,
            decode_responses=True,
            socket_connect_timeout=3,
            socket_timeout=3,
            retry_on_timeout=True,
        )
        await _pool.ping()
        _available = True
        logger.info("Redis connected: %s", settings.redis_url)
    except Exception as e:
        logger.warning("Redis unavailable, falling back to in-memory cache: %s", e)
        _pool = None
        _available = False


async def disconnect() -> None:
    global _pool, _available
    if _pool:
        await _pool.close()
        _pool = None
        _available = False


def is_available() -> bool:
    return _available


def client() -> aioredis.Redis | None:
    return _pool
