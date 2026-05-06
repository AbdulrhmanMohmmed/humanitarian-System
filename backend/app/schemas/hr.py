from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from app.models.enums import Gender, EmployeeStatus, LeaveType, LeaveStatus, Currency

class EmployeeCreate(BaseModel):
    employee_id: str
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    gender: Optional[Gender] = None
    date_of_birth: Optional[date] = None
    hire_date: Optional[date] = None
    department: Optional[str] = None
    position: Optional[str] = None
    salary: float = 0
    currency: Currency = Currency.USD
    contract_type: Optional[str] = None
    office_location: Optional[str] = None
    supervisor_id: Optional[int] = None

class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    position: Optional[str] = None
    salary: Optional[float] = None
    status: Optional[EmployeeStatus] = None
    contract_type: Optional[str] = None
    office_location: Optional[str] = None

class EmployeeOut(BaseModel):
    id: int
    employee_id: str
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    gender: Optional[Gender] = None
    date_of_birth: Optional[date] = None
    hire_date: Optional[date] = None
    department: Optional[str] = None
    position: Optional[str] = None
    salary: float
    currency: Currency
    status: EmployeeStatus
    contract_type: Optional[str] = None
    office_location: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class LeaveCreate(BaseModel):
    employee_id: int
    leave_type: LeaveType
    start_date: date
    end_date: date
    reason: Optional[str] = None

class LeaveOut(BaseModel):
    id: int
    employee_id: int
    leave_type: LeaveType
    start_date: date
    end_date: date
    days: Optional[int] = None
    reason: Optional[str] = None
    status: LeaveStatus
    created_at: datetime

    class Config:
        from_attributes = True

class AttendanceCreate(BaseModel):
    employee_id: int
    date: date
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None
    status: str = "present"
    notes: Optional[str] = None

class AttendanceOut(BaseModel):
    id: int
    employee_id: int
    date: date
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None
    status: str
    notes: Optional[str] = None

    class Config:
        from_attributes = True
