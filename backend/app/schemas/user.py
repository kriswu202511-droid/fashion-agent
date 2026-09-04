from datetime import datetime

from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    display_name: str = ""
    store_name: str = ""


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    display_name: str
    role: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
