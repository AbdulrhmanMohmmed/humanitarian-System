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

class FormStatus(str, enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    CLOSED = "closed"
    ARCHIVED = "archived"

class FieldType(str, enum.Enum):
    TEXT = "text"
    NUMBER = "number"
    SELECT = "select"
    MULTI_SELECT = "multi_select"
    DATE = "date"
    DATETIME = "datetime"
    TEXTAREA = "textarea"
    RADIO = "radio"
    CHECKBOX = "checkbox"
    FILE = "file"
    GPS = "gps"
    PHOTO = "photo"
    RATING = "rating"
    MATRIX = "matrix"
    SECTION = "section"

class SubmissionStatus(str, enum.Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    VALIDATED = "validated"
    REJECTED = "rejected"

class DocumentCategory(str, enum.Enum):
    PROJECT_PROPOSAL = "project_proposal"
    REPORT = "report"
    ASSESSMENT = "assessment"
    AGREEMENT = "agreement"
    BUDGET = "budget"
    MEETING_MINUTES = "meeting_minutes"
    POLICY = "policy"
    PHOTO = "photo"
    MAP = "map"
    OTHER = "other"

class ReportType(str, enum.Enum):
    PROJECT_PROGRESS = "project_progress"
    BENEFICIARY_LIST = "beneficiary_list"
    FINANCIAL_SUMMARY = "financial_summary"
    INDICATOR_TRACKING = "indicator_tracking"
    DISTRIBUTION_REPORT = "distribution_report"
    SURVEY_ANALYSIS = "survey_analysis"
    CUSTOM = "custom"

class Currency(str, enum.Enum):
    YER = "YER"
    USD = "USD"
    SAR = "SAR"
    EUR = "EUR"

class ComplaintChannel(str, enum.Enum):
    PHONE = "phone"
    BOX = "box"
    EMAIL = "email"
    IN_PERSON = "in_person"
    SMS = "sms"
    WHATSAPP = "whatsapp"
    WEBSITE = "website"
    OTHER = "other"

class ComplaintStatus(str, enum.Enum):
    RECEIVED = "received"
    UNDER_REVIEW = "under_review"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"
    ESCALATED = "escalated"

class ComplaintPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class ComplaintCategory(str, enum.Enum):
    SERVICE_QUALITY = "service_quality"
    STAFF_BEHAVIOR = "staff_behavior"
    TARGETING = "targeting"
    DISTRIBUTION = "distribution"
    PROTECTION = "protection"
    SAFEGUARDING = "safeguarding"
    FRAUD = "fraud"
    SUGGESTION = "suggestion"
    APPRECIATION = "appreciation"
    OTHER = "other"

class LessonCategory(str, enum.Enum):
    PROGRAM = "program"
    OPERATIONS = "operations"
    COORDINATION = "coordination"
    MONITORING = "monitoring"
    FINANCE = "finance"
    HR = "hr"
    LOGISTICS = "logistics"
    PROTECTION = "protection"
    OTHER = "other"

class LogFrameLevel(str, enum.Enum):
    GOAL = "goal"
    PURPOSE = "purpose"
    OUTPUT = "output"
    ACTIVITY = "activity"

class DQAStatus(str, enum.Enum):
    GOOD = "good"
    ACCEPTABLE = "acceptable"
    POOR = "poor"
    CRITICAL = "critical"

class RiskLikelihood(str, enum.Enum):
    VERY_LOW = "very_low"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    VERY_HIGH = "very_high"

class RiskImpact(str, enum.Enum):
    NEGLIGIBLE = "negligible"
    MINOR = "minor"
    MODERATE = "moderate"
    MAJOR = "major"
    SEVERE = "severe"

class RiskStatus(str, enum.Enum):
    IDENTIFIED = "identified"
    MITIGATING = "mitigating"
    MONITORING = "monitoring"
    RESOLVED = "resolved"
    ACCEPTED = "accepted"

class MEALPlanStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    COMPLETED = "completed"

class NotificationType(str, enum.Enum):
    DEADLINE = "deadline"
    COMPLAINT = "complaint"
    RISK = "risk"
    TASK = "task"
    SYSTEM = "system"

class CHSCommitment(str, enum.Enum):
    CHS1 = "chs1"
    CHS2 = "chs2"
    CHS3 = "chs3"
    CHS4 = "chs4"
    CHS5 = "chs5"
    CHS6 = "chs6"
    CHS7 = "chs7"
    CHS8 = "chs8"
    CHS9 = "chs9"


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
    actual_start = Column(Date)
    actual_end = Column(Date)
    budget = Column(Float, default=0)
    spent = Column(Float, default=0)
    progress = Column(Float, default=0)
    status = Column(SAEnum(ProjectStatus), default=ProjectStatus.PLANNED)
    responsible = Column(String(255))
    parent_id = Column(Integer, ForeignKey("activities.id"))
    order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="activities")
    children = relationship("Activity", backref="parent")


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


# -- Data Collection Forms (KoBoToolbox-like) --

class DataCollectionForm(Base):
    __tablename__ = "data_collection_forms"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    project_id = Column(Integer, ForeignKey("projects.id"))
    status = Column(SAEnum(FormStatus), default=FormStatus.DRAFT)
    version = Column(Integer, default=1)
    allow_edit_after_submit = Column(Boolean, default=False)
    collect_gps = Column(Boolean, default=False)
    require_authentication = Column(Boolean, default=True)
    submission_limit = Column(Integer)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    fields = relationship("FormField", back_populates="form", order_by="FormField.order")
    submissions = relationship("FormSubmission", back_populates="form")


class FormField(Base):
    __tablename__ = "form_fields"

    id = Column(Integer, primary_key=True, index=True)
    form_id = Column(Integer, ForeignKey("data_collection_forms.id"), nullable=False)
    field_name = Column(String(255), nullable=False)
    label = Column(String(500), nullable=False)
    field_type = Column(SAEnum(FieldType), default=FieldType.TEXT)
    is_required = Column(Boolean, default=False)
    options = Column(Text)
    default_value = Column(Text)
    validation_rules = Column(Text)
    help_text = Column(Text)
    order = Column(Integer, default=0)
    section_name = Column(String(255))
    skip_logic = Column(Text)
    appearance = Column(String(100))

    form = relationship("DataCollectionForm", back_populates="fields")


class FormSubmission(Base):
    __tablename__ = "form_submissions"

    id = Column(Integer, primary_key=True, index=True)
    form_id = Column(Integer, ForeignKey("data_collection_forms.id"), nullable=False)
    data = Column(Text, nullable=False)
    status = Column(SAEnum(SubmissionStatus), default=SubmissionStatus.SUBMITTED)
    submitted_by = Column(Integer, ForeignKey("users.id"))
    beneficiary_id = Column(Integer, ForeignKey("beneficiaries.id"))
    governorate = Column(String(100))
    district = Column(String(100))
    gps_latitude = Column(Float)
    gps_longitude = Column(Float)
    notes = Column(Text)
    validated_by = Column(Integer, ForeignKey("users.id"))
    validated_at = Column(DateTime)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    form = relationship("DataCollectionForm", back_populates="submissions")


# -- Document Archive --

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    category = Column(SAEnum(DocumentCategory), default=DocumentCategory.OTHER)
    file_name = Column(String(500), nullable=False)
    file_path = Column(String(1000), nullable=False)
    file_size = Column(Integer, default=0)
    file_type = Column(String(100))
    project_id = Column(Integer, ForeignKey("projects.id"))
    tags = Column(Text)
    version = Column(Integer, default=1)
    is_archived = Column(Boolean, default=False)
    uploaded_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# -- Report Templates --

class ReportTemplate(Base):
    __tablename__ = "report_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    report_type = Column(SAEnum(ReportType), default=ReportType.CUSTOM)
    template_config = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# -- Accountability: Complaints & Feedback Mechanism --

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    reference_number = Column(String(50), unique=True, index=True)
    channel = Column(SAEnum(ComplaintChannel), default=ComplaintChannel.OTHER)
    category = Column(SAEnum(ComplaintCategory), default=ComplaintCategory.OTHER)
    priority = Column(SAEnum(ComplaintPriority), default=ComplaintPriority.MEDIUM)
    status = Column(SAEnum(ComplaintStatus), default=ComplaintStatus.RECEIVED)
    subject = Column(String(500), nullable=False)
    description = Column(Text, nullable=False)
    complainant_name = Column(String(255))
    complainant_phone = Column(String(50))
    complainant_location = Column(String(255))
    is_anonymous = Column(Boolean, default=False)
    is_sensitive = Column(Boolean, default=False)
    project_id = Column(Integer, ForeignKey("projects.id"))
    assigned_to = Column(Integer, ForeignKey("users.id"))
    resolution = Column(Text)
    resolution_date = Column(DateTime)
    response_deadline = Column(DateTime)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    responses = relationship("ComplaintResponse", back_populates="complaint")


class ComplaintResponse(Base):
    __tablename__ = "complaint_responses"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), nullable=False)
    response_text = Column(Text, nullable=False)
    action_taken = Column(Text)
    responded_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    complaint = relationship("Complaint", back_populates="responses")


