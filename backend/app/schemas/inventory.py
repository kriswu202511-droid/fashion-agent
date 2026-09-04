from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ProductCreate(BaseModel):
    sku: str
    name: str
    category: str = ""
    sub_category: str = ""
    price: float = 0.0
    cost: float = 0.0
    supplier: str = ""
    image_url: str = ""
    description: str = ""
    tags: str = ""


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    sub_category: Optional[str] = None
    price: Optional[float] = None
    cost: Optional[float] = None
    supplier: Optional[str] = None
    image_url: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[str] = None
    status: Optional[str] = None


class ProductResponse(BaseModel):
    id: str
    sku: str
    name: str
    category: str
    sub_category: str
    price: float
    cost: float
    supplier: str
    image_url: str
    description: str
    tags: str
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class InventoryItemCreate(BaseModel):
    product_id: str
    sku: str
    quantity: int = 0
    warehouse: str = ""
    location: str = ""
    min_stock: int = 0


class InventoryItemResponse(BaseModel):
    id: str
    product_id: str
    sku: str
    quantity: int
    warehouse: str
    location: str
    min_stock: int
    updated_at: datetime

    model_config = {"from_attributes": True}
