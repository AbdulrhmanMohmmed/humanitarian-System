from pydantic import BaseModel
from typing import Any, Optional, List
from datetime import date, datetime
from app.models.enums import (
    ComplaintChannel, ComplaintCategory, ComplaintPriority, ComplaintStatus,
    LessonCategory, LogFrameLevel, DQAStatus, RiskLikelihood, RiskImpact,
    RiskStatus, MEALPlanStatus, NotificationType, CHSCommitment,
    FieldVisitStatus, RecommendationStatus, ComplianceArea, ComplianceStatus,
    SatisfactionLevel
)

class ComplaintCreate(BaseModel):
    channel: ComplaintChannel = ComplaintChannel.OTHER
    category: ComplaintCategory = ComplaintCategory.OTHER
    priority: ComplaintPriority = ComplaintPriority.MEDIUM
    subject: str
    description: str
    complainant_name: Optional[str] = None
    complainant_phone: Optional[str] = None
    complainant_location: Optional[str] = None
    is_anonymous: bool = False
    is_sensitive: bool = False
    project_id: Optional[int] = None
    response_deadline: Optional[datetime] = None
    custom_values: dict[str, Any] = {}

class ComplaintUpdate(BaseModel):
    status: Optional[ComplaintStatus] = None
    priority: Optional[ComplaintPriority] = None
    assigned_to: Optional[int] = None
    resolution: Optional[str] = None
    category: Optional[ComplaintCategory] = None
    custom_values: Optional[dict[str, Any]] = None

class ComplaintResponseCreate(BaseModel):
    response_text: str
    action_taken: Optional[str] = None

class ComplaintResponseOut(BaseModel):
    id: int
    complaint_id: int
    response_text: str
    action_taken: Optional[str] = None
    responded_by: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ComplaintOut(BaseModel):
    id: int
    reference_number: str
    channel: ComplaintChannel
    category: ComplaintCategory
    priority: ComplaintPriority
    status: ComplaintStatus
    subject: str
    description: str
    complainant_name: Optional[str] = None
    complainant_phone: Optional[str] = None
    complainant_location: Optional[str] = None
    is_anonymous: bool
    is_sensitive: bool
    project_id: Optional[int] = None
    assigned_to: Optional[int] = None
    resolution: Optional[str] = None
    resolution_date: Optional[datetime] = None
    response_deadline: Optional[datetime] = None
    created_at: datetime
    responses: List[ComplaintResponseOut] = []
    custom_values: dict[str, Any] = {}

    class Config:
        from_attributes = True

class LessonLearnedCreate(BaseModel):
    title: str
    description: str
    category: LessonCategory = LessonCategory.OTHER
    lesson_type: Optional[str] = None
    project_id: Optional[int] = None
    sector: Optional[str] = None
    governorate: Optional[str] = None
    recommendations: Optional[str] = None
    impact: Optional[str] = None
    tags: Optional[str] = None

class LessonLearnedOut(BaseModel):
    id: int
    title: str
    description: str
    category: LessonCategory
    lesson_type: Optional[str] = None
    project_id: Optional[int] = None
    sector: Optional[str] = None
    governorate: Optional[str] = None
    recommendations: Optional[str] = None
    impact: Optional[str] = None
    tags: Optional[str] = None
    created_by: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ActionReviewCreate(BaseModel):
    title: str
    activity_name: str
    project_id: Optional[int] = None
    review_date: Optional[date] = None
    what_was_planned: Optional[str] = None
    what_happened: Optional[str] = None
    what_went_well: Optional[str] = None
    what_to_improve: Optional[str] = None
    action_items: Optional[str] = None
    participants: Optional[str] = None

class ActionReviewOut(BaseModel):
    id: int
    title: str
    activity_name: str
    project_id: Optional[int] = None
    review_date: Optional[date] = None
    what_was_planned: Optional[str] = None
    what_happened: Optional[str] = None
    what_went_well: Optional[str] = None
    what_to_improve: Optional[str] = None
    action_items: Optional[str] = None
    participants: Optional[str] = None
    created_by: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

class CaseStudyCreate(BaseModel):
    title: str
    summary: str
    background: Optional[str] = None
    intervention: Optional[str] = None
    results: Optional[str] = None
    impact_statement: Optional[str] = None
    quotes: Optional[str] = None
    project_id: Optional[int] = None
    sector: Optional[str] = None
    governorate: Optional[str] = None
    beneficiary_name: Optional[str] = None
    consent_obtained: bool = False
    tags: Optional[str] = None

