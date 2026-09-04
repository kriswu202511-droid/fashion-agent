import json
from typing import Any

from app.agents.base import AgentResult, BaseAgent
from app.agents.registry import register_agent
from app.agents.customer_service.prompts import CS_REPLY_PROMPT, CS_SYSTEM_PROMPT
from app.services.llm import llm_service
from app.services.rag import rag_service


@register_agent
class CustomerServiceAgent(BaseAgent):
    name = "customer_service"
    description = "基于 RAG 知识库的智能客服，自动回复买家咨询"
    version = "0.1.0"
    icon = "MessageOutlined"

    async def run(self, input_data: dict[str, Any]) -> AgentResult:
        question = input_data.get("question", "")
        if not question:
            return AgentResult(success=False, error="请提供客户问题")

        context_docs = await rag_service.search(question, top_k=3)
        context = ""
        if context_docs:
            parts = []
            for i, doc in enumerate(context_docs, 1):
                parts.append(f"[{i}] {doc.get('title', '')}\n{doc.get('content', '')}")
            context = "\n\n".join(parts)
        else:
            context = "（知识库中暂无相关信息）"

        prompt = CS_REPLY_PROMPT.format(question=question, context=context)

        messages = [
            {"role": "system", "content": CS_SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ]

        try:
            response = await llm_service.chat(messages, model="qwen-plus", temperature=0.3)
            try:
                data = json.loads(response)
            except json.JSONDecodeError:
                data = {
                    "reply": response,
                    "intent": "其他",
                    "confidence": 0.6,
                    "need_human": True,
                }

            data["context_docs"] = [
                {"title": d.get("title"), "score": d.get("score")}
                for d in context_docs
            ]

            return AgentResult(success=True, data=data)
        except Exception as e:
            return AgentResult(success=False, error=f"客服回复生成失败: {str(e)}")
