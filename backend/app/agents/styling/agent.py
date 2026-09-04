import json
from typing import Any

from app.agents.base import AgentResult, BaseAgent
from app.agents.registry import register_agent
from app.agents.styling.prompts import STYLING_PROMPT, STYLING_SYSTEM_PROMPT
from app.services.llm import llm_service


@register_agent
class StylingAgent(BaseAgent):
    name = "styling"
    description = "根据体型、场景、风格偏好推荐个性化穿搭方案"
    version = "0.1.0"
    icon = "SkinOutlined"

    async def run(self, input_data: dict[str, Any]) -> AgentResult:
        scene = input_data.get("scene", "日常通勤")
        style_preference = input_data.get("style_preference", "简约")
        body_type = input_data.get("body_type", "标准")
        gender = input_data.get("gender", "女")
        season = input_data.get("season", "春季")
        extra_notes = input_data.get("extra_notes", "")
        photo_description = input_data.get("photo_description", "")

        photo_context = ""
        if photo_description:
            photo_context = f"参考照片描述：{photo_description}"

        prompt = STYLING_PROMPT.format(
            scene=scene,
            style_preference=style_preference,
            body_type=body_type,
            gender=gender,
            season=season,
            extra_notes=extra_notes or "无",
            photo_context=photo_context,
        )

        messages = [
            {"role": "system", "content": STYLING_SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ]

        try:
            response = await llm_service.chat(messages, model="qwen-plus", temperature=0.8)
            try:
                data = json.loads(response)
            except json.JSONDecodeError:
                data = {"raw_recommendation": response}

            return AgentResult(success=True, data=data)
        except Exception as e:
            return AgentResult(success=False, error=f"穿搭推荐生成失败: {str(e)}")
