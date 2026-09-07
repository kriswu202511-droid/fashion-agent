import json
import re
from typing import Any

from app.agents.base import AgentResult, BaseAgent
from app.agents.registry import register_agent
from app.agents.styling.prompts import PHOTO_ANALYSIS_PROMPT, STYLING_PROMPT, STYLING_SYSTEM_PROMPT
from app.services.llm import llm_service


@register_agent
class StylingAgent(BaseAgent):
    name = "styling"
    description = "根据体型、场景、风格偏好推荐个性化穿搭方案，支持上传照片分析"
    version = "0.2.0"
    icon = "SkinOutlined"

    def _parse_json_response(self, response: str) -> dict:
        cleaned = response.strip()
        cleaned = re.sub(r"^```(?:json)?\s*\n?", "", cleaned)
        cleaned = re.sub(r"\n?```\s*$", "", cleaned)
        cleaned = cleaned.strip()
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            return {"raw_recommendation": response}

    async def _analyze_photo(self, photo_base64: str) -> str:
        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": PHOTO_ANALYSIS_PROMPT},
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{photo_base64}"},
                    },
                ],
            }
        ]
        response = await llm_service.chat(
            messages, model="qwen-vl-max", temperature=0.3, use_cache=False, timeout=120
        )
        return response

    async def run(self, input_data: dict[str, Any]) -> AgentResult:
        scene = input_data.get("scene", "日常通勤")
        style_preference = input_data.get("style_preference", "简约")
        body_type = input_data.get("body_type", "标准")
        gender = input_data.get("gender", "女")
        season = input_data.get("season", "春季")
        extra_notes = input_data.get("extra_notes", "")
        photo_description = input_data.get("photo_description", "")
        photo_base64 = input_data.get("photo_base64", "")

        photo_analysis_text = ""

        if photo_base64:
            try:
                raw_analysis = await self._analyze_photo(photo_base64)
                analysis_data = self._parse_json_response(raw_analysis)
                if "raw_recommendation" not in analysis_data:
                    photo_analysis_text = (
                        f"照片 AI 分析结果：\n"
                        f"- 整体风格：{analysis_data.get('overall_style', '未知')}\n"
                        f"- 色彩搭配：{analysis_data.get('color_palette', '未知')}\n"
                        f"- 版型：{analysis_data.get('fit', '未知')}\n"
                        f"- 穿搭亮点：{analysis_data.get('highlights', '无')}\n"
                        f"- 可改进：{analysis_data.get('improvements', '无')}\n"
                        f"- 适合场景：{analysis_data.get('occasion_suitability', '未知')}"
                    )
                    garments = analysis_data.get("garments", [])
                    if garments:
                        garment_descs = []
                        for g in garments:
                            desc = f"{g.get('type', '')}（{g.get('color', '')}，{g.get('description', '')}）"
                            garment_descs.append(desc)
                        photo_analysis_text += f"\n- 识别到的服装：{'；'.join(garment_descs)}"
                else:
                    photo_analysis_text = f"照片分析结果：{analysis_data.get('raw_recommendation', raw_analysis)}"
            except Exception as e:
                photo_analysis_text = f"照片分析失败：{str(e)}"

        photo_parts = []
        if photo_analysis_text:
            photo_parts.append(photo_analysis_text)
        if photo_description:
            photo_parts.append(f"用户补充描述：{photo_description}")
        photo_context = "\n\n".join(photo_parts) if photo_parts else ""

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
            data = self._parse_json_response(response)

            if photo_analysis_text:
                data["photo_analysis"] = photo_analysis_text

            return AgentResult(success=True, data=data)
        except Exception as e:
            return AgentResult(success=False, error=f"穿搭推荐生成失败: {str(e)}")
