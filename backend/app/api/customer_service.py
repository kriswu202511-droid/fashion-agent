from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.registry import agent_registry
from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.knowledge import ChatMessage, ChatSession, KnowledgeEntry
from app.models.user import User
from app.services.knowledge import add_manual_entry, sync_products_to_knowledge
from app.services.rag import rag_service

router = APIRouter()


class ChatRequest(BaseModel):
    question: str
    session_id: str | None = None
    buyer_name: str = ""


class KnowledgeCreateRequest(BaseModel):
    category: str = "general"
    title: str
    content: str



@router.post("/chat")
async def chat(
    req: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user_id = current_user.id

    session_id = req.session_id
    if not session_id:
        session = ChatSession(user_id=user_id, buyer_name=req.buyer_name)
        db.add(session)
        await db.commit()
        await db.refresh(session)
        session_id = session.id

    agent = agent_registry.get("customer_service")
    if not agent:
        raise HTTPException(status_code=500, detail="客服 Agent 未注册")

    result = await agent.run({"question": req.question})

    user_msg = ChatMessage(
        session_id=session_id,
        role="user",
        content=req.question,
    )
    db.add(user_msg)

    if result.success:
        reply = result.data.get("reply", "")
        confidence = result.data.get("confidence", 0.0)
        need_human = result.data.get("need_human", False)
    else:
        reply = result.error or "抱歉，暂时无法回复"
        confidence = 0.0
        need_human = True

    bot_msg = ChatMessage(
        session_id=session_id,
        role="assistant",
        content=reply,
        confidence=confidence,
        need_human=need_human,
    )
    db.add(bot_msg)
    await db.commit()

    return {
        "session_id": session_id,
        "reply": reply,
        "confidence": confidence,
        "need_human": need_human,
        "context_docs": result.data.get("context_docs", []) if result.success else [],
    }


@router.post("/knowledge")
async def create_knowledge(
    req: KnowledgeCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user_id = current_user.id
    entry = await add_manual_entry(user_id, req.category, req.title, req.content, db)
    await db.commit()
    return {"id": entry.id, "title": entry.title, "category": entry.category}


@router.post("/knowledge/sync")
async def sync_knowledge(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user_id = current_user.id
    count = await sync_products_to_knowledge(user_id, db)
    await db.commit()
    return {"synced": count, "total_in_index": rag_service.count}


@router.get("/knowledge")
async def list_knowledge(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user_id = current_user.id
    result = await db.execute(
        select(KnowledgeEntry)
        .where(KnowledgeEntry.user_id == user_id)
        .order_by(KnowledgeEntry.created_at.desc())
        .limit(100)
    )
    entries = result.scalars().all()
    return [
        {
            "id": e.id,
            "category": e.category,
            "title": e.title,
            "content": e.content,
            "source": e.source,
            "created_at": e.created_at.isoformat() if e.created_at else None,
        }
        for e in entries
    ]


@router.get("/history")
async def chat_history(
    session_id: str | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user_id = current_user.id

    if session_id:
        result = await db.execute(
            select(ChatMessage)
            .where(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.created_at)
            .limit(100)
        )
    else:
        sessions_result = await db.execute(
            select(ChatSession).where(ChatSession.user_id == user_id).limit(1)
        )
        session = sessions_result.scalar_one_or_none()
        if not session:
            return []
        result = await db.execute(
            select(ChatMessage)
            .where(ChatMessage.session_id == session.id)
            .order_by(ChatMessage.created_at)
            .limit(100)
        )

    messages = result.scalars().all()
    return [
        {
            "id": m.id,
            "role": m.role,
            "content": m.content,
            "confidence": m.confidence,
            "need_human": m.need_human,
            "created_at": m.created_at.isoformat() if m.created_at else None,
        }
        for m in messages
    ]
