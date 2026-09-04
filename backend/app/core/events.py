import asyncio
from collections import defaultdict
from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any


@dataclass
class Event:
    source_agent: str
    event_type: str
    data: dict[str, Any]
    target_agent: str | None = None
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())


class EventBus:
    def __init__(self):
        self._handlers: dict[str, list[Callable]] = defaultdict(list)
        self._wildcard_handlers: list[Callable] = []
        self._history: list[Event] = []

    def subscribe(self, event_type: str, handler: Callable):
        self._handlers[event_type].append(handler)

    def subscribe_all(self, handler: Callable):
        self._wildcard_handlers.append(handler)

    def unsubscribe(self, event_type: str, handler: Callable):
        if event_type in self._handlers:
            self._handlers[event_type].remove(handler)

    def unsubscribe_all(self, handler: Callable):
        if handler in self._wildcard_handlers:
            self._wildcard_handlers.remove(handler)

    async def publish(self, event: Event):
        self._history.append(event)
        handlers = list(self._handlers.get(event.event_type, []))
        if event.target_agent:
            handlers = [h for h in handlers if hasattr(h, "__self__") and h.__self__.name == event.target_agent]

        all_handlers = handlers + list(self._wildcard_handlers)
        tasks = [asyncio.create_task(self._safe_call(handler, event)) for handler in all_handlers]
        if tasks:
            await asyncio.gather(*tasks)

    async def _safe_call(self, handler: Callable, event: Event):
        try:
            result = handler(event)
            if asyncio.iscoroutine(result):
                await result
        except Exception:
            pass

    def get_history(self, limit: int = 50) -> list[Event]:
        return self._history[-limit:]


event_bus = EventBus()
