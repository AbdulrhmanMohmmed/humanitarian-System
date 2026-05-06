from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Date, Text, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from datetime import datetime, date
from app.database import Base
from app.custom_values import CustomValuesMixin
from .enums import (
    ComplaintChannel, ComplaintCategory, ComplaintPriority, ComplaintStatus,
    SensitivityLevel, SatisfactionLevel, LessonCategory, RiskLikelihood,
    RiskImpact, RiskStatus, MEALPlanStatus, CHSCommitment, NotificationType,
    FieldVisitStatus, RecommendationStatus, ComplianceArea, ComplianceStatus,
    AuditAction
)

class Complaint(CustomValuesMixin, Base):
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
    sensitivity_level = Column(SAEnum(SensitivityLevel), default=SensitivityLevel.LOW)
    project_id = Column(Integer, ForeignKey("projects.id"))
    assigned_to = Column(Integer, ForeignKey("users.id"))
    referred_to = Column(String(255))
    referral_date = Column(DateTime)
    resolution = Column(Text)
    resolution_date = Column(DateTime)
    response_deadline = Column(DateTime)
    satisfaction_score = Column(SAEnum(SatisfactionLevel))
    satisfaction_feedback = Column(Text)
    auto_classification = Column(String(255))
    custom_values_json = Column(Text, default="{}")
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

class NeedsAssessment(Base):
    __tablename__ = "needs_assessments"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    title = Column(String(500), nullable=False)
    sector = Column(String(100), nullable=False)
    assessment_type = Column(String(100))
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

class FieldVisit(CustomValuesMixin, Base):
    __tablename__ = "field_visits"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"))
    visit_date = Column(Date, nullable=False)
    location = Column(String(255))
    governorate = Column(String(100))
    district = Column(String(100))
    gps_lat = Column(Float)
    gps_lng = Column(Float)
    team_members = Column(Text)
    objectives = Column(Text)
    checklist = Column(Text)
    observations = Column(Text)
    findings = Column(Text)
    recommendations = Column(Text)
    corrective_actions = Column(Text)
    photos = Column(Text)
    status = Column(SAEnum(FieldVisitStatus), default=FieldVisitStatus.PLANNED)
    visit_type = Column(String(100))
    follow_up_date = Column(Date)
    custom_values_json = Column(Text, default="{}")
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    description = Column(Text)
    source = Column(String(100))
    source_id = Column(Integer)
    project_id = Column(Integer, ForeignKey("projects.id"))
    assigned_to = Column(String(255))
    responsible_department = Column(String(255))
    deadline = Column(Date)
    status = Column(SAEnum(RecommendationStatus), default=RecommendationStatus.PENDING)
    progress_notes = Column(Text)
    completion_date = Column(Date)
    priority = Column(String(50), default="medium")
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ComplianceAssessment(Base):
    __tablename__ = "compliance_assessments"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    area = Column(SAEnum(ComplianceArea), nullable=False)
    standard = Column(String(255), nullable=False)
    requirement = Column(Text, nullable=False)
    status = Column(SAEnum(ComplianceStatus), default=ComplianceStatus.NOT_ASSESSED)
    score = Column(Integer, default=0)
    evidence = Column(Text)
    gaps = Column(Text)
    action_plan = Column(Text)
    responsible_person = Column(String(255))
    deadline = Column(Date)
    assessed_by = Column(Integer, ForeignKey("users.id"))
    assessment_date = Column(Date, default=date.today)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(SAEnum(AuditAction), nullable=False)
    entity_type = Column(String(100), nullable=False)
    entity_id = Column(Integer)
    details = Column(Text)
    ip_address = Column(String(50))
    old_values = Column(Text)
    new_values = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
