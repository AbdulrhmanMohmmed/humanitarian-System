from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime
from app.models.enums import AssetStatus, VehicleStatus, FuelType, Currency

class AssetBase(BaseModel):
    code: str
    name: str
    category: Optional[str] = None
    serial_number: Optional[str] = None
    purchase_date: Optional[date] = None
    purchase_cost: Optional[float] = None
    currency: Currency = Currency.USD
    status: AssetStatus = AssetStatus.ACTIVE
    location: Optional[str] = None
    condition: Optional[str] = None
    assigned_to_id: Optional[int] = None
    department: Optional[str] = None
    project_id: Optional[int] = None

class AssetCreate(AssetBase):
    pass

class AssetOut(AssetBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class VehicleBase(BaseModel):
    plate_number: str
    make: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    status: VehicleStatus = VehicleStatus.AVAILABLE
    governorate: Optional[str] = None
    fuel_type: Optional[FuelType] = None
    current_odometer: int = 0
    assigned_driver_id: Optional[int] = None
    project_id: Optional[int] = None

class VehicleCreate(VehicleBase):
    pass

class VehicleOut(VehicleBase):
    id: int
    last_service_date: Optional[date] = None
    insurance_expiry: Optional[date] = None
    registration_expiry: Optional[date] = None

    class Config:
        from_attributes = True

class FuelLogBase(BaseModel):
    vehicle_id: int
    date: date
    odometer_reading: Optional[int] = None
    liters: float
    cost: float
    currency: Currency = Currency.USD
    fuel_station: Optional[str] = None
    coupon_number: Optional[str] = None

class FuelLogCreate(FuelLogBase):
    pass

class FuelLogOut(FuelLogBase):
    id: int
    recorded_by_id: int
    created_at: datetime

    class Config:
        from_attributes = True
