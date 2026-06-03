from sqlalchemy import Column, Integer, String, Float, DateTime, Date, Text, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base
from .enums import Gender, EmployeeStatus, LeaveType, LeaveStatus, Currency

class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String(50), unique=True, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255))
    phone = Column(String(20))
    gender = Column(SAEnum(Gender))
    date_of_birth = Column(Date)
    hire_date = Column(Date)
    department = Column(String(100))
    position = Column(String(100))
    salary = Column(Float, default=0)
    currency = Column(SAEnum(Currency), default=Currency.USD)
    status = Column(SAEnum(EmployeeStatus), default=EmployeeStatus.ACTIVE)
    contract_type = Column(String(50))
    office_location = Column(String(100))
    supervisor_id = Column(Integer, ForeignKey("employees.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    leaves = relationship("LeaveRequest", back_populates="employee")
    attendances = relationship("Attendance", back_populates="employee")

class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    leave_type = Column(SAEnum(LeaveType), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    days = Column(Integer)
    reason = Column(Text)
    status = Column(SAEnum(LeaveStatus), default=LeaveStatus.PENDING)
    approved_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    employee = relationship("Employee", back_populates="leaves")

class Attendance(Base):
    __tablename__ = "attendances"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    date = Column(Date, nullable=False)
    check_in = Column(DateTime)
    check_out = Column(DateTime)
    status = Column(String(20), default="present")
    notes = Column(Text)

    employee = relationship("Employee", back_populates="attendances")

class Payroll(Base):
    __tablename__ = "payrolls"

    id = Column(Integer, primary_key=True, index=True)
    month = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)
    status = Column(String(20), default="draft") # draft, approved, paid
    total_gross = Column(Float, default=0)
    total_net = Column(Float, default=0)
    currency = Column(SAEnum(Currency), default=Currency.USD)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    payslips = relationship("Payslip", back_populates="payroll")

class Payslip(Base):
    __tablename__ = "payslips"

    id = Column(Integer, primary_key=True, index=True)
    payroll_id = Column(Integer, ForeignKey("payrolls.id"), nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    base_salary = Column(Float, nullable=False)
    allowances = Column(Float, default=0)
    deductions = Column(Float, default=0)
    net_salary = Column(Float, nullable=False)
    payment_status = Column(String(20), default="unpaid")
    
    payroll = relationship("Payroll", back_populates="payslips")
    employee = relationship("Employee")
