"""Advanced HR models: Payroll, Performance, Training, Timesheets, Safety, Contracts."""
from sqlalchemy import Column, Integer, String, Float, DateTime, Date, Text, ForeignKey, Boolean
from datetime import datetime, timezone
from app.database import Base


class PayrollRecord(Base):
    __tablename__ = "payroll_records"
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)
    basic_salary = Column(Float, nullable=False)
    allowances = Column(Float, default=0)
    deductions = Column(Float, default=0)
    tax = Column(Float, default=0)
    social_insurance = Column(Float, default=0)
    net_salary = Column(Float, nullable=False)
    currency = Column(String(10), default="USD")
    status = Column(String(20), default="draft")  # draft, approved, paid
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    paid_at = Column(DateTime, nullable=True)
    grant_id = Column(Integer, ForeignKey("grants.id"), nullable=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class PerformanceReview(Base):
    __tablename__ = "performance_reviews"
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    period = Column(String(50))  # Q1-2026, H1-2026, 2026
    overall_score = Column(Float)  # 1-5
    objectives_score = Column(Float)
    competencies_score = Column(Float)
    comments = Column(Text)
    employee_comments = Column(Text)
    goals_next_period = Column(Text)
    status = Column(String(20), default="draft")  # draft, submitted, acknowledged
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class Training(Base):
    __tablename__ = "trainings"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    description = Column(Text)
    provider = Column(String(255))
    training_type = Column(String(100))  # internal, external, online, workshop
    start_date = Column(Date)
    end_date = Column(Date)
    location = Column(String(255))
    cost = Column(Float, default=0)
    max_participants = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class TrainingParticipant(Base):
    __tablename__ = "training_participants"
    id = Column(Integer, primary_key=True, index=True)
    training_id = Column(Integer, ForeignKey("trainings.id"), nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    status = Column(String(20), default="enrolled")  # enrolled, completed, cancelled
    score = Column(Float, nullable=True)
    certificate_url = Column(String(500))
    completed_at = Column(DateTime, nullable=True)


class Timesheet(Base):
    __tablename__ = "timesheets"
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    date = Column(Date, nullable=False)
    hours = Column(Float, nullable=False)
    description = Column(Text)
    activity_type = Column(String(100))  # field_work, office, travel, training
    status = Column(String(20), default="draft")  # draft, submitted, approved
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class StaffSafetyCheckIn(Base):
    __tablename__ = "staff_safety_checkins"
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    check_type = Column(String(20), nullable=False)  # check_in, check_out, emergency
    location = Column(String(255))
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    notes = Column(Text)
    is_safe = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class EmployeeContract(Base):
    __tablename__ = "employee_contracts"
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    contract_type = Column(String(50))  # permanent, fixed_term, consultancy, internship
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    salary = Column(Float)
    currency = Column(String(10), default="USD")
    position = Column(String(255))
    department = Column(String(255))
    renewal_date = Column(Date, nullable=True)
    status = Column(String(20), default="active")  # active, expired, terminated
    document_url = Column(String(500))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
