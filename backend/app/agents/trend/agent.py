import json
from typing import Any

from app.agents.base import AgentResult, BaseAgent
from app.agents.registry import register_agent
from app.agents.trend.prompts import TREND_ANALYSIS_PROMPT, TREND_SYSTEM_PROMPT
from app.services.llm import llm_service


@register_agent
class TrendAgent(BaseAgent):
    name = "trend"
    description = "监控全网服装热点、风格趋势，输出趋势报告和选款建议"
    version = "0.1.0"
    icon = "FireOutlined"

    async def run(self, input_data: dict[str, Any]) -> AgentResult:
        dimension = input_data.get("dimension", "全品类")
        time_range = input_data.get("time_range", "近7天")
        category = input_data.get("category", "女装")
        target_audience = input_data.get("target_audience", "18-35岁女性")

        prompt = TREND_ANALYSIS_PROMPT.format(
            dimension=dimension,
            time_range=time_range,
            category=category,
            target_audience=target_audience,
        )

        messages = [
            {"role": "system", "content": TREND_SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ]

        try:
            response = await llm_service.chat(messages, model="qwen-plus")
            try:
                data = json.loads(response)
            except json.JSONDecodeError:
                data = {"raw_analysis": response}

            return AgentResult(success=True, data={
                "dimension": dimension,
                "time_range": time_range,
                "category": category,
                "target_audience": target_audience,
                "analysis": data,
            })
        except Exception as e:
            return AgentResult(success=False, error=f"趋势分析失败: {str(e)}")
