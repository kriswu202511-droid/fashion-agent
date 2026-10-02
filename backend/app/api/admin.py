from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import require_admin
from app.database import get_db
from app.models.agent_task import AgentTask, TaskStatus
from app.models.billing import Subscription, UsageRecord
from app.models.user import User
from app.services.cache import cache_service

router = APIRouter()


class StatsResponse(BaseModel):
    total_users: int
    active_users: int
    new_users_today: int
    total_tasks: int
    tasks_today: int
    tasks_by_agent: dict[str, int]
    tasks_by_status: dict[str, int]
    total_revenue: float
    revenue_today: float
    subscriptions_by_plan: dict[str, int]
    system_health: str


class UserListItem(BaseModel):
    id: str
    username: str
    email: str
    display_name: str
    role: str
    is_active: bool
    plan: str
    created_at: datetime


class UsersResponse(BaseModel):
    items: list[UserListItem]
    total: int


@router.get("/stats", response_model=StatsResponse)
async def get_stats(
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    cache_key = "api:admin:stats"
    cached = await cache_service.get(cache_key)
    if cached is not None:
        return StatsResponse(**cached)

    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    total_users = (await db.execute(select(func.count(User.id)))).scalar() or 0
    active_users = (
        await db.execute(select(func.count(User.id)).where(User.is_active == True))  # noqa: E712
    ).scalar() or 0
    new_users_today = (
        await db.execute(
            select(func.count(User.id)).where(User.created_at >= today_start)
        )
    ).scalar() or 0

    total_tasks = (await db.execute(select(func.count(AgentTask.id)))).scalar() or 0
    tasks_today = (
        await db.execute(
            select(func.count(AgentTask.id)).where(AgentTask.created_at >= today_start)
        )
    ).scalar() or 0

    agent_rows = (
        await db.execute(
            select(AgentTask.agent_name, func.count(AgentTask.id)).group_by(
                AgentTask.agent_name
            )
        )
    ).all()
    tasks_by_agent = {row[0]: row[1] for row in agent_rows}

    status_rows = (
        await db.execute(
            select(AgentTask.status, func.count(AgentTask.id)).group_by(AgentTask.status)
        )
    ).all()
    tasks_by_status = {row[0].value: row[1] for row in status_rows}

    total_revenue = (
        await db.execute(select(func.sum(UsageRecord.cost)))
    ).scalar() or 0.0
    revenue_today = (
        await db.execute(
            select(func.sum(UsageRecord.cost)).where(UsageRecord.date >= today_start)
        )
    ).scalar() or 0.0

    plan_rows = (
        await db.execute(
            select(Subscription.plan, func.count(Subscription.id)).group_by(
                Subscription.plan
            )
        )
    ).all()
    subscriptions_by_plan = {row[0]: row[1] for row in plan_rows}

    failed_today = (
        await db.execute(
            select(func.count(AgentTask.id)).where(
                AgentTask.created_at >= today_start,
                AgentTask.status == TaskStatus.FAILED,
            )
        )
    ).scalar() or 0
    health = "healthy" if failed_today == 0 else ("degraded" if failed_today < 5 else "unhealthy")

    result = StatsResponse(
        total_users=total_users,
        active_users=active_users,
        new_users_today=new_users_today,
        total_tasks=total_tasks,
        tasks_today=tasks_today,
        tasks_by_agent=tasks_by_agent,
        tasks_by_status=tasks_by_status,
        total_revenue=round(total_revenue, 2),
        revenue_today=round(revenue_today, 2),
        subscriptions_by_plan=subscriptions_by_plan,
        system_health=health,
    )
    await cache_service.set(cache_key, result.model_dump(), ttl=30)
    return result


@router.get("/users", response_model=UsersResponse)
async def list_users(
    page: int = 1,
    page_size: int = 20,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    total = (await db.execute(select(func.count(User.id)))).scalar() or 0

    rows = (
        await db.execute(
            select(User)
            .order_by(User.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
    ).scalars().all()

    items = []
    for u in rows:
        sub = (
            await db.execute(
                select(Subscription).where(Subscription.user_id == u.id)
            )
        ).scalar_one_or_none()
        items.append(
            UserListItem(
                id=u.id,
                username=u.username,
                email=u.email,
                display_name=u.display_name,
                role=u.role,
                is_active=u.is_active,
                plan=sub.plan if sub else "free",
                created_at=u.created_at,
            )
        )

    return UsersResponse(items=items, total=total)


@router.put("/users/{user_id}/toggle-active")
async def toggle_user_active(
    user_id: str,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not user:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="用户不存在")
    user.is_active = not user.is_active
    await db.commit()
    await cache_service.invalidate_prefix("api:admin:")
    return {"id": user.id, "is_active": user.is_active}
