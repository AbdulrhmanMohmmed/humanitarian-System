from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from app.models.enums import CashTransferStatus, CashTransferMethod, Currency

class CashTransferCreate(BaseModel):
    beneficiary_id: int
    project_id: Optional[int] = None
    amount: float
    currency: Currency = Currency.YER
    method: CashTransferMethod = CashTransferMethod.CASH_IN_HAND
    purpose: Optional[str] = None
    transfer_date: Optional[date] = None
    agent_name: Optional[str] = None
    agent_phone: Optional[str] = None
    notes: Optional[str] = None

class CashTransferUpdate(BaseModel):
    status: Optional[CashTransferStatus] = None
    received_date: Optional[date] = None
    notes: Optional[str] = None

class CashTransferOut(BaseModel):
    id: int
    reference: str
    beneficiary_id: int
    project_id: Optional[int] = None
    amount: float
    currency: Currency
    method: CashTransferMethod
    status: CashTransferStatus
    purpose: Optional[str] = None
    transfer_date: Optional[date] = None
    received_date: Optional[date] = None
    agent_name: Optional[str] = None
    agent_phone: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
