import hashlib
import json
import logging
import time
from collections import OrderedDict
from typing import Any

from app.core import redis_client

logger = logging.getLogger(__name__)


class CacheService:
    """Two-layer cache: Redis (L1) + in-memory LRU (L2 fallback)."""

    def __init__(self, max_size: int = 512, default_ttl: int = 300):
        self._store: OrderedDict[str, tuple[Any, float]] = OrderedDict()
        self._max_size = max_size
        self._default_ttl = default_ttl

    async def get(self, key: str) -> Any | None:
        if redis_client.is_available():
            try:
                raw = await redis_client.client().get(key)
                if raw is not None:
                    return json.loads(raw)
            except Exception:
                pass

        if key in self._store:
            value, expires_at = self._store[key]
            if time.time() > expires_at:
                del self._store[key]
                return None
            self._store.move_to_end(key)
            return value
        return None

    async def set(self, key: str, value: Any, ttl: int | None = None) -> None:
        ttl = ttl or self._default_ttl

        if redis_client.is_available():
            try:
                await redis_client.client().set(key, json.dumps(value, ensure_ascii=False), ex=ttl)
                return
            except Exception:
                pass

        expires_at = time.time() + ttl
        if key in self._store:
            self._store.move_to_end(key)
        self._store[key] = (value, expires_at)
        while len(self._store) > self._max_size:
            self._store.popitem(last=False)

    async def delete(self, key: str) -> None:
        if redis_client.is_available():
            try:
                await redis_client.client().delete(key)
            except Exception:
                pass
        self._store.pop(key, None)

    async def clear(self) -> None:
        if redis_client.is_available():
            try:
                await redis_client.client().flushdb()
            except Exception:
                pass
        self._store.clear()

    async def invalidate_prefix(self, prefix: str) -> None:
        if redis_client.is_available():
            try:
                r = redis_client.client()
                cursor = 0
                while True:
                    cursor, keys = await r.scan(cursor, match=f"{prefix}*", count=100)
                    if keys:
                        await r.delete(*keys)
                    if cursor == 0:
                        break
            except Exception:
                pass
        stale = [k for k in self._store if k.startswith(prefix)]
        for k in stale:
            del self._store[k]

    @staticmethod
    def make_key(*args: Any) -> str:
        raw = "|".join(str(a) for a in args)
        return hashlib.sha256(raw.encode()).hexdigest()[:32]

    @staticmethod
    def api_key(*parts: str, **params: Any) -> str:
        segments = [str(p) for p in parts]
        if params:
            sorted_params = sorted(params.items())
            segments.extend(f"{k}={v}" for k, v in sorted_params if v is not None)
        return "api:" + ":".join(segments)


cache_service = CacheService()
