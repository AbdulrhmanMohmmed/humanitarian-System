"""International Standards models: Sphere, Grand Bargain, Do No Harm, Gender Marker, Disability."""
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Boolean
from datetime import datetime
from app.database import Base


class SphereStandard(Base):
    __tablename__ = "sphere_standards"
    id = Column(Integer, primary_key=True, index=True)
    sector = Column(String(100), nullable=False)  # WASH, Shelter, Health, Food Security, etc.
    standard_number = Column(String(20))
    title_en = Column(String(500))
    title_ar = Column(String(500))
    key_indicator = Column(Text)
    minimum_standard = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)


class GrandBargainCommitment(Base):
    __tablename__ = "grand_bargain_commitments"
    id = Column(Integer, primary_key=True, index=True)
    workstream = Column(String(100))
    commitment_number = Column(String(20))
    title = Column(String(500))
    description = Column(Text)
    progress = Column(Float, default=0)  # 0-100%
    evidence = Column(Text)
    assessed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    assessed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class DoNoHarmAnalysis(Base):
    __tablename__ = "do_no_harm_analyses"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    dividers = Column(Text)  # JSON: factors that divide communities
    connectors = Column(Text)  # JSON: factors that connect communities
    resource_transfer_effects = Column(Text)
    implicit_ethical_messages = Column(Text)
    mitigation_actions = Column(Text)
    analyst_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)


class GenderMarker(Base):
    """Gender with Age Marker (GAM) for projects — 0 to 4 scale."""
    __tablename__ = "gender_markers"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    marker_code = Column(String(5))  # 0, 1, 2a, 2b, 3, 4
    needs_analysis = Column(Text)
    adapted_activities = Column(Text)
    adequate_participation = Column(Text)
    benefits_equitable = Column(Text)
    overall_score = Column(Float, default=0)
    assessor_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)


class DisabilityInclusionMarker(Base):
    """Disability Inclusion Marker using Washington Group Questions."""
    __tablename__ = "disability_inclusion_markers"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    seeing = Column(Float, default=0)  # Difficulty scores 0-3
    hearing = Column(Float, default=0)
    walking = Column(Float, default=0)
    remembering = Column(Float, default=0)
    self_care = Column(Float, default=0)
    communicating = Column(Float, default=0)
    overall_score = Column(Float, default=0)
    barriers_identified = Column(Text)
    accommodations_planned = Column(Text)
    assessor_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
