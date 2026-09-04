import json
from typing import Any

from sqlalchemy import select

from app.agents.base import AgentResult, BaseAgent
from app.agents.registry import register_agent
from app.agents.product.prompts import PRODUCT_SELECTION_PROMPT, PRODUCT_SYSTEM_PROMPT
from app.database import async_session
from app.models.inventory import Product
from app.services.llm import llm_service


@register_agent
class ProductAgent(BaseAgent):
    name = "product"
    description = "结合库存、趋势和供应链数据，推荐最优选品方案"
    version = "0.1.0"
    icon = "ShoppingOutlined"

    async def run(self, input_data: dict[str, Any]) -> AgentResult:
        category = input_data.get("category", "全品类")
        target_margin = input_data.get("target_margin", 30)
        budget = input_data.get("budget", "不限")
        target_audience = input_data.get("target_audience", "")

        inventory_data = await self._get_inventory_data(category)
        trend_data = input_data.get("trend_data", "暂无趋势数据")

        prompt = PRODUCT_SELECTION_PROMPT.format(
            inventory_data=inventory_data,
            trend_data=trend_data,
            category=category,
            target_margin=target_margin,
            budget=budget,
            target_audience=target_audience,
        )

        messages = [
            {"role": "system", "content": PRODUCT_SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ]

        try:
            response = await llm_service.chat(messages, model="qwen-plus")
            try:
                data = json.loads(response)
            except json.JSONDecodeError:
                data = {"raw_recommendation": response}

            return AgentResult(success=True, data={
                "category": category,
                "target_margin": target_margin,
                "selection": data,
            })
        except Exception as e:
            return AgentResult(success=False, error=f"选品分析失败: {str(e)}")

    async def _get_inventory_data(self, category: str) -> str:
        async with async_session() as db:
            query = select(Product)
            if category != "全品类":
                query = query.where(Product.category == category)
            query = query.limit(50)

            result = await db.execute(query)
            products = result.scalars().all()

            if not products:
                return "暂无库存数据"

            lines = []
            for p in products:
                margin = ((p.price - p.cost) / p.price * 100) if p.price else 0
                lines.append(
                    f"- {p.sku} | {p.name} | 品类:{p.category} | "
                    f"售价:¥{p.price} | 成本:¥{p.cost} | 利润率:{margin:.1f}% | "
                    f"供应商:{p.supplier} | 标签:{p.tags}"
                )
            return "\n".join(lines)
