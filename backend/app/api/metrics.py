from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.metrics import LivestreamMetric, SalesMetric
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.metrics import (
    LivestreamMetricCreate,
    LivestreamMetricResponse,
    SalesMetricCreate,
    SalesMetricResponse,
)
from app.services.cache import cache_service

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
    await cache_service.invalidate_prefix(f"api:metrics:sales:{current_user.id}:")
    return metric


@router.get("/sales", response_model=PaginatedResponse[SalesMetricResponse])
async def list_sales_metrics(
    page: int = 1,
    page_size: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cache_key = cache_service.api_key("metrics:sales", current_user.id, page=page, page_size=page_size)
    cached = await cache_service.get(cache_key)
    if cached is not None:
        return PaginatedResponse(**cached)

    base_where = SalesMetric.user_id == current_user.id
    total = (await db.execute(
        select(func.count()).select_from(SalesMetric).where(base_where)
    )).scalar() or 0

    result = await db.execute(
        select(SalesMetric)
        .where(base_where)
        .order_by(SalesMetric.date.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    metrics = result.scalars().all()
    resp = PaginatedResponse(
        items=[SalesMetricResponse.model_validate(m) for m in metrics],
        total=total, page=page, page_size=page_size,
    )
    await cache_service.set(cache_key, resp.model_dump(), ttl=60)
    return resp


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
    await cache_service.invalidate_prefix(f"api:metrics:livestream:{current_user.id}:")
    return metric


@router.get("/livestream", response_model=PaginatedResponse[LivestreamMetricResponse])
async def list_livestream_metrics(
    page: int = 1,
    page_size: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cache_key = cache_service.api_key("metrics:livestream", current_user.id, page=page, page_size=page_size)
    cached = await cache_service.get(cache_key)
    if cached is not None:
        return PaginatedResponse(**cached)

    base_where = LivestreamMetric.user_id == current_user.id
    total = (await db.execute(
        select(func.count()).select_from(LivestreamMetric).where(base_where)
    )).scalar() or 0

    result = await db.execute(
        select(LivestreamMetric)
        .where(base_where)
        .order_by(LivestreamMetric.date.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    metrics = result.scalars().all()
    resp = PaginatedResponse(
        items=[LivestreamMetricResponse.model_validate(m) for m in metrics],
        total=total, page=page, page_size=page_size,
    )
    await cache_service.set(cache_key, resp.model_dump(), ttl=60)
    return resp
