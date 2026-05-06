from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.models.enums import UserRole

class UserCreate(BaseModel):
    username: str
    email: str
    full_name: str
    password: str
    role: UserRole = UserRole.VIEWER
    phone: Optional[str] = None
    department: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class UserOut(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    role: UserRole
    is_active: bool
    phone: Optional[str] = None
    department: Optional[str] = None
    permissions: List[str] = []
    created_at: datetime

    class Config:
        from_attributes = True

    @classmethod
    def model_validate(cls, obj, *args, **kwargs):
        from app.permissions import permission_values_for_user

        user = super().model_validate(obj, *args, **kwargs)
        user.permissions = permission_values_for_user(obj)
        return user

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    user: UserOut
    enabled_modules: List[str] = []
