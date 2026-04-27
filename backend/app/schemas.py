from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date, datetime
from app.models import (
    UserRole, Gender, BeneficiaryStatus, ProjectStatus, TransactionType,
    GrantStatus, EmployeeStatus, LeaveType, LeaveStatus, ItemCategory,
    DistributionStatus, CashTransferStatus, CashTransferMethod,
    IndicatorType, Currency, FormStatus, FieldType, SubmissionStatus,
    DocumentCategory, ReportType
)


# ==================== AUTH ====================

class UserCreate(BaseModel):
    username: str
    email: str
    full_name: str
    password: str
    role: UserRole = UserRole.VIEWER
    phone: Optional[str] = None
    department: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class UserOut(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    role: UserRole
    is_active: bool
    phone: Optional[str] = None
    department: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut


# ==================== BENEFICIARY ====================

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
    vulnerability_score: float = 0
    notes: Optional[str] = None

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
    vulnerability_score: Optional[float] = None
    status: Optional[BeneficiaryStatus] = None
    notes: Optional[str] = None

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
    vulnerability_score: float
    status: BeneficiaryStatus
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== PROJECT ====================

class ProjectCreate(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    sector: Optional[str] = None
    status: ProjectStatus = ProjectStatus.PLANNED
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    budget: float = 0
    currency: Currency = Currency.USD
    target_beneficiaries: int = 0
    governorate: Optional[str] = None
    district: Optional[str] = None
    donor: Optional[str] = None

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    sector: Optional[str] = None
    status: Optional[ProjectStatus] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    budget: Optional[float] = None
    spent: Optional[float] = None
    currency: Optional[Currency] = None
    target_beneficiaries: Optional[int] = None
    actual_beneficiaries: Optional[int] = None
    governorate: Optional[str] = None
    district: Optional[str] = None
    donor: Optional[str] = None

class ProjectOut(BaseModel):
    id: int
    code: str
    name: str
    description: Optional[str] = None
    sector: Optional[str] = None
    status: ProjectStatus
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    budget: float
    spent: float
    currency: Currency
    target_beneficiaries: int
    actual_beneficiaries: int
    governorate: Optional[str] = None
    district: Optional[str] = None
    donor: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== ACTIVITY ====================

class ActivityCreate(BaseModel):
    project_id: int
    name: str
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    budget: float = 0
    status: ProjectStatus = ProjectStatus.PLANNED

class ActivityOut(BaseModel):
    id: int
    project_id: int
    name: str
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    budget: float
    spent: float
    progress: float
    status: ProjectStatus
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== GRANT ====================

class GrantCreate(BaseModel):
    code: str
    name: str
    donor: str
    amount: float
    currency: Currency = Currency.USD
    status: GrantStatus = GrantStatus.PENDING
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    project_id: Optional[int] = None
    conditions: Optional[str] = None

class GrantOut(BaseModel):
    id: int
    code: str
    name: str
    donor: str
    amount: float
    spent: float
    currency: Currency
    status: GrantStatus
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    project_id: Optional[int] = None
    conditions: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== TRANSACTION ====================

class TransactionCreate(BaseModel):
    reference: Optional[str] = None
    type: TransactionType
    amount: float
    currency: Currency = Currency.USD
    description: Optional[str] = None
    category: Optional[str] = None
    grant_id: Optional[int] = None
    project_id: Optional[int] = None
    transaction_date: Optional[date] = None

class TransactionOut(BaseModel):
    id: int
    reference: Optional[str] = None
    type: TransactionType
    amount: float
    currency: Currency
    description: Optional[str] = None
    category: Optional[str] = None
    grant_id: Optional[int] = None
    project_id: Optional[int] = None
    transaction_date: Optional[date] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== EMPLOYEE ====================

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


# ==================== LEAVE ====================

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


# ==================== WAREHOUSE ====================

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


# ==================== INVENTORY ====================

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


# ==================== DISTRIBUTION ====================

class DistributionCreate(BaseModel):
    title: str
    project_id: Optional[int] = None
    warehouse_id: Optional[int] = None
    distribution_date: Optional[date] = None
    location: Optional[str] = None
    governorate: Optional[str] = None
    notes: Optional[str] = None

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


# ==================== CASH TRANSFER ====================

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


# ==================== INDICATOR ====================

class IndicatorCreate(BaseModel):
    code: Optional[str] = None
    name: str
    description: Optional[str] = None
    type: IndicatorType = IndicatorType.OUTPUT
    unit: Optional[str] = None
    target_value: float = 0
    project_id: int
    baseline: float = 0
    data_source: Optional[str] = None
    frequency: Optional[str] = None

class IndicatorOut(BaseModel):
    id: int
    code: Optional[str] = None
    name: str
    description: Optional[str] = None
    type: IndicatorType
    unit: Optional[str] = None
    target_value: float
    actual_value: float
    project_id: int
    baseline: float
    data_source: Optional[str] = None
    frequency: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== MEASUREMENT ====================

class MeasurementCreate(BaseModel):
    indicator_id: int
    value: float
    date: date
    notes: Optional[str] = None
    governorate: Optional[str] = None
    district: Optional[str] = None

class MeasurementOut(BaseModel):
    id: int
    indicator_id: int
    value: float
    date: date
    notes: Optional[str] = None
    governorate: Optional[str] = None
    district: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== SURVEY ====================

class SurveyQuestionCreate(BaseModel):
    question_text: str
    question_type: str = "text"
    options: Optional[str] = None
    is_required: bool = True
    order: int = 0

class SurveyCreate(BaseModel):
    title: str
    description: Optional[str] = None
    project_id: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    questions: List[SurveyQuestionCreate] = []

class SurveyQuestionOut(BaseModel):
    id: int
    question_text: str
    question_type: str
    options: Optional[str] = None
    is_required: bool
    order: int

    class Config:
        from_attributes = True

class SurveyOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    project_id: Optional[int] = None
    is_active: bool
    total_responses: int
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    questions: List[SurveyQuestionOut] = []
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== DASHBOARD ====================

class DashboardStats(BaseModel):
    total_beneficiaries: int
    active_projects: int
    total_employees: int
    total_grants: float
    total_spent: float
    total_distributions: int
    total_cash_transfers: float
    pending_leaves: int
    low_stock_items: int
    active_surveys: int

class BeneficiaryByGovernorate(BaseModel):
    governorate: str
    count: int

class ProjectBySector(BaseModel):
    sector: str
    count: int

class MonthlyTransaction(BaseModel):
    month: str
    income: float
    expense: float


# ==================== DATA COLLECTION FORMS ====================

class FormFieldCreate(BaseModel):
    field_name: str
    label: str
    field_type: FieldType = FieldType.TEXT
    is_required: bool = False
    options: Optional[str] = None
    default_value: Optional[str] = None
    validation_rules: Optional[str] = None
    help_text: Optional[str] = None
    order: int = 0
    section_name: Optional[str] = None
    skip_logic: Optional[str] = None
    appearance: Optional[str] = None

class FormFieldOut(BaseModel):
    id: int
    field_name: str
    label: str
    field_type: FieldType
    is_required: bool
    options: Optional[str] = None
    default_value: Optional[str] = None
    validation_rules: Optional[str] = None
    help_text: Optional[str] = None
    order: int
    section_name: Optional[str] = None
    skip_logic: Optional[str] = None
    appearance: Optional[str] = None

    class Config:
        from_attributes = True

class DataCollectionFormCreate(BaseModel):
    title: str
    description: Optional[str] = None
    project_id: Optional[int] = None
    status: FormStatus = FormStatus.DRAFT
    allow_edit_after_submit: bool = False
    collect_gps: bool = False
    require_authentication: bool = True
    submission_limit: Optional[int] = None
    fields: List[FormFieldCreate] = []

class DataCollectionFormUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    project_id: Optional[int] = None
    status: Optional[FormStatus] = None
    allow_edit_after_submit: Optional[bool] = None
    collect_gps: Optional[bool] = None
    submission_limit: Optional[int] = None

class DataCollectionFormOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    project_id: Optional[int] = None
    status: FormStatus
    version: int
    allow_edit_after_submit: bool
    collect_gps: bool
    require_authentication: bool
    submission_limit: Optional[int] = None
    fields: List[FormFieldOut] = []
    submission_count: int = 0
    created_at: datetime

    class Config:
        from_attributes = True

class FormSubmissionCreate(BaseModel):
    form_id: int
    data: str
    beneficiary_id: Optional[int] = None
    governorate: Optional[str] = None
    district: Optional[str] = None
    gps_latitude: Optional[float] = None
    gps_longitude: Optional[float] = None
    notes: Optional[str] = None

class FormSubmissionOut(BaseModel):
    id: int
    form_id: int
    data: str
    status: SubmissionStatus
    submitted_by: Optional[int] = None
    beneficiary_id: Optional[int] = None
    governorate: Optional[str] = None
    district: Optional[str] = None
    gps_latitude: Optional[float] = None
    gps_longitude: Optional[float] = None
    notes: Optional[str] = None
    validated_by: Optional[int] = None
    validated_at: Optional[datetime] = None
    submitted_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==================== DOCUMENT ARCHIVE ====================

class DocumentCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: DocumentCategory = DocumentCategory.OTHER
    project_id: Optional[int] = None
    tags: Optional[str] = None

class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[DocumentCategory] = None
    project_id: Optional[int] = None
    tags: Optional[str] = None
    is_archived: Optional[bool] = None

class DocumentOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    category: DocumentCategory
    file_name: str
    file_path: str
    file_size: int
    file_type: Optional[str] = None
    project_id: Optional[int] = None
    tags: Optional[str] = None
    version: int
    is_archived: bool
    uploaded_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==================== REPORT TEMPLATES ====================

class ReportTemplateCreate(BaseModel):
    name: str
    description: Optional[str] = None
    report_type: ReportType = ReportType.CUSTOM
    template_config: Optional[str] = None

class ReportTemplateOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    report_type: ReportType
    template_config: Optional[str] = None
    created_by: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ReportGenerateRequest(BaseModel):
    report_type: ReportType
    format: str = "excel"
    project_id: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    governorate: Optional[str] = None
    form_id: Optional[int] = None
    title: Optional[str] = None
