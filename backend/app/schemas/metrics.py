from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class SalesMetricCreate(BaseModel):
    date: datetime
    platform: str = ""
    product_id: str = ""
    sku: str = ""
    orders: int = 0
    revenue: float = 0.0
    cost: float = 0.0
    refund_orders: int = 0
    refund_amount: float = 0.0


class SalesMetricResponse(BaseModel):
    id: str
    date: datetime
    platform: str
    product_id: str
    sku: str
    orders: int
    revenue: float
    cost: float
    refund_orders: int
    refund_amount: float
    created_at: datetime

    model_config = {"from_attributes": True}


class LivestreamMetricCreate(BaseModel):
    date: datetime
    platform: str = ""
    duration_minutes: int = 0
    total_viewers: int = 0
    peak_viewers: int = 0
    new_followers: int = 0
    total_orders: int = 0
    gmv: float = 0.0
    avg_watch_duration: float = 0.0
    click_rate: float = 0.0
    conversion_rate: float = 0.0


class LivestreamMetricResponse(BaseModel):
    id: str
    date: datetime
    platform: str
    duration_minutes: int
    total_viewers: int
    peak_viewers: int
    new_followers: int
    total_orders: int
    gmv: float
    avg_watch_duration: float
    click_rate: float
    conversion_rate: float
    created_at: datetime

    model_config = {"from_attributes": True}
