from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Date, Text,
    ForeignKey, Enum as SAEnum, Table
)
from sqlalchemy.orm import relationship
from datetime import datetime, date
from app.database import Base
import enum


# ==================== ENUMS ====================

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    FIELD_OFFICER = "field_officer"
    FINANCE = "finance"
    HR = "hr"
    VIEWER = "viewer"

class Gender(str, enum.Enum):
    MALE = "male"
    FEMALE = "female"

class BeneficiaryStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    GRADUATED = "graduated"

class ProjectStatus(str, enum.Enum):
    PLANNED = "planned"
    ACTIVE = "active"
    COMPLETED = "completed"
    SUSPENDED = "suspended"
    CANCELLED = "cancelled"

class TransactionType(str, enum.Enum):
    INCOME = "income"
    EXPENSE = "expense"
    TRANSFER = "transfer"

class GrantStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    ACTIVE = "active"
    COMPLETED = "completed"
    REJECTED = "rejected"

class EmployeeStatus(str, enum.Enum):
    ACTIVE = "active"
    ON_LEAVE = "on_leave"
    TERMINATED = "terminated"
    RESIGNED = "resigned"

class LeaveType(str, enum.Enum):
    ANNUAL = "annual"
    SICK = "sick"
    MATERNITY = "maternity"
    EMERGENCY = "emergency"
    UNPAID = "unpaid"

class LeaveStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class ItemCategory(str, enum.Enum):
    FOOD = "food"
    MEDICINE = "medicine"
    SHELTER = "shelter"
    WASH = "wash"
    NFI = "nfi"
    EDUCATION = "education"
    OTHER = "other"

class DistributionStatus(str, enum.Enum):
    PLANNED = "planned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class CashTransferStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    DISBURSED = "disbursed"
    RECEIVED = "received"
    FAILED = "failed"

class CashTransferMethod(str, enum.Enum):
    BANK = "bank"
    MOBILE_MONEY = "mobile_money"
    HAWALA = "hawala"
    CASH_IN_HAND = "cash_in_hand"
    VOUCHER = "voucher"

class IndicatorType(str, enum.Enum):
    OUTPUT = "output"
    OUTCOME = "outcome"
    IMPACT = "impact"

class Currency(str, enum.Enum):
    YER = "YER"
    USD = "USD"
    SAR = "SAR"
    EUR = "EUR"


# ==================== MODELS ====================

# -- Users & Auth --

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SAEnum(UserRole), default=UserRole.VIEWER)
    is_active = Column(Boolean, default=True)
    phone = Column(String(20))
    department = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# -- Beneficiaries --

class Beneficiary(Base):
    __tablename__ = "beneficiaries"

    id = Column(Integer, primary_key=True, index=True)
    national_id = Column(String(50), unique=True, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    gender = Column(SAEnum(Gender))
    date_of_birth = Column(Date)
    phone = Column(String(20))
    governorate = Column(String(100))
    district = Column(String(100))
    village = Column(String(200))
    household_size = Column(Integer, default=1)
    head_of_household = Column(Boolean, default=False)
    vulnerability_score = Column(Float, default=0)
    status = Column(SAEnum(BeneficiaryStatus), default=BeneficiaryStatus.ACTIVE)
    notes = Column(Text)
    registered_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    distributions = relationship("DistributionItem", back_populates="beneficiary")
    cash_transfers = relationship("CashTransfer", back_populates="beneficiary")


# -- Projects & Programs --

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    sector = Column(String(100))
    status = Column(SAEnum(ProjectStatus), default=ProjectStatus.PLANNED)
    start_date = Column(Date)
    end_date = Column(Date)
    budget = Column(Float, default=0)
    spent = Column(Float, default=0)
    currency = Column(SAEnum(Currency), default=Currency.USD)
    target_beneficiaries = Column(Integer, default=0)
    actual_beneficiaries = Column(Integer, default=0)
    governorate = Column(String(100))
    district = Column(String(100))
    donor = Column(String(255))
    manager_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    activities = relationship("Activity", back_populates="project")
    grants = relationship("Grant", back_populates="project")
    indicators = relationship("Indicator", back_populates="project")


class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    start_date = Column(Date)
    end_date = Column(Date)
    budget = Column(Float, default=0)
    spent = Column(Float, default=0)
    progress = Column(Float, default=0)
    status = Column(SAEnum(ProjectStatus), default=ProjectStatus.PLANNED)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="activities")


# -- Financial Management --