# -- Learning: Lessons Learned, AAR, Case Studies --

class LessonLearned(Base):
    __tablename__ = "lessons_learned"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(SAEnum(LessonCategory), default=LessonCategory.OTHER)
    lesson_type = Column(String(50))
    project_id = Column(Integer, ForeignKey("projects.id"))
    sector = Column(String(100))
    governorate = Column(String(100))
    recommendations = Column(Text)
    impact = Column(Text)
    tags = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ActionReview(Base):
    __tablename__ = "action_reviews"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    activity_name = Column(String(500), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"))
    review_date = Column(Date)
    what_was_planned = Column(Text)
    what_happened = Column(Text)
    what_went_well = Column(Text)
    what_to_improve = Column(Text)
    action_items = Column(Text)
    participants = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)


class CaseStudy(Base):
    __tablename__ = "case_studies"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    summary = Column(Text, nullable=False)
    background = Column(Text)
    intervention = Column(Text)
    results = Column(Text)
    impact_statement = Column(Text)
    quotes = Column(Text)
    project_id = Column(Integer, ForeignKey("projects.id"))
    sector = Column(String(100))
    governorate = Column(String(100))
    beneficiary_name = Column(String(255))
    consent_obtained = Column(Boolean, default=False)
    photo_url = Column(String(1000))
    tags = Column(Text)
    is_published = Column(Boolean, default=False)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# -- LogFrame & Results Framework --

