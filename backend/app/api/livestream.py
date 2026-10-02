import asyncio
import json
import logging
from datetime import datetime

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.registry import agent_registry
from app.core.dependencies import get_current_user
from app.core.events import Event, event_bus
from app.core.quota import check_quota
from app.database import get_db
from app.models.livestream_session import LivestreamMessage, LivestreamSession
from app.models.user import User

logger = logging.getLogger(__name__)

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


class ExtensionConnectRequest(BaseModel):
    platform: str = "douyin"
    room_url: str = ""
    room_title: str = "直播"
    theme: str = "夏季新款上新"
    products: str = ""


class BatchDanmakuMessage(BaseModel):
    content: str
    username: str = ""
    timestamp: int = 0


class BatchDanmakuRequest(BaseModel):
    messages: list[BatchDanmakuMessage]
    current_topic: str = ""



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
        await check_quota("livestream", current_user, db)
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
    page: int = 1,
    page_size: int = 20,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user_id = current_user.id
    base_where = LivestreamSession.user_id == user_id
    total = (await db.execute(
        select(func.count()).select_from(LivestreamSession).where(base_where)
    )).scalar() or 0

    result = await db.execute(
        select(LivestreamSession)
        .where(base_where)
        .order_by(LivestreamSession.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    sessions = result.scalars().all()
    return {
        "items": [
            {
                "id": s.id,
                "title": s.title,
                "status": s.status,
                "created_at": s.created_at.isoformat() if s.created_at else None,
                "started_at": s.started_at.isoformat() if s.started_at else None,
            }
            for s in sessions
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/session/{session_id}")
async def get_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(LivestreamSession).where(LivestreamSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="会话不存在")
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权访问此会话")

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
async def start_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(LivestreamSession).where(LivestreamSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="会话不存在")
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权访问此会话")

    session.status = "live"
    session.started_at = datetime.utcnow()
    await db.commit()
    return {"status": "live", "started_at": session.started_at.isoformat()}


@router.post("/session/{session_id}/end")
async def end_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(LivestreamSession).where(LivestreamSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="会话不存在")
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权访问此会话")

    session.status = "ended"
    session.ended_at = datetime.utcnow()
    await db.commit()
    return {"status": "ended"}


@router.post("/session/{session_id}/message")
async def send_danmaku(
    session_id: str,
    req: DanmakuInput,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(LivestreamSession).where(LivestreamSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="会话不存在")
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权访问此会话")

    agent = agent_registry.get("livestream")
    if not agent:
        raise HTTPException(status_code=500, detail="直播 Agent 未注册")

    await check_quota("livestream", current_user, db)

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
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(LivestreamSession).where(LivestreamSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="会话不存在")
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权访问此会话")

    agent = agent_registry.get("livestream")
    if not agent:
        raise HTTPException(status_code=500, detail="直播 Agent 未注册")

    await check_quota("livestream", current_user, db)

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
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(LivestreamSession).where(LivestreamSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="会话不存在")
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权访问此会话")

    agent = agent_registry.get("livestream")
    if not agent:
        raise HTTPException(status_code=500, detail="直播 Agent 未注册")

    await check_quota("livestream", current_user, db)

    agent_result = await agent.run({
        "mode": "urgent",
        "product_info": req.product_info,
        "promotion": req.promotion,
        "stock_info": req.stock_info,
        "viewer_count": req.viewer_count,
    })

    return agent_result.data if agent_result.success else {"error": agent_result.error}


@router.post("/extension/connect")
async def extension_connect(
    req: ExtensionConnectRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    session = LivestreamSession(
        user_id=current_user.id,
        title=req.room_title,
        status="live",
        platform=req.platform,
        room_url=req.room_url,
        started_at=datetime.utcnow(),
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)

    await check_quota("livestream", current_user, db)

    async def _generate_script():
        from app.database import async_session
        agent = agent_registry.get("livestream")
        if not agent:
            return
        try:
            result = await agent.run({
                "mode": "script",
                "theme": req.theme,
                "products": req.products,
                "duration": "2小时",
                "platform": req.platform,
            })
            if result.success:
                async with async_session() as db2:
                    s = await db2.get(LivestreamSession, session.id)
                    if s:
                        s.script = json.dumps(result.data.get("script", {}), ensure_ascii=False)
                        await db2.commit()
        except Exception as e:
            logger.error(f"Script generation failed: {e}")

    background_tasks.add_task(_generate_script)

    return {
        "session_id": session.id,
        "script": None,
        "status": "live",
    }


async def _process_danmaku_batch(
    session_id: str,
    messages: list[BatchDanmakuMessage],
    current_topic: str,
    session_title: str,
):
    from app.database import async_session

    print(f"[DANMAKU] Processing batch for session {session_id}: {len(messages)} messages", flush=True)
    agent = agent_registry.get("livestream")
    if not agent:
        print(f"[DANMAKU] ERROR: Livestream agent not found for session {session_id}", flush=True)
        return
    print(f"[DANMAKU] Agent found: {agent.name}", flush=True)

    for msg in messages:
        print(f"[DANMAKU] Processing message: {msg.content[:50]}", flush=True)
        full_response = ""
        category = "其他"
        try:
            async for chunk in agent.stream({
                "mode": "danmaku",
                "session_title": session_title,
                "current_topic": current_topic,
                "danmaku": msg.content,
            }):
                if chunk.get("done"):
                    data = chunk.get("data", {})
                    full_response = data.get("reply", "")
                    category = data.get("category", "其他")
            print(f"[DANMAKU] AI reply generated: {full_response[:50]}", flush=True)
        except Exception as e:
            print(f"[DANMAKU] Agent stream error for session {session_id}: {e}", flush=True)
            import traceback
            traceback.print_exc()
            continue

        async with async_session() as db:
            db_msg = LivestreamMessage(
                session_id=session_id,
                content=msg.content,
                source=msg.username or "user",
                response=full_response,
                category=category,
            )
            db.add(db_msg)
            await db.commit()
            await db.refresh(db_msg)
            print(f"[DANMAKU] Message saved to DB", flush=True)

        print(f"[DANMAKU] Publishing event for session {session_id}", flush=True)
        await event_bus.publish(Event(
            event_type="livestream.danmaku_reply",
            source_agent="livestream",
            data={
                "session_id": session_id,
                "content": msg.content,
                "username": msg.username,
                "response": full_response,
                "category": category,
            },
        ))
        print(f"[DANMAKU] Event published for session {session_id}", flush=True)


@router.post("/session/{session_id}/danmaku/batch")
async def batch_danmaku(
    session_id: str,
    req: BatchDanmakuRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(LivestreamSession).where(LivestreamSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="会话不存在")
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权访问此会话")

    await check_quota("livestream", current_user, db, count=len(req.messages))

    background_tasks.add_task(
        _process_danmaku_batch,
        session_id=session_id,
        messages=req.messages,
        current_topic=req.current_topic,
        session_title=session.title,
    )

    return {"queued": len(req.messages), "session_id": session_id}
