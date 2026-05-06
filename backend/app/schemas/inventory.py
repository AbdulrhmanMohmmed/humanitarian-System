from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from app.models.enums import ItemCategory, DistributionStatus, Currency

class WarehouseCreate(BaseModel):
    name: str
    code: str
    location: Optional[str] = None
    governorate: Optional[str] = None
    capacity: float = 0

class WarehouseOut(BaseModel):
    id: int
    name: str
    code: str
    location: Optional[str] = None
    governorate: Optional[str] = None
    capacity: float
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class InventoryItemCreate(BaseModel):
    name: str
    sku: Optional[str] = None
    category: ItemCategory = ItemCategory.OTHER
    quantity: float = 0
    unit: Optional[str] = None
    min_stock: float = 0
    warehouse_id: int
    expiry_date: Optional[date] = None
    batch_number: Optional[str] = None
    unit_cost: float = 0
    currency: Currency = Currency.USD

class InventoryItemOut(BaseModel):
    id: int
    name: str
    sku: Optional[str] = None
    category: ItemCategory
    quantity: float
    unit: Optional[str] = None
    min_stock: float
    warehouse_id: int
    expiry_date: Optional[date] = None
    batch_number: Optional[str] = None
    unit_cost: float
    currency: Currency
    created_at: datetime

    class Config:
        from_attributes = True

class DistributionCreate(BaseModel):
    title: str
    project_id: Optional[int] = None
    warehouse_id: Optional[int] = None
    distribution_date: Optional[date] = None
    location: Optional[str] = None
    governorate: Optional[str] = None
    notes: Optional[str] = None

class DistributionUpdate(BaseModel):
    title: Optional[str] = None
    project_id: Optional[int] = None
    warehouse_id: Optional[int] = None
    distribution_date: Optional[date] = None
    location: Optional[str] = None
    governorate: Optional[str] = None
    status: Optional[DistributionStatus] = None
    notes: Optional[str] = None

class DistributionItemCreate(BaseModel):
    beneficiary_id: int
    item_name: Optional[str] = None
    quantity: float = 0
    unit: Optional[str] = None
    notes: Optional[str] = None

class DistributionItemUpdate(BaseModel):
    received: Optional[bool] = None
    received_date: Optional[datetime] = None
    notes: Optional[str] = None

class DistributionItemOut(BaseModel):
    id: int
    distribution_id: int
    beneficiary_id: int
    item_name: Optional[str] = None
    quantity: float
    unit: Optional[str] = None
    received: bool
    received_date: Optional[datetime] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True

class DistributionOut(BaseModel):
    id: int
    title: str
    project_id: Optional[int] = None
    warehouse_id: Optional[int] = None
    distribution_date: Optional[date] = None
    location: Optional[str] = None
    governorate: Optional[str] = None
    status: DistributionStatus
    total_beneficiaries: int
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