class Grant(Base):
    __tablename__ = "grants"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True)
    name = Column(String(255), nullable=False)
    donor = Column(String(255), nullable=False)
    amount = Column(Float, nullable=False)
    spent = Column(Float, default=0)
    currency = Column(SAEnum(Currency), default=Currency.USD)
    status = Column(SAEnum(GrantStatus), default=GrantStatus.PENDING)
    start_date = Column(Date)
    end_date = Column(Date)
    project_id = Column(Integer, ForeignKey("projects.id"))
    conditions = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    project = relationship("Project", back_populates="grants")
    transactions = relationship("Transaction", back_populates="grant")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    reference = Column(String(100), index=True)
    type = Column(SAEnum(TransactionType), nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(SAEnum(Currency), default=Currency.USD)
    description = Column(Text)
    category = Column(String(100))
    grant_id = Column(Integer, ForeignKey("grants.id"))
    project_id = Column(Integer, ForeignKey("projects.id"))
    approved_by = Column(Integer, ForeignKey("users.id"))
    transaction_date = Column(Date, default=date.today)
    created_at = Column(DateTime, default=datetime.utcnow)

    grant = relationship("Grant", back_populates="transactions")


# -- HR Management --

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
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

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
    created_at = Column(DateTime, default=datetime.utcnow)

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


# -- Inventory & Supply Chain --

class Warehouse(Base):
    __tablename__ = "warehouses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, index=True)
    location = Column(String(255))
    governorate = Column(String(100))
    capacity = Column(Float, default=0)
    manager_id = Column(Integer, ForeignKey("users.id"))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    items = relationship("InventoryItem", back_populates="warehouse")


class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    sku = Column(String(100), index=True)
    category = Column(SAEnum(ItemCategory), default=ItemCategory.OTHER)
    quantity = Column(Float, default=0)
    unit = Column(String(50))
    min_stock = Column(Float, default=0)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    expiry_date = Column(Date)
    batch_number = Column(String(100))
    unit_cost = Column(Float, default=0)
    currency = Column(SAEnum(Currency), default=Currency.USD)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    warehouse = relationship("Warehouse", back_populates="items")


class Distribution(Base):
    __tablename__ = "distributions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"))
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"))
    distribution_date = Column(Date)
    location = Column(String(255))
    governorate = Column(String(100))
    status = Column(SAEnum(DistributionStatus), default=DistributionStatus.PLANNED)
    total_beneficiaries = Column(Integer, default=0)
    notes = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    items = relationship("DistributionItem", back_populates="distribution")


class DistributionItem(Base):
    __tablename__ = "distribution_items"

    id = Column(Integer, primary_key=True, index=True)
    distribution_id = Column(Integer, ForeignKey("distributions.id"), nullable=False)
    beneficiary_id = Column(Integer, ForeignKey("beneficiaries.id"), nullable=False)
    item_name = Column(String(255))
    quantity = Column(Float, default=0)
    unit = Column(String(50))
    received = Column(Boolean, default=False)
    received_date = Column(DateTime)
    notes = Column(Text)

    distribution = relationship("Distribution", back_populates="items")
    beneficiary = relationship("Beneficiary", back_populates="distributions")


# -- Cash & Voucher Assistance --

class CashTransfer(Base):
    __tablename__ = "cash_transfers"

    id = Column(Integer, primary_key=True, index=True)
    reference = Column(String(100), unique=True, index=True)
    beneficiary_id = Column(Integer, ForeignKey("beneficiaries.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"))
    amount = Column(Float, nullable=False)
    currency = Column(SAEnum(Currency), default=Currency.YER)
    method = Column(SAEnum(CashTransferMethod), default=CashTransferMethod.CASH_IN_HAND)
    status = Column(SAEnum(CashTransferStatus), default=CashTransferStatus.PENDING)
    purpose = Column(String(255))
    transfer_date = Column(Date)
    received_date = Column(Date)
    agent_name = Column(String(255))
    agent_phone = Column(String(20))
    approved_by = Column(Integer, ForeignKey("users.id"))
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    beneficiary = relationship("Beneficiary", back_populates="cash_transfers")


# -- M&E (Monitoring & Evaluation) --

class Indicator(Base):
    __tablename__ = "indicators"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    type = Column(SAEnum(IndicatorType), default=IndicatorType.OUTPUT)
    unit = Column(String(50))
    target_value = Column(Float, default=0)
    actual_value = Column(Float, default=0)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    baseline = Column(Float, default=0)
    data_source = Column(String(255))
    frequency = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    project = relationship("Project", back_populates="indicators")
    measurements = relationship("Measurement", back_populates="indicator")


class Measurement(Base):
    __tablename__ = "measurements"

    id = Column(Integer, primary_key=True, index=True)
    indicator_id = Column(Integer, ForeignKey("indicators.id"), nullable=False)
    value = Column(Float, nullable=False)
    date = Column(Date, nullable=False)
    notes = Column(Text)
    collected_by = Column(Integer, ForeignKey("users.id"))
    governorate = Column(String(100))
    district = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)

    indicator = relationship("Indicator", back_populates="measurements")


class Survey(Base):
    __tablename__ = "surveys"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    project_id = Column(Integer, ForeignKey("projects.id"))
    is_active = Column(Boolean, default=True)
    total_responses = Column(Integer, default=0)
    start_date = Column(Date)
    end_date = Column(Date)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    questions = relationship("SurveyQuestion", back_populates="survey")


class SurveyQuestion(Base):
    __tablename__ = "survey_questions"

    id = Column(Integer, primary_key=True, index=True)
    survey_id = Column(Integer, ForeignKey("surveys.id"), nullable=False)
    question_text = Column(Text, nullable=False)
    question_type = Column(String(50), default="text")
    options = Column(Text)
    is_required = Column(Boolean, default=True)
    order = Column(Integer, default=0)

    survey = relationship("Survey", back_populates="questions")
    responses = relationship("SurveyResponse", back_populates="question")


class SurveyResponse(Base):
    __tablename__ = "survey_responses"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("survey_questions.id"), nullable=False)
    respondent_id = Column(Integer, ForeignKey("beneficiaries.id"))
    answer = Column(Text)
    collected_by = Column(Integer, ForeignKey("users.id"))
    collected_at = Column(DateTime, default=datetime.utcnow)
    governorate = Column(String(100))

    question = relationship("SurveyQuestion", back_populates="responses")
