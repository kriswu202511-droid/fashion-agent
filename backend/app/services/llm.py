import asyncio
import json
import time
from collections import defaultdict
from collections.abc import AsyncGenerator
from typing import Any

import httpx

from app.config import settings
from app.services.cache import cache_service

QWEN_API_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions"

RATE_LIMIT_RPM = 30
_rate_window: dict[str, list[float]] = defaultdict(list)


class RateLimitError(Exception):
    pass


def _check_rate(model: str) -> None:
    now = time.time()
    window = _rate_window[model]
    _rate_window[model] = [t for t in window if now - t < 60]
    if len(_rate_window[model]) >= RATE_LIMIT_RPM:
        raise RateLimitError(f"LLM 调用频率超限（{RATE_LIMIT_RPM} 次/分钟），请稍后重试")
    _rate_window[model].append(now)


class LLMService:
    def __init__(self):
        self.api_key = settings.dashscope_api_key
        self.base_url = QWEN_API_URL

    async def chat(
        self,
        messages: list[dict[str, Any]],
        model: str = "qwen-plus",
        temperature: float = 0.7,
        max_tokens: int = 4096,
        use_cache: bool = True,
        timeout: float = 60,
    ) -> str:
        if use_cache:
            cache_key = cache_service.make_key(model, json.dumps(messages, ensure_ascii=False, sort_keys=True), temperature)
            cached = cache_service.get(cache_key)
            if cached is not None:
                return cached

        _check_rate(model)

        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(
                self.base_url,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                },
            )
            response.raise_for_status()
            data = response.json()
            result = data["choices"][0]["message"]["content"]

        if use_cache:
            cache_service.set(cache_key, result, ttl=600)

        return result

    async def chat_stream(
        self,
        messages: list[dict[str, Any]],
        model: str = "qwen-plus",
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> AsyncGenerator[str, None]:
        _check_rate(model)

        async with httpx.AsyncClient(timeout=120) as client:
            async with client.stream(
                "POST",
                self.base_url,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                    "stream": True,
                },
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        chunk = line[6:]
                        if chunk.strip() == "[DONE]":
                            break
                        try:
                            data = json.loads(chunk)
                            delta = data["choices"][0].get("delta", {})
                            content = delta.get("content", "")
                            if content:
                                yield content
                        except (json.JSONDecodeError, KeyError, IndexError):
                            continue


llm_service = LLMService()
