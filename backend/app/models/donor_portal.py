from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, Boolean, Enum as SAEnum
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class ProposalStatus(str, enum.Enum):
    DRAFT = "draft"
    INTERNAL_REVIEW = "internal_review"
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    REVISION_REQUESTED = "revision_requested"
    APPROVED = "approved"
    REJECTED = "rejected"
    CONVERTED = "converted"


class FundingStatus(str, enum.Enum):
    OPEN = "open"
    CLOSING_SOON = "closing_soon"
    CLOSED = "closed"
    AWARDED = "awarded"


class InstallmentStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    REQUESTED = "requested"
    APPROVED = "approved"
    DISBURSED = "disbursed"
    DELAYED = "delayed"
    CANCELLED = "cancelled"


class VisitStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    CONFIRMED = "confirmed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    POSTPONED = "postponed"


class Proposal(Base):
    __tablename__ = "proposals"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    code = Column(String(50), unique=True, index=True)
    status = Column(SAEnum(ProposalStatus), default=ProposalStatus.DRAFT)
    donor_id = Column(Integer, ForeignKey("donors.id"), nullable=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    sector = Column(String(100))
    budget_requested = Column(Float, default=0)
    duration_months = Column(Integer, default=12)
    target_beneficiaries = Column(Integer, default=0)
    governorate = Column(String(100))
    summary = Column(Text)
    objectives = Column(Text, default="[]")
    outcomes = Column(Text, default="[]")
    outputs = Column(Text, default="[]")
    activities_json = Column(Text, default="[]")
    indicators_json = Column(Text, default="[]")
    budget_json = Column(Text, default="[]")
    logframe_json = Column(Text, default="{}")
    submission_deadline = Column(DateTime, nullable=True)
    submitted_at = Column(DateTime, nullable=True)
    approved_at = Column(DateTime, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class FundingOpportunity(Base):
    __tablename__ = "funding_opportunities"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    donor_name = Column(String(255))
    donor_id = Column(Integer, ForeignKey("donors.id"), nullable=True)
    sector = Column(String(100))
    subsector = Column(String(100))
    description = Column(Text)
    eligibility = Column(Text)
    min_amount = Column(Float, nullable=True)
    max_amount = Column(Float, nullable=True)
    currency = Column(String(10), default="USD")
    countries = Column(Text, default="[]")
    closing_date = Column(DateTime, nullable=True)
    status = Column(SAEnum(FundingStatus), default=FundingStatus.OPEN)
    application_url = Column(String(500))
    contact_email = Column(String(255))
    is_featured = Column(Boolean, default=False)
    source = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class DonorInstallment(Base):
    __tablename__ = "donor_installments"
    id = Column(Integer, primary_key=True, index=True)
    grant_id = Column(Integer, ForeignKey("grants.id"), nullable=False)
    donor_id = Column(Integer, ForeignKey("donors.id"), nullable=True)
    installment_number = Column(Integer, default=1)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="USD")
    scheduled_date = Column(DateTime, nullable=False)
    actual_date = Column(DateTime, nullable=True)
    status = Column(SAEnum(InstallmentStatus), default=InstallmentStatus.SCHEDULED)
    conditions = Column(Text)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class DonorVisit(Base):
    __tablename__ = "donor_visits"
    id = Column(Integer, primary_key=True, index=True)
    donor_id = Column(Integer, ForeignKey("donors.id"), nullable=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    title = Column(String(255), nullable=False)
    visit_date = Column(DateTime, nullable=False)
    location = Column(String(255))
    status = Column(SAEnum(VisitStatus), default=VisitStatus.SCHEDULED)
    agenda = Column(Text)
    findings = Column(Text)
    recommendations_text = Column(Text)
    visitors = Column(Text, default="[]")
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class DonorCommunication(Base):
    __tablename__ = "donor_communications"
    id = Column(Integer, primary_key=True, index=True)
    donor_id = Column(Integer, ForeignKey("donors.id"), nullable=True)
    grant_id = Column(Integer, ForeignKey("grants.id"), nullable=True)
    subject = Column(String(500), nullable=False)
    message = Column(Text, nullable=False)
    direction = Column(String(10), default="outgoing")
    channel = Column(String(50), default="email")
    sent_by = Column(Integer, ForeignKey("users.id"))
    sent_at = Column(DateTime, default=datetime.utcnow)
    read_at = Column(DateTime, nullable=True)
