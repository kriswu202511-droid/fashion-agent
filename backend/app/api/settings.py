from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.tenant_settings import TenantSettings
from app.models.user import User
from app.schemas.tenant import TenantSettingsResponse, TenantSettingsUpdate, UserUpdate

router = APIRouter()


async def _get_or_create_settings(user_id: str, db: AsyncSession) -> TenantSettings:
    result = await db.execute(
        select(TenantSettings).where(TenantSettings.user_id == user_id)
    )
    settings = result.scalar_one_or_none()
    if not settings:
        settings = TenantSettings(user_id=user_id)
        db.add(settings)
        await db.commit()
        await db.refresh(settings)
    return settings


@router.get("/settings", response_model=TenantSettingsResponse)
async def get_settings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    settings = await _get_or_create_settings(current_user.id, db)
    return settings


@router.put("/settings", response_model=TenantSettingsResponse)
async def update_settings(
    data: TenantSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    settings = await _get_or_create_settings(current_user.id, db)
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(settings, key, value)
    await db.commit()
    await db.refresh(settings)
    return settings


@router.get("/profile", response_model=dict)
async def get_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    settings = await _get_or_create_settings(current_user.id, db)
    return {
        "user": {
            "id": current_user.id,
            "username": current_user.username,
            "email": current_user.email,
            "display_name": current_user.display_name,
            "role": current_user.role,
        },
        "settings": TenantSettingsResponse.model_validate(settings).model_dump(),
    }


@router.put("/profile", response_model=dict)
async def update_profile(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(current_user, key, value)
    await db.commit()
    await db.refresh(current_user)
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "display_name": current_user.display_name,
        "role": current_user.role,
    }
