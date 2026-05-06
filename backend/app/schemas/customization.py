from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class SystemSettingIn(BaseModel):
    key: str = Field(min_length=2, max_length=120)
    category: str = "general"
    label: str
    description: Optional[str] = None
    value: Any = None
    value_type: str = "string"
    is_public: bool = False


class SystemSettingOut(SystemSettingIn):
    id: int
    updated_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ReferenceListIn(BaseModel):
    slug: str = Field(min_length=2, max_length=120)
    name: str
    description: Optional[str] = None
    entity_type: Optional[str] = None
    is_system: bool = False
    is_active: bool = True


class ReferenceListOut(ReferenceListIn):
    id: int
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ReferenceListItemIn(BaseModel):
    value: str = Field(min_length=1, max_length=160)
    label: str
    label_ar: Optional[str] = None
    sort_order: int = 0
    metadata: dict[str, Any] = {}
    is_active: bool = True


class ReferenceListItemOut(ReferenceListItemIn):
    id: int
    list_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CustomFieldIn(BaseModel):
    entity_type: str = Field(min_length=2, max_length=100)
    field_key: str = Field(min_length=2, max_length=120)
    label: str
    label_ar: Optional[str] = None
    field_type: str = "text"
    placeholder: Optional[str] = None
    help_text: Optional[str] = None
    is_required: bool = False
    is_searchable: bool = False
    options: list[Any] = []
    validation: dict[str, Any] = {}
    display_order: int = 0
    is_active: bool = True


class CustomFieldOut(CustomFieldIn):
    id: int
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RolePermissionOverrideIn(BaseModel):
    role: str
    permission: str
    effect: str = "allow"
    reason: Optional[str] = None


class RolePermissionOverrideOut(RolePermissionOverrideIn):
    id: int
    updated_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
