import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, Index, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Product(Base):
    __tablename__ = "products"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), index=True)
    sku: Mapped[str] = mapped_column(String(50), index=True)
    name: Mapped[str] = mapped_column(String(200))
    category: Mapped[str] = mapped_column(String(50), default="")
    sub_category: Mapped[str] = mapped_column(String(50), default="")
    price: Mapped[float] = mapped_column(Float, default=0.0)
    cost: Mapped[float] = mapped_column(Float, default=0.0)
    supplier: Mapped[str] = mapped_column(String(200), default="")
    image_url: Mapped[str] = mapped_column(String(500), default="")
    description: Mapped[str] = mapped_column(Text, default="")
    tags: Mapped[str] = mapped_column(String(500), default="")
    status: Mapped[str] = mapped_column(String(20), default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        Index("ix_products_user_category", "user_id", "category"),
    )


class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), index=True)
    product_id: Mapped[str] = mapped_column(String(36), index=True)
    sku: Mapped[str] = mapped_column(String(50), index=True)
    quantity: Mapped[int] = mapped_column(Integer, default=0)
    warehouse: Mapped[str] = mapped_column(String(100), default="")
    location: Mapped[str] = mapped_column(String(100), default="")
    min_stock: Mapped[int] = mapped_column(Integer, default=0)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        Index("ix_inventory_user_product", "user_id", "product_id"),
    )
