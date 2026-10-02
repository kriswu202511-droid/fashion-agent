from fastapi import Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.billing import PLAN_LIMITS, Subscription
from app.models.user import User


async def check_quota(
    agent_name: str,
    user: User,
    db: AsyncSession,
    count: int = 1,
) -> Subscription:
    result = await db.execute(
        select(Subscription).where(Subscription.user_id == user.id)
    )
    sub = result.scalar_one_or_none()

    if not sub:
        sub = Subscription(user_id=user.id, plan="free")
        db.add(sub)
        await db.commit()
        await db.refresh(sub)

    plan_info = PLAN_LIMITS.get(sub.plan, PLAN_LIMITS["free"])

    if agent_name not in plan_info["agents"]:
        raise HTTPException(
            status_code=403,
            detail=f"当前套餐({sub.plan})不包含 Agent: {agent_name}，请升级套餐",
        )

    if sub.agents_used >= sub.agent_quota:
        raise HTTPException(
            status_code=429,
            detail=f"本月 Agent 调用次数已达上限({sub.agent_quota})，请升级套餐",
        )

    sub.agents_used += count
    await db.commit()
    return sub
