from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.metrics import LivestreamMetric, SalesMetric
from app.models.user import User
from app.schemas.metrics import (
    LivestreamMetricCreate,
    LivestreamMetricResponse,
    SalesMetricCreate,
    SalesMetricResponse,
)

router = APIRouter()


@router.post("/sales", response_model=SalesMetricResponse)
async def create_sales_metric(
    data: SalesMetricCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    metric = SalesMetric(user_id=current_user.id, **data.model_dump())
    db.add(metric)
    await db.commit()
    await db.refresh(metric)
    return metric


@router.get("/sales", response_model=list[SalesMetricResponse])
async def list_sales_metrics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(SalesMetric).where(SalesMetric.user_id == current_user.id).order_by(SalesMetric.date.desc()).limit(100)
    )
    metrics = result.scalars().all()
    return [SalesMetricResponse.model_validate(m) for m in metrics]


@router.post("/livestream", response_model=LivestreamMetricResponse)
async def create_livestream_metric(
    data: LivestreamMetricCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    metric = LivestreamMetric(user_id=current_user.id, **data.model_dump())
    db.add(metric)
    await db.commit()
    await db.refresh(metric)
    return metric


@router.get("/livestream", response_model=list[LivestreamMetricResponse])
async def list_livestream_metrics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(LivestreamMetric).where(LivestreamMetric.user_id == current_user.id).order_by(LivestreamMetric.date.desc()).limit(50)
    )
    metrics = result.scalars().all()
    return [LivestreamMetricResponse.model_validate(m) for m in metrics]
