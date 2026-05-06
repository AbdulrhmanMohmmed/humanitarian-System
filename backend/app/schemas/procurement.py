from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.models.enums import ProcurementStatus, PurchaseOrderStatus, VendorCategory, Currency

class VendorBase(BaseModel):
    name: str
    category: VendorCategory
    contact_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    tax_id: Optional[str] = None
    bank_details: Optional[str] = None

class VendorCreate(VendorBase):
    pass

class VendorUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[VendorCategory] = None
    contact_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    tax_id: Optional[str] = None
    bank_details: Optional[str] = None
    is_active: Optional[int] = None

class VendorOut(VendorBase):
    id: int
    is_active: int
    created_at: datetime

    class Config:
        from_attributes = True

class PurchaseRequestBase(BaseModel):
    title: str
    description: Optional[str] = None
    estimated_cost: float
    currency: Currency = Currency.USD
    project_id: int

class PurchaseRequestCreate(PurchaseRequestBase):
    pass

class PurchaseRequestUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    estimated_cost: Optional[float] = None
    currency: Optional[Currency] = None
    status: Optional[ProcurementStatus] = None

class PurchaseRequestOut(PurchaseRequestBase):
    id: int
    request_number: str
    status: ProcurementStatus
    requested_by_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class QuoteBase(BaseModel):
    purchase_request_id: int
    vendor_id: int
    amount: float
    currency: Currency
    delivery_time: Optional[str] = None
    terms: Optional[str] = None

class QuoteCreate(QuoteBase):
    pass

class QuoteOut(QuoteBase):
    id: int
    is_winner: int
    created_at: datetime

    class Config:
        from_attributes = True

class PurchaseOrderBase(BaseModel):
    purchase_request_id: int
    vendor_id: int
    total_amount: float
    currency: Currency

class PurchaseOrderCreate(PurchaseOrderBase):
    pass

class PurchaseOrderOut(PurchaseOrderBase):
    id: int
    po_number: str
    status: PurchaseOrderStatus
    created_at: datetime

    class Config:
        from_attributes = True
