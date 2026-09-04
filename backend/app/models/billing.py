import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, Index, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Subscription(Base):
    __tablename__ = "subscriptions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), index=True, unique=True)
    plan: Mapped[str] = mapped_column(String(20), default="free")
    status: Mapped[str] = mapped_column(String(20), default="active")
    agent_quota: Mapped[int] = mapped_column(Integer, default=50)
    agents_used: Mapped[int] = mapped_column(Integer, default=0)
    started_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    expires_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


class UsageRecord(Base):
    __tablename__ = "usage_records"

    __table_args__ = (
        Index("ix_usage_user_date", "user_id", "date"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), index=True)
    date: Mapped[datetime] = mapped_column(DateTime, index=True)
    agent_name: Mapped[str] = mapped_column(String(50), default="")
    calls: Mapped[int] = mapped_column(Integer, default=0)
    tokens_used: Mapped[int] = mapped_column(Integer, default=0)
    cost: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


PLAN_LIMITS = {
    "free": {"agent_quota": 50, "agents": ["trend", "content", "data"]},
    "starter": {"agent_quota": 500, "agents": ["trend", "content", "data", "product", "livestream"]},
    "pro": {"agent_quota": 5000, "agents": ["trend", "content", "data", "product", "livestream", "customer_service", "styling"]},
}
