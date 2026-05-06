from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text

from app.database import Base


class IndicatorReference(Base):
    __tablename__ = "indicator_references"

    id = Column(Integer, primary_key=True, index=True)
    indicator_id = Column(Integer, ForeignKey("indicators.id"), unique=True, nullable=False)
    calculation_method = Column(Text)
    verification_source = Column(String(255))
    confidence_level = Column(Float, default=0)
    documentation_complete = Column(Boolean, default=False)
    quality_threshold = Column(Float, default=80)
    health_score = Column(Float, default=0)
    health_status = Column(String(20), default="unknown")
    owner = Column(String(255))
    review_frequency = Column(String(50))
    last_reviewed_at = Column(DateTime)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class DataQualityFinding(Base):
    __tablename__ = "data_quality_findings"

    id = Column(Integer, primary_key=True, index=True)
    source_type = Column(String(100), nullable=False)
    source_id = Column(Integer)
    project_id = Column(Integer, ForeignKey("projects.id"))
    finding_type = Column(String(100), nullable=False)
    severity = Column(String(20), default="medium")
    title = Column(String(500), nullable=False)
    description = Column(Text)
    score_impact = Column(Float, default=0)
    status = Column(String(30), default="open")
    assigned_to = Column(Integer, ForeignKey("users.id"))
    resolution_notes = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime)


class WorkflowApproval(Base):
    __tablename__ = "workflow_approvals"

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String(100), nullable=False)
    entity_id = Column(Integer, nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"))
    status = Column(String(30), default="pending")
    submitted_by = Column(Integer, ForeignKey("users.id"))
    reviewed_by = Column(Integer, ForeignKey("users.id"))
    decision_notes = Column(Text)
    required_role = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    reviewed_at = Column(DateTime)


class OperatingAuditEvent(Base):
    __tablename__ = "operating_audit_events"

    id = Column(Integer, primary_key=True, index=True)
    actor_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String(100), nullable=False)
    entity_type = Column(String(100), nullable=False)
    entity_id = Column(Integer)
    sensitivity = Column(String(30), default="normal")
    summary = Column(Text)
    metadata_json = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
