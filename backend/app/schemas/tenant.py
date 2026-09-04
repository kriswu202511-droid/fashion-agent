from datetime import datetime

from pydantic import BaseModel


class TenantSettingsUpdate(BaseModel):
    store_name: str | None = None
    store_platform: str | None = None
    store_category: str | None = None
    brand_style: str | None = None
    target_audience: str | None = None
    price_range: str | None = None
    contact_phone: str | None = None
    contact_wechat: str | None = None
    return_policy: str | None = None
    shipping_policy: str | None = None
    faq_extra: str | None = None
    onboarding_done: bool | None = None


class TenantSettingsResponse(BaseModel):
    id: str
    user_id: str
    store_name: str
    store_platform: str
    store_category: str
    brand_style: str
    target_audience: str
    price_range: str
    contact_phone: str
    contact_wechat: str
    return_policy: str
    shipping_policy: str
    faq_extra: str
    onboarding_done: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    display_name: str | None = None
    email: str | None = None
