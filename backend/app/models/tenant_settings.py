import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class TenantSettings(Base):
    __tablename__ = "tenant_settings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), unique=True, index=True)
    store_name: Mapped[str] = mapped_column(String(100), default="")
    store_platform: Mapped[str] = mapped_column(String(50), default="")
    store_category: Mapped[str] = mapped_column(String(50), default="服装")
    brand_style: Mapped[str] = mapped_column(String(100), default="")
    target_audience: Mapped[str] = mapped_column(String(200), default="")
    price_range: Mapped[str] = mapped_column(String(50), default="")
    contact_phone: Mapped[str] = mapped_column(String(20), default="")
    contact_wechat: Mapped[str] = mapped_column(String(50), default="")
    return_policy: Mapped[str] = mapped_column(Text, default="")
    shipping_policy: Mapped[str] = mapped_column(Text, default="")
    faq_extra: Mapped[str] = mapped_column(Text, default="")
    onboarding_done: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())
