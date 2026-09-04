import json
from typing import Any

from app.agents.base import AgentResult, BaseAgent
from app.agents.registry import register_agent
from app.agents.content.prompts import (
    COPYWRITING_PROMPT,
    COPYWRITING_SYSTEM_PROMPT,
    LIVESTREAM_PROMPT,
    LIVESTREAM_SYSTEM_PROMPT,
    SHORT_VIDEO_PROMPT,
    SHORT_VIDEO_SYSTEM_PROMPT,
)
from app.services.llm import llm_service
from app.services.video import video_service


@register_agent
class ContentAgent(BaseAgent):
    name = "content"
    description = "生成短视频脚本、直播话术、商品文案等内容素材，支持视频生成"
    version = "0.2.0"
    icon = "VideoCameraOutlined"

    async def run(self, input_data: dict[str, Any]) -> AgentResult:
        content_type = input_data.get("content_type", "short_video")

        if content_type == "short_video":
            result = await self._generate_short_video(input_data)
            if result.success and input_data.get("generate_video"):
                narration = self._extract_narration(result.data.get("script", {}))
                video_result = await video_service.generate(
                    script=json.dumps(result.data.get("script", {}), ensure_ascii=False),
                    narration=narration,
                )
                result.data["video"] = video_result
            return result
        elif content_type == "livestream":
            return await self._generate_livestream_script(input_data)
        elif content_type == "copywriting":
            return await self._generate_copywriting(input_data)
        else:
            return AgentResult(success=False, error=f"不支持的内容类型: {content_type}")

    async def _generate_short_video(self, input_data: dict[str, Any]) -> AgentResult:
        prompt = SHORT_VIDEO_PROMPT.format(
            product_name=input_data.get("product_name", ""),
            category=input_data.get("category", "女装"),
            selling_points=input_data.get("selling_points", ""),
            price=input_data.get("price", ""),
            platform=input_data.get("platform", "抖音"),
            style=input_data.get("style", "种草分享"),
            target_audience=input_data.get("target_audience", "18-35岁女性"),
            duration=input_data.get("duration", "30秒"),
        )

        messages = [
            {"role": "system", "content": SHORT_VIDEO_SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ]

        try:
            response = await llm_service.chat(messages, model="qwen-plus")
            try:
                data = json.loads(response)
            except json.JSONDecodeError:
                data = {"raw_script": response}

            return AgentResult(success=True, data={"content_type": "short_video", "script": data})
        except Exception as e:
            return AgentResult(success=False, error=f"短视频脚本生成失败: {str(e)}")

    async def _generate_livestream_script(self, input_data: dict[str, Any]) -> AgentResult:
        prompt = LIVESTREAM_PROMPT.format(
            theme=input_data.get("theme", "夏季新款上新"),
            products=input_data.get("products", ""),
            duration=input_data.get("duration", "2小时"),
            promotion=input_data.get("promotion", "满199减30"),
            platform=input_data.get("platform", "抖音"),
            host_style=input_data.get("host_style", "活泼亲切"),
            goal=input_data.get("goal", "提升转化率，目标GMV 5万"),
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

            return AgentResult(success=True, data={"content_type": "livestream", "script": data})
        except Exception as e:
            return AgentResult(success=False, error=f"直播话术生成失败: {str(e)}")

    async def _generate_copywriting(self, input_data: dict[str, Any]) -> AgentResult:
        prompt = COPYWRITING_PROMPT.format(
            product_name=input_data.get("product_name", ""),
            category=input_data.get("category", "女装"),
            selling_points=input_data.get("selling_points", ""),
            price=input_data.get("price", ""),
            target_audience=input_data.get("target_audience", ""),
            platform=input_data.get("platform", "淘宝"),
            copy_type=input_data.get("copy_type", "标题+详情"),
            style=input_data.get("style", "简约高级"),
        )

        messages = [
            {"role": "system", "content": COPYWRITING_SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ]

        try:
            response = await llm_service.chat(messages, model="qwen-plus")
            try:
                data = json.loads(response)
            except json.JSONDecodeError:
                data = {"raw_copy": response}

            return AgentResult(success=True, data={"content_type": "copywriting", "copy": data})
        except Exception as e:
            return AgentResult(success=False, error=f"文案生成失败: {str(e)}")

    def _extract_narration(self, script: dict | str) -> str:
        if isinstance(script, str):
            return script
        parts = []
        scenes = script.get("scenes", [])
        for scene in scenes:
            narration = scene.get("narration", "")
            if narration:
                parts.append(narration)
        return "\n".join(parts) if parts else str(script)
