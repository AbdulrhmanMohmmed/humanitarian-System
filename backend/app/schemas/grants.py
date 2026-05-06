from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime
from app.models.enums import GrantStatus, GrantCategory, Currency

class DonorBase(BaseModel):
    name: str
    short_name: Optional[str] = None
    description: Optional[str] = None
    website: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[str] = None

class DonorCreate(DonorBase):
    pass

class DonorOut(DonorBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class GrantBase(BaseModel):
    name: str
    donor_id: int
    category: GrantCategory = GrantCategory.HUMANITARIAN
    amount: float
    currency: Currency = Currency.USD
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    project_id: Optional[int] = None
    conditions: Optional[str] = None

class GrantCreate(GrantBase):
    pass

class GrantUpdate(BaseModel):
    name: Optional[str] = None
    donor_id: Optional[int] = None
    category: Optional[GrantCategory] = None
    amount: Optional[float] = None
    currency: Optional[Currency] = None
    status: Optional[GrantStatus] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    project_id: Optional[int] = None
    conditions: Optional[str] = None

class GrantOut(GrantBase):
    id: int
    spent: float
    status: GrantStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
