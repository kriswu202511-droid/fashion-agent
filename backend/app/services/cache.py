import hashlib
import time
from collections import OrderedDict
from typing import Any


class CacheService:
    """In-memory LRU cache with TTL. Drop-in replaceable with Redis."""

    def __init__(self, max_size: int = 512, default_ttl: int = 300):
        self._store: OrderedDict[str, tuple[Any, float]] = OrderedDict()
        self._max_size = max_size
        self._default_ttl = default_ttl

    def get(self, key: str) -> Any | None:
        if key not in self._store:
            return None
        value, expires_at = self._store[key]
        if time.time() > expires_at:
            del self._store[key]
            return None
        self._store.move_to_end(key)
        return value

    def set(self, key: str, value: Any, ttl: int | None = None) -> None:
        ttl = ttl or self._default_ttl
        expires_at = time.time() + ttl
        if key in self._store:
            self._store.move_to_end(key)
        self._store[key] = (value, expires_at)
        while len(self._store) > self._max_size:
            self._store.popitem(last=False)

    def delete(self, key: str) -> None:
        self._store.pop(key, None)

    def clear(self) -> None:
        self._store.clear()

    @staticmethod
    def make_key(*args: Any) -> str:
        raw = "|".join(str(a) for a in args)
        return hashlib.sha256(raw.encode()).hexdigest()[:32]


cache_service = CacheService()
