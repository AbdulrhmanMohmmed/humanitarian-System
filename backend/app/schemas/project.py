from pydantic import BaseModel
from typing import Any, Optional, List
from datetime import date, datetime
from app.models.enums import ProjectStatus, Currency

class ProjectCreate(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    sector: Optional[str] = None
    status: ProjectStatus = ProjectStatus.PLANNED
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    budget: float = 0
    currency: Currency = Currency.USD
    target_beneficiaries: int = 0
    governorate: Optional[str] = None
    district: Optional[str] = None
    donor: Optional[str] = None
    custom_values: dict[str, Any] = {}

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    sector: Optional[str] = None
    status: Optional[ProjectStatus] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    budget: Optional[float] = None
    spent: Optional[float] = None
    currency: Optional[Currency] = None
    target_beneficiaries: Optional[int] = None
    actual_beneficiaries: Optional[int] = None
    governorate: Optional[str] = None
    district: Optional[str] = None
    donor: Optional[str] = None
    custom_values: Optional[dict[str, Any]] = None

class ProjectOut(BaseModel):
    id: int
    code: str
    name: str
    description: Optional[str] = None
    sector: Optional[str] = None
    status: ProjectStatus
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    budget: float
    spent: float
    currency: Currency
    target_beneficiaries: int
    actual_beneficiaries: int
    governorate: Optional[str] = None
    district: Optional[str] = None
    donor: Optional[str] = None
    custom_values: dict[str, Any] = {}
    created_at: datetime

    class Config:
        from_attributes = True

class ActivityCreate(BaseModel):
    project_id: int
    name: str
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    budget: float = 0
    status: ProjectStatus = ProjectStatus.PLANNED
    responsible: Optional[str] = None
    parent_id: Optional[int] = None
    custom_values: dict[str, Any] = {}

class ActivityUpdate(BaseModel):
    name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    actual_start: Optional[date] = None
    actual_end: Optional[date] = None
    progress: Optional[float] = None
    status: Optional[ProjectStatus] = None
    responsible: Optional[str] = None
    custom_values: Optional[dict[str, Any]] = None

class ActivityOut(BaseModel):
    id: int
    project_id: int
    name: str
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    actual_start: Optional[date] = None
    actual_end: Optional[date] = None
    budget: float
    spent: float
    progress: float
    status: ProjectStatus
    responsible: Optional[str] = None
    parent_id: Optional[int] = None
    custom_values: dict[str, Any] = {}
    created_at: datetime

    class Config:
        from_attributes = True
