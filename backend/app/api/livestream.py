import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.registry import agent_registry
from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.livestream_session import LivestreamMessage, LivestreamSession
from app.models.user import User

router = APIRouter()


class CreateSessionRequest(BaseModel):
    title: str = "直播"
    theme: str = "夏季新款上新"
    products: str = ""
    duration: str = "2小时"
    promotion: str = ""
    platform: str = "抖音"
    host_style: str = "活泼亲切"
    goal: str = "提升转化率"


class DanmakuInput(BaseModel):
    content: str
    current_topic: str = ""


class RhythmRequest(BaseModel):
    elapsed_minutes: int = 0
    planned_duration: int = 120
    covered_products: str = ""
    viewer_count: int = 0


class UrgentRequest(BaseModel):
    product_info: str = ""
    promotion: str = ""
    stock_info: str = ""
    viewer_count: int = 0



@router.post("/session")
async def create_session(
    req: CreateSessionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user_id = current_user.id

    session = LivestreamSession(
        user_id=user_id,
        title=req.title,
        status="pending",
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)

    agent = agent_registry.get("livestream")
    if agent:
        result = await agent.run({
            "mode": "script",
            "theme": req.theme,
            "products": req.products,
            "duration": req.duration,
            "promotion": req.promotion,
            "platform": req.platform,
            "host_style": req.host_style,
            "goal": req.goal,
        })
        if result.success:
            session.script = json.dumps(result.data.get("script", {}), ensure_ascii=False)
            session.status = "ready"
            await db.commit()
            await db.refresh(session)

    return {
        "id": session.id,
        "title": session.title,
        "status": session.status,
        "script": session.script,
        "created_at": session.created_at.isoformat() if session.created_at else None,
    }


@router.get("/sessions")
async def list_sessions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user_id = current_user.id
    result = await db.execute(
        select(LivestreamSession)
        .where(LivestreamSession.user_id == user_id)
        .order_by(LivestreamSession.created_at.desc())
        .limit(20)
    )
    sessions = result.scalars().all()
    return [
        {
            "id": s.id,
            "title": s.title,
            "status": s.status,
            "created_at": s.created_at.isoformat() if s.created_at else None,
            "started_at": s.started_at.isoformat() if s.started_at else None,
        }
        for s in sessions
    ]


@router.get("/session/{session_id}")
async def get_session(session_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(LivestreamSession).where(LivestreamSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="会话不存在")

    msg_result = await db.execute(
        select(LivestreamMessage)
        .where(LivestreamMessage.session_id == session_id)
        .order_by(LivestreamMessage.created_at.desc())
        .limit(100)
    )
    messages = msg_result.scalars().all()

    return {
        "id": session.id,
        "title": session.title,
        "status": session.status,
        "script": session.script,
        "started_at": session.started_at.isoformat() if session.started_at else None,
        "messages": [
            {
                "id": m.id,
                "content": m.content,
                "source": m.source,
                "response": m.response,
                "category": m.category,
                "created_at": m.created_at.isoformat() if m.created_at else None,
            }
            for m in messages
        ],
    }


@router.post("/session/{session_id}/start")
async def start_session(session_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(LivestreamSession).where(LivestreamSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="会话不存在")

    session.status = "live"
    session.started_at = datetime.now(timezone.utc)
    await db.commit()
    return {"status": "live", "started_at": session.started_at.isoformat()}


@router.post("/session/{session_id}/end")
async def end_session(session_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(LivestreamSession).where(LivestreamSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="会话不存在")

    session.status = "ended"
    session.ended_at = datetime.now(timezone.utc)
    await db.commit()
    return {"status": "ended"}


@router.post("/session/{session_id}/message")
async def send_danmaku(
    session_id: str,
    req: DanmakuInput,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(LivestreamSession).where(LivestreamSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="会话不存在")

    agent = agent_registry.get("livestream")
    if not agent:
        raise HTTPException(status_code=500, detail="直播 Agent 未注册")

    danmaku_result = await agent.run({
        "mode": "rhythm",
    })

    full_response = ""
    category = "其他"
    async for chunk in agent.stream({
        "mode": "danmaku",
        "session_title": session.title,
        "current_topic": req.current_topic,
        "danmaku": req.content,
    }):
        if chunk.get("done"):
            data = chunk.get("data", {})
            full_response = data.get("reply", "")
            category = data.get("category", "其他")

    msg = LivestreamMessage(
        session_id=session_id,
        content=req.content,
        source="user",
        response=full_response,
        category=category,
    )
    db.add(msg)
    await db.commit()
    await db.refresh(msg)

    return {
        "id": msg.id,
        "content": msg.content,
        "response": msg.response,
        "category": msg.category,
    }


@router.post("/session/{session_id}/rhythm")
async def get_rhythm_suggestion(
    session_id: str,
    req: RhythmRequest,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(LivestreamSession).where(LivestreamSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="会话不存在")

    agent = agent_registry.get("livestream")
    if not agent:
        raise HTTPException(status_code=500, detail="直播 Agent 未注册")

    agent_result = await agent.run({
        "mode": "rhythm",
        "title": session.title,
        "elapsed_minutes": req.elapsed_minutes,
        "planned_duration": req.planned_duration,
        "covered_products": req.covered_products,
        "viewer_count": req.viewer_count,
    })

    return agent_result.data if agent_result.success else {"error": agent_result.error}


@router.post("/session/{session_id}/urgent")
async def generate_urgent(
    session_id: str,
    req: UrgentRequest,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(LivestreamSession).where(LivestreamSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="会话不存在")

    agent = agent_registry.get("livestream")
    if not agent:
        raise HTTPException(status_code=500, detail="直播 Agent 未注册")

    agent_result = await agent.run({
        "mode": "urgent",
        "product_info": req.product_info,
        "promotion": req.promotion,
        "stock_info": req.stock_info,
        "viewer_count": req.viewer_count,
    })

    return agent_result.data if agent_result.success else {"error": agent_result.error}
