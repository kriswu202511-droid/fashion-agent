import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, Index, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class SalesMetric(Base):
    __tablename__ = "sales_metrics"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), index=True)
    date: Mapped[datetime] = mapped_column(DateTime, index=True)
    platform: Mapped[str] = mapped_column(String(50), default="")
    product_id: Mapped[str] = mapped_column(String(36), default="")
    sku: Mapped[str] = mapped_column(String(50), default="")
    orders: Mapped[int] = mapped_column(Integer, default=0)
    revenue: Mapped[float] = mapped_column(Float, default=0.0)
    cost: Mapped[float] = mapped_column(Float, default=0.0)
    refund_orders: Mapped[int] = mapped_column(Integer, default=0)
    refund_amount: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    __table_args__ = (
        Index("ix_sales_metrics_user_date", "user_id", "date"),
        Index("ix_sales_metrics_user_platform", "user_id", "platform"),
    )


class LivestreamMetric(Base):
    __tablename__ = "livestream_metrics"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), index=True)
    date: Mapped[datetime] = mapped_column(DateTime, index=True)
    platform: Mapped[str] = mapped_column(String(50), default="")
    duration_minutes: Mapped[int] = mapped_column(Integer, default=0)
    total_viewers: Mapped[int] = mapped_column(Integer, default=0)
    peak_viewers: Mapped[int] = mapped_column(Integer, default=0)
    new_followers: Mapped[int] = mapped_column(Integer, default=0)
    total_orders: Mapped[int] = mapped_column(Integer, default=0)
    gmv: Mapped[float] = mapped_column(Float, default=0.0)
    avg_watch_duration: Mapped[float] = mapped_column(Float, default=0.0)
    click_rate: Mapped[float] = mapped_column(Float, default=0.0)
    conversion_rate: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    __table_args__ = (
        Index("ix_livestream_metrics_user_date", "user_id", "date"),
    )
