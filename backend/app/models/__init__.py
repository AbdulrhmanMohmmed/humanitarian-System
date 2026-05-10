from app.database import Base

from .enums import *
from .user import User
from .beneficiary import Beneficiary
from .project import Project, Activity
from .finance import Grant, Transaction
from .hr import Employee, LeaveRequest, Attendance
from .inventory import Warehouse, InventoryItem, Distribution, DistributionItem
from .cash import CashTransfer
from .monitoring import Indicator, Measurement, Survey, SurveyQuestion, SurveyResponse, LogFrame, DataQualityAssessment, IPTTEntry, SectorIndicator
from .data_collection import DataCollectionForm, FormField, FormSubmission
from .document import Document, ReportTemplate
from .accountability import (
    Complaint, ComplaintResponse, LessonLearned, ActionReview, CaseStudy,
    Risk, MEALPlan, CHSAssessment, SafeguardingReport, Notification,
    NeedsAssessment, FieldVisit, Recommendation, ComplianceAssessment, AuditLog
)
from .operating import IndicatorReference, DataQualityFinding, WorkflowApproval, OperatingAuditEvent
from .customization import SystemSetting, ReferenceList, ReferenceListItem, CustomFieldDefinition, RolePermissionOverride
from .procurement import Vendor, PurchaseRequest, Quote, PurchaseOrder
from .logistics import Asset, Vehicle, FuelLog
from .financial_engine import ExchangeRate, BudgetAllocation
from .risk_management import IncidentReport, RiskMatrix
from .partners import Partner, SubGrant
from .approval import ApprovalRequest, ApprovalStep, ApprovalRule
from .organization import Organization, OrganizationMember
from .chs import CHSCommitment, CHSAssessmentItem
from .token_blacklist import TokenBlacklist, LoginAttempt
from .webhook import Webhook, WebhookDelivery

# Phase 5+: New models
from .security import UserMFA, PasswordHistory, APIKey, UserSession, DataConsent, IPWhitelist, ErasureRequest
from .accounting import Account, JournalEntry, JournalLine, BudgetLine, DonorReportTemplate
from .meal import IndicatorDefinition, DisaggregatedValue, DataQualityRule, DataQualityIssue, BeneficiaryMatch, PDMTemplate
from .hr_advanced import PayrollRecord, PerformanceReview, Training, TrainingParticipant, Timesheet, StaffSafetyCheckIn, EmployeeContract
from .supply_chain import StockMovement, BatchLot, ExpiryAlert, BarcodeItem, LastMileDelivery, VehicleMaintenanceSchedule
from .standards import SphereStandard, GrandBargainCommitment, DoNoHarmAnalysis, GenderMarker, DisabilityInclusionMarker
from .new_modules import (
    ProtectionCase, ProtectionReferral,
    EmergencyResponse, RapidAssessment,
    Camp, CampService,
    NutritionScreening,
    WaterPoint, WaterQualityTest,
    School,
    LivelihoodProgram,
    EarlyWarningIndicator, EarlyWarningAlert,
)
