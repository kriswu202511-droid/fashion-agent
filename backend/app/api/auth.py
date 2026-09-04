from fastapi import APIRouter, Depends, HTTPException, status
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token
from app.database import get_db
from app.models.billing import Subscription
from app.models.tenant_settings import TenantSettings
from app.models.user import User
from app.schemas.user import TokenResponse, UserCreate, UserLogin, UserResponse

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@router.post("/register", response_model=TokenResponse)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(
        select(User).where((User.username == user_data.username) | (User.email == user_data.email))
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="用户名或邮箱已存在")

    user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=pwd_context.hash(user_data.password),
        display_name=user_data.display_name or user_data.username,
    )
    db.add(user)
    await db.flush()

    subscription = Subscription(user_id=user.id)
    db.add(subscription)

    settings = TenantSettings(
        user_id=user.id,
        store_name=user_data.store_name or "",
    )
    db.add(settings)

    await db.commit()
    await db.refresh(user)

    token = create_access_token({"sub": user.id})
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == credentials.username))
    user = result.scalar_one_or_none()

    if not user or not pwd_context.verify(credentials.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="用户名或密码错误")

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="账号已被禁用")

    token = create_access_token({"sub": user.id})
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))
