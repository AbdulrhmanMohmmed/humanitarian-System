from pydantic import BaseModel
from typing import Any, Optional
from datetime import date, datetime
from app.models.enums import Gender, BeneficiaryStatus, DisabilityType

class BeneficiaryCreate(BaseModel):
    national_id: Optional[str] = None
    first_name: str
    last_name: str
    gender: Optional[Gender] = None
    date_of_birth: Optional[date] = None
    phone: Optional[str] = None
    governorate: Optional[str] = None
    district: Optional[str] = None
    village: Optional[str] = None
    household_size: int = 1
    head_of_household: bool = False
    has_disability: bool = False
    disability_type: Optional[DisabilityType] = None
    vulnerability_score: float = 0
    is_pii_encrypted: bool = False
    notes: Optional[str] = None
    custom_values: dict[str, Any] = {}

class BeneficiaryUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    gender: Optional[Gender] = None
    date_of_birth: Optional[date] = None
    phone: Optional[str] = None
    governorate: Optional[str] = None
    district: Optional[str] = None
    village: Optional[str] = None
    household_size: Optional[int] = None
    head_of_household: Optional[bool] = None
    has_disability: Optional[bool] = None
    disability_type: Optional[DisabilityType] = None
    vulnerability_score: Optional[float] = None
    is_pii_encrypted: Optional[bool] = None
    status: Optional[BeneficiaryStatus] = None
    notes: Optional[str] = None
    custom_values: Optional[dict[str, Any]] = None

class BeneficiaryOut(BaseModel):
    id: int
    national_id: Optional[str] = None
    first_name: str
    last_name: str
    gender: Optional[Gender] = None
    date_of_birth: Optional[date] = None
    phone: Optional[str] = None
    governorate: Optional[str] = None
    district: Optional[str] = None
    village: Optional[str] = None
    household_size: int
    head_of_household: bool
    has_disability: bool
    disability_type: Optional[DisabilityType] = None
    vulnerability_score: float
    is_pii_encrypted: bool
    status: BeneficiaryStatus
    notes: Optional[str] = None
    custom_values: dict[str, Any] = {}
    created_at: datetime

    class Config:
        from_attributes = True