class LogFrame(Base):
    __tablename__ = "logframes"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    level = Column(SAEnum(LogFrameLevel), nullable=False)
    code = Column(String(50))
    description = Column(Text, nullable=False)
    indicators = Column(Text)
    means_of_verification = Column(Text)
    assumptions = Column(Text)
    parent_id = Column(Integer, ForeignKey("logframes.id"))
    order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    children = relationship("LogFrame", backref="parent")


# -- Data Quality Assessment --

class DataQualityAssessment(Base):
    __tablename__ = "data_quality_assessments"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    form_id = Column(Integer, ForeignKey("data_collection_forms.id"))
    assessment_date = Column(Date, default=date.today)
    total_records = Column(Integer, default=0)
    complete_records = Column(Integer, default=0)
    accuracy_score = Column(Float, default=0)
    timeliness_score = Column(Float, default=0)
    consistency_score = Column(Float, default=0)
    overall_score = Column(Float, default=0)
    status = Column(SAEnum(DQAStatus), default=DQAStatus.GOOD)
    findings = Column(Text)
    recommendations = Column(Text)
    assessed_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)


# -- Risk Management --

class Risk(Base):
    __tablename__ = "risks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    description = Column(Text)
    category = Column(String(100))
    project_id = Column(Integer, ForeignKey("projects.id"))
    likelihood = Column(SAEnum(RiskLikelihood), default=RiskLikelihood.MEDIUM)
    impact = Column(SAEnum(RiskImpact), default=RiskImpact.MODERATE)
    risk_score = Column(Integer, default=0)
    status = Column(SAEnum(RiskStatus), default=RiskStatus.IDENTIFIED)
    mitigation_plan = Column(Text)
    contingency_plan = Column(Text)
    owner = Column(Integer, ForeignKey("users.id"))
    review_date = Column(Date)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# -- MEAL Plan --

class MEALPlan(Base):
    __tablename__ = "meal_plans"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    title = Column(String(500), nullable=False)
    status = Column(SAEnum(MEALPlanStatus), default=MEALPlanStatus.DRAFT)
    monitoring_approach = Column(Text)
    evaluation_plan = Column(Text)
    accountability_mechanisms = Column(Text)
    learning_strategy = Column(Text)
    data_collection_methods = Column(Text)
    reporting_schedule = Column(Text)
    resources_needed = Column(Text)
    indicators_summary = Column(Text)
    start_date = Column(Date)
    end_date = Column(Date)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# -- CHS Compliance --

class CHSAssessment(Base):
    __tablename__ = "chs_assessments"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    commitment = Column(SAEnum(CHSCommitment), nullable=False)
    score = Column(Integer, default=0)
    evidence = Column(Text)
    gaps = Column(Text)
    action_plan = Column(Text)
    assessed_by = Column(Integer, ForeignKey("users.id"))
    assessment_date = Column(Date, default=date.today)
    created_at = Column(DateTime, default=datetime.utcnow)


# -- Safeguarding Reports --

class SafeguardingReport(Base):
    __tablename__ = "safeguarding_reports"

    id = Column(Integer, primary_key=True, index=True)
    reference_number = Column(String(50), unique=True, index=True)
    incident_type = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    incident_date = Column(Date)
    location = Column(String(255))
    is_confidential = Column(Boolean, default=True)
    status = Column(String(50), default="reported")
    action_taken = Column(Text)
    reported_by = Column(Integer, ForeignKey("users.id"))
    assigned_to = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# -- Notifications --

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(500), nullable=False)
    message = Column(Text)
    type = Column(SAEnum(NotificationType), default=NotificationType.SYSTEM)
    is_read = Column(Boolean, default=False)
    link = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)


# -- Needs Assessment Templates --

class NeedsAssessment(Base):
    __tablename__ = "needs_assessments"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    title = Column(String(500), nullable=False)
    sector = Column(String(100), nullable=False)
    governorate = Column(String(100))
    district = Column(String(100))
    assessment_date = Column(Date)
    methodology = Column(Text)
    findings = Column(Text)
    priorities = Column(Text)
    recommendations = Column(Text)
    sample_size = Column(Integer)
    households_surveyed = Column(Integer)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
