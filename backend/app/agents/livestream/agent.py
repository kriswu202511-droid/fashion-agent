import json
from collections.abc import AsyncGenerator
from typing import Any

from app.agents.base import AgentResult, BaseAgent
from app.agents.registry import register_agent
from app.agents.livestream.prompts import (
    DANMAKU_REPLY_PROMPT,
    DANMAKU_SYSTEM_PROMPT,
    RHYTHM_PROMPT,
    URGENT_PROMPT,
)
from app.services.llm import llm_service


@register_agent
class LivestreamAgent(BaseAgent):
    name = "livestream"
    description = "直播提词、弹幕回复建议、节奏控制，帮助主播高效直播"
    version = "0.1.0"
    icon = "LiveOutlined"

    async def run(self, input_data: dict[str, Any]) -> AgentResult:
        mode = input_data.get("mode", "script")

        if mode == "script":
            return await self._generate_script(input_data)
        elif mode == "rhythm":
            return await self._suggest_rhythm(input_data)
        elif mode == "urgent":
            return await self._generate_urgent(input_data)
        else:
            return AgentResult(success=False, error=f"不支持的模式: {mode}")

    async def stream(self, input_data: dict[str, Any]) -> AsyncGenerator[dict[str, Any], None]:
        mode = input_data.get("mode", "danmaku")

        if mode == "danmaku":
            async for chunk in self._reply_danmaku_stream(input_data):
                yield chunk
        else:
            result = await self.run(input_data)
            yield result.to_dict()

    async def _generate_script(self, input_data: dict[str, Any]) -> AgentResult:
        from app.agents.content.prompts import LIVESTREAM_PROMPT, LIVESTREAM_SYSTEM_PROMPT

        prompt = LIVESTREAM_PROMPT.format(
            theme=input_data.get("theme", "夏季新款上新"),
            products=input_data.get("products", ""),
            duration=input_data.get("duration", "2小时"),
            promotion=input_data.get("promotion", ""),
            platform=input_data.get("platform", "抖音"),
            host_style=input_data.get("host_style", "活泼亲切"),
            goal=input_data.get("goal", "提升转化率"),
        )

        messages = [
            {"role": "system", "content": LIVESTREAM_SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ]

        try:
            response = await llm_service.chat(messages, model="qwen-plus")
            try:
                data = json.loads(response)
            except json.JSONDecodeError:
                data = {"raw_script": response}
            return AgentResult(success=True, data={"script": data})
        except Exception as e:
            return AgentResult(success=False, error=f"直播脚本生成失败: {str(e)}")

    async def _reply_danmaku_stream(self, input_data: dict[str, Any]) -> AsyncGenerator[dict[str, Any], None]:
        prompt = DANMAKU_REPLY_PROMPT.format(
            session_title=input_data.get("session_title", "直播中"),
            current_topic=input_data.get("current_topic", ""),
            danmaku_content=input_data.get("danmaku", ""),
        )

        messages = [
            {"role": "system", "content": DANMAKU_SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ]

        full_response = ""
        try:
            async for token in llm_service.chat_stream(messages, model="qwen-plus", temperature=0.5):
                full_response += token
                yield {"type": "danmaku_reply", "delta": token, "partial": full_response}

            try:
                data = json.loads(full_response)
            except json.JSONDecodeError:
                data = {"category": "其他", "reply": full_response, "confidence": 0.7, "need_human": False}

            yield {"type": "danmaku_reply", "done": True, "data": data}
        except Exception as e:
            yield {"type": "error", "error": str(e)}

    async def _suggest_rhythm(self, input_data: dict[str, Any]) -> AgentResult:
        prompt = RHYTHM_PROMPT.format(
            title=input_data.get("title", "直播"),
            elapsed_minutes=input_data.get("elapsed_minutes", 0),
            planned_duration=input_data.get("planned_duration", 120),
            covered_products=input_data.get("covered_products", "无"),
            viewer_count=input_data.get("viewer_count", 0),
        )

        messages = [
            {"role": "user", "content": prompt},
        ]

        try:
            response = await llm_service.chat(messages, model="qwen-plus")
            try:
                data = json.loads(response)
            except json.JSONDecodeError:
                data = {"suggestion": response}
            return AgentResult(success=True, data=data)
        except Exception as e:
            return AgentResult(success=False, error=f"节奏建议生成失败: {str(e)}")

    async def _generate_urgent(self, input_data: dict[str, Any]) -> AgentResult:
        prompt = URGENT_PROMPT.format(
            product_info=input_data.get("product_info", ""),
            promotion=input_data.get("promotion", ""),
            stock_info=input_data.get("stock_info", ""),
            viewer_count=input_data.get("viewer_count", 0),
        )

        messages = [
            {"role": "user", "content": prompt},
        ]

        try:
            response = await llm_service.chat(messages, model="qwen-plus", temperature=0.8)
            return AgentResult(success=True, data={"urgent_script": response})
        except Exception as e:
            return AgentResult(success=False, error=f"促单话术生成失败: {str(e)}")
