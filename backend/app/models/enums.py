import enum

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

class DisabilityType(str, enum.Enum):
    NONE = "none"
    PHYSICAL = "physical"
    VISUAL = "visual"
    HEARING = "hearing"
    COGNITIVE = "cognitive"
    MULTIPLE = "multiple"
    OTHER = "other"

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
    REFERRED = "referred"
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

class FieldVisitStatus(str, enum.Enum):
    PLANNED = "planned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class RecommendationStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"

class ComplianceArea(str, enum.Enum):
    CHS = "chs"
    AAP = "aap"
    PSEA = "psea"
    DO_NO_HARM = "do_no_harm"
    DATA_PROTECTION = "data_protection"
    SAFEGUARDING = "safeguarding"
    DONOR_COMPLIANCE = "donor_compliance"

class ComplianceStatus(str, enum.Enum):
    COMPLIANT = "compliant"
    PARTIALLY_COMPLIANT = "partially_compliant"
    NON_COMPLIANT = "non_compliant"
    NOT_ASSESSED = "not_assessed"

class AuditAction(str, enum.Enum):
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"
    LOGIN = "login"
    EXPORT = "export"
    STATUS_CHANGE = "status_change"

class SatisfactionLevel(str, enum.Enum):
    VERY_SATISFIED = "very_satisfied"
    SATISFIED = "satisfied"
    NEUTRAL = "neutral"
    DISSATISFIED = "dissatisfied"
    VERY_DISSATISFIED = "very_dissatisfied"

class SensitivityLevel(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class ProcurementStatus(str, enum.Enum):
    DRAFT = "draft"
    PENDING_APPROVAL = "pending_approval"
    RFQ_ISSUED = "rfq_issued"
    QUOTES_RECEIVED = "quotes_received"
    EVALUATION = "evaluation"
    AWARDED = "awarded"
    PO_ISSUED = "po_issued"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class PurchaseOrderStatus(str, enum.Enum):
    DRAFT = "draft"
    SENT = "sent"
    CONFIRMED = "confirmed"
    PARTIALLY_RECEIVED = "partially_received"
    RECEIVED = "received"
    BILLED = "billed"
    PAID = "paid"
    CANCELLED = "cancelled"

class VendorCategory(str, enum.Enum):
    SUPPLIER = "supplier"
    SERVICE_PROVIDER = "service_provider"
    CONTRACTOR = "contractor"
    CONSULTANT = "consultant"
    OTHER = "other"

class GrantCategory(str, enum.Enum):
    HUMANITARIAN = "humanitarian"
    DEVELOPMENT = "development"
    EMERGENCY = "emergency"
    RECOVERY = "recovery"
    OTHER = "other"

class AssetStatus(str, enum.Enum):
    ACTIVE = "active"
    IN_REPAIR = "in_repair"
    DISPOSED = "disposed"
    LOST = "lost"
    STORED = "stored"

class VehicleStatus(str, enum.Enum):
    AVAILABLE = "available"
    ON_MISSION = "on_mission"
    MAINTENANCE = "maintenance"
    OUT_OF_SERVICE = "out_of_service"

class FuelType(str, enum.Enum):
    PETROL = "petrol"
    DIESEL = "diesel"

class TicketPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class TicketStatus(str, enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    ESCALATED = "escalated"
    RESOLVED = "resolved"
    CLOSED = "closed"