class CaseStudyOut(BaseModel):
    id: int
    title: str
    summary: str
    background: Optional[str] = None
    intervention: Optional[str] = None
    results: Optional[str] = None
    impact_statement: Optional[str] = None
    quotes: Optional[str] = None
    project_id: Optional[int] = None
    sector: Optional[str] = None
    governorate: Optional[str] = None
    beneficiary_name: Optional[str] = None
    consent_obtained: bool
    photo_url: Optional[str] = None
    tags: Optional[str] = None
    is_published: bool
    created_at: datetime

    class Config:
        from_attributes = True

class RiskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    project_id: Optional[int] = None
    likelihood: RiskLikelihood = RiskLikelihood.MEDIUM
    impact: RiskImpact = RiskImpact.MODERATE
    mitigation_plan: Optional[str] = None
    contingency_plan: Optional[str] = None
    owner: Optional[int] = None
    review_date: Optional[date] = None

class RiskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    likelihood: Optional[RiskLikelihood] = None
    impact: Optional[RiskImpact] = None
    status: Optional[RiskStatus] = None
    mitigation_plan: Optional[str] = None
    contingency_plan: Optional[str] = None
    owner: Optional[int] = None
    review_date: Optional[date] = None

class RiskOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    project_id: Optional[int] = None
    likelihood: RiskLikelihood
    impact: RiskImpact
    risk_score: int
    status: RiskStatus
    mitigation_plan: Optional[str] = None
    contingency_plan: Optional[str] = None
    owner: Optional[int] = None
    review_date: Optional[date] = None
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class MEALPlanCreate(BaseModel):
    project_id: int
    title: str
    monitoring_approach: Optional[str] = None
    evaluation_plan: Optional[str] = None
    accountability_mechanisms: Optional[str] = None
    learning_strategy: Optional[str] = None
    data_collection_methods: Optional[str] = None
    reporting_schedule: Optional[str] = None
    resources_needed: Optional[str] = None
    indicators_summary: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None

class MEALPlanOut(BaseModel):
    id: int
    project_id: int
    title: str
    status: MEALPlanStatus
    monitoring_approach: Optional[str] = None
    evaluation_plan: Optional[str] = None
    accountability_mechanisms: Optional[str] = None
    learning_strategy: Optional[str] = None
    data_collection_methods: Optional[str] = None
    reporting_schedule: Optional[str] = None
    resources_needed: Optional[str] = None
    indicators_summary: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    created_by: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

class CHSAssessmentCreate(BaseModel):
    project_id: Optional[int] = None
    commitment: CHSCommitment
    score: int = 0
    evidence: Optional[str] = None
    gaps: Optional[str] = None
    action_plan: Optional[str] = None

class CHSAssessmentOut(BaseModel):
    id: int
    project_id: Optional[int] = None
    commitment: CHSCommitment
    score: int
    evidence: Optional[str] = None
    gaps: Optional[str] = None
    action_plan: Optional[str] = None
    assessed_by: Optional[int] = None
    assessment_date: date
    created_at: datetime

    class Config:
        from_attributes = True

class SafeguardingCreate(BaseModel):
    incident_type: str
    description: str
    incident_date: Optional[date] = None
    location: Optional[str] = None

class SafeguardingOut(BaseModel):
    id: int
    reference_number: str
    incident_type: str
    description: str
    incident_date: Optional[date] = None
    location: Optional[str] = None
    is_confidential: bool
    status: str
    action_taken: Optional[str] = None
    reported_by: Optional[int] = None
    assigned_to: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

class NotificationOut(BaseModel):
    id: int
    user_id: int
    title: str
    message: Optional[str] = None
    type: NotificationType
    is_read: bool
    link: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class NeedsAssessmentCreate(BaseModel):
    project_id: Optional[int] = None
    title: str
    sector: str
    governorate: Optional[str] = None
    district: Optional[str] = None
    assessment_date: Optional[date] = None
    methodology: Optional[str] = None
    findings: Optional[str] = None
    priorities: Optional[str] = None
    recommendations: Optional[str] = None
    sample_size: Optional[int] = None
    households_surveyed: Optional[int] = None

class NeedsAssessmentOut(BaseModel):
    id: int
    project_id: Optional[int] = None
    title: str
    sector: str
    governorate: Optional[str] = None
    district: Optional[str] = None
    assessment_date: Optional[date] = None
    methodology: Optional[str] = None
    findings: Optional[str] = None
    priorities: Optional[str] = None
    recommendations: Optional[str] = None
    sample_size: Optional[int] = None
    households_surveyed: Optional[int] = None
    created_by: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True
