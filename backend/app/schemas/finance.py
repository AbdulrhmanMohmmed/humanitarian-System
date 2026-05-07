from pydantic import BaseModel
from typing import Any, Optional
from datetime import date, datetime
from app.models.enums import GrantStatus, GrantCategory, TransactionType, Currency

class GrantCreate(BaseModel):
    name: str
    donor_id: Optional[int] = None
    category: GrantCategory = GrantCategory.HUMANITARIAN
    amount: float
    currency: Currency = Currency.USD
    status: GrantStatus = GrantStatus.PENDING
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    project_id: Optional[int] = None
    conditions: Optional[str] = None
    custom_values: dict[str, Any] = {}

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
    custom_values: Optional[dict[str, Any]] = None

class GrantOut(BaseModel):
    id: int
    name: str
    donor_id: Optional[int] = None
    category: Optional[GrantCategory] = None
    amount: float
    spent: float
    currency: Currency
    status: GrantStatus
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    project_id: Optional[int] = None
    conditions: Optional[str] = None
    custom_values: dict[str, Any] = {}
    created_at: datetime

    class Config:
        from_attributes = True

class TransactionCreate(BaseModel):
    reference: Optional[str] = None
    type: TransactionType
    amount: float
    currency: Currency = Currency.USD
    description: Optional[str] = None
    category: Optional[str] = None
    grant_id: Optional[int] = None
    project_id: Optional[int] = None
    transaction_date: Optional[date] = None
    custom_values: dict[str, Any] = {}

class TransactionUpdate(BaseModel):
    reference: Optional[str] = None
    type: Optional[TransactionType] = None
    amount: Optional[float] = None
    currency: Optional[Currency] = None
    description: Optional[str] = None
    category: Optional[str] = None
    grant_id: Optional[int] = None
    project_id: Optional[int] = None
    transaction_date: Optional[date] = None
    custom_values: Optional[dict[str, Any]] = None

class TransactionOut(BaseModel):
    id: int
    reference: Optional[str] = None
    type: TransactionType
    amount: float
    currency: Currency
    description: Optional[str] = None
    category: Optional[str] = None
    grant_id: Optional[int] = None
    project_id: Optional[int] = None
    transaction_date: Optional[date] = None
    custom_values: dict[str, Any] = {}
    created_at: datetime

    class Config:
        from_attributes = True
