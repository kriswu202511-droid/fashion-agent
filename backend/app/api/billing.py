from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.billing import PLAN_LIMITS, Subscription, UsageRecord
from app.models.user import User

router = APIRouter()


@router.get("/subscription")
async def get_subscription(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Subscription).where(Subscription.user_id == current_user.id)
    )
    sub = result.scalar_one_or_none()
    if not sub:
        sub = Subscription(user_id=current_user.id, plan="free")
        db.add(sub)
        await db.commit()
        await db.refresh(sub)

    plan_info = PLAN_LIMITS.get(sub.plan, PLAN_LIMITS["free"])
    return {
        "plan": sub.plan,
        "status": sub.status,
        "agent_quota": sub.agent_quota,
        "agents_used": sub.agents_used,
        "available_agents": plan_info["agents"],
        "expires_at": sub.expires_at.isoformat() if sub.expires_at else None,
    }


@router.post("/subscription/upgrade")
async def upgrade_subscription(
    plan: str = "starter",
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if plan not in PLAN_LIMITS:
        raise HTTPException(status_code=400, detail=f"未知套餐: {plan}")

    result = await db.execute(
        select(Subscription).where(Subscription.user_id == current_user.id)
    )
    sub = result.scalar_one_or_none()

    plan_info = PLAN_LIMITS[plan]
    if sub:
        sub.plan = plan
        sub.agent_quota = plan_info["agent_quota"]
        sub.agents_used = 0
    else:
        sub = Subscription(
            user_id=current_user.id,
            plan=plan,
            agent_quota=plan_info["agent_quota"],
        )
        db.add(sub)

    await db.commit()
    return {"plan": plan, "quota": plan_info["agent_quota"], "agents": plan_info["agents"]}


@router.get("/usage")
async def get_usage(
    days: int = 7,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    since = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    from datetime import timedelta
    since -= timedelta(days=days)

    result = await db.execute(
        select(UsageRecord)
        .where(UsageRecord.user_id == current_user.id, UsageRecord.date >= since)
        .order_by(UsageRecord.date.desc())
    )
    records = result.scalars().all()

    daily: dict[str, dict] = {}
    by_agent: dict[str, int] = {}
    for r in records:
        day_key = r.date.strftime("%Y-%m-%d")
        if day_key not in daily:
            daily[day_key] = {"calls": 0, "tokens": 0, "cost": 0.0}
        daily[day_key]["calls"] += r.calls
        daily[day_key]["tokens"] += r.tokens_used
        daily[day_key]["cost"] += r.cost
        by_agent[r.agent_name] = by_agent.get(r.agent_name, 0) + r.calls

    return {
        "daily": [{"date": k, **v} for k, v in sorted(daily.items())],
        "by_agent": by_agent,
        "total_calls": sum(r.calls for r in records),
        "total_tokens": sum(r.tokens_used for r in records),
        "total_cost": sum(r.cost for r in records),
    }


@router.get("/plans")
async def list_plans():
    return [
        {"id": k, "name": {"free": "免费版", "starter": "入门版", "pro": "专业版"}[k],
         "quota": v["agent_quota"], "agents": v["agents"]}
        for k, v in PLAN_LIMITS.items()
    ]
