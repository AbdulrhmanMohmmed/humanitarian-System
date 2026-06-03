"""MEAL models: Indicator Registry, Disaggregation, Data Quality, Beneficiary Dedup."""
from sqlalchemy import Column, Integer, String, Float, DateTime, Date, Text, ForeignKey, Boolean, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base


class IndicatorDefinition(Base):
    """Standardized indicator registry with full metadata."""
    __tablename__ = "indicator_definitions"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True)
    name = Column(String(500), nullable=False)
    name_ar = Column(String(500))
    sector = Column(String(100))  # WASH, Health, Nutrition, Protection, etc.
    standard = Column(String(100))  # Sphere, CHS, IASC, custom
    unit_of_measure = Column(String(100))
    calculation_method = Column(Text)  # formula or description
    data_source = Column(String(255))
    verification_source = Column(String(255))
    collection_frequency = Column(String(50))  # daily, weekly, monthly, quarterly, annual
    disaggregation_types = Column(Text)  # JSON: ["gender", "age", "disability", "location"]
    baseline_value = Column(Float, nullable=True)
    target_value = Column(Float, nullable=True)
    is_global = Column(Boolean, default=False)  # from global indicator bank
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class DisaggregatedValue(Base):
    """Disaggregated measurement value for an indicator."""
    __tablename__ = "disaggregated_values"
    id = Column(Integer, primary_key=True, index=True)
    measurement_id = Column(Integer, ForeignKey("measurements.id"), nullable=False)
    indicator_id = Column(Integer, ForeignKey("indicators.id"), nullable=False)
    dimension = Column(String(50), nullable=False)  # gender, age_group, disability, location
    category = Column(String(100), nullable=False)  # male/female, 0-5/6-17/18+, yes/no, etc.
    value = Column(Float, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class DataQualityRule(Base):
    """Rules for automated data quality checks."""
    __tablename__ = "data_quality_rules"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    entity_type = Column(String(100))  # beneficiary, measurement, transaction
    field_name = Column(String(100))
    rule_type = Column(String(50))  # range, pattern, required, unique, cross_reference
    rule_config = Column(Text)  # JSON config for the rule
    severity = Column(String(20), default="warning")  # error, warning, info
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class DataQualityIssue(Base):
    """Detected data quality issues."""
    __tablename__ = "data_quality_issues"
    id = Column(Integer, primary_key=True, index=True)
    rule_id = Column(Integer, ForeignKey("data_quality_rules.id"), nullable=True)
    entity_type = Column(String(100))
    entity_id = Column(Integer)
    field_name = Column(String(100))
    issue_description = Column(Text)
    severity = Column(String(20), default="warning")
    status = Column(String(20), default="open")  # open, resolved, ignored
    resolved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class BeneficiaryMatch(Base):
    """Potential duplicate beneficiary matches for review."""
    __tablename__ = "beneficiary_matches"
    id = Column(Integer, primary_key=True, index=True)
    beneficiary_a_id = Column(Integer, ForeignKey("beneficiaries.id"), nullable=False)
    beneficiary_b_id = Column(Integer, ForeignKey("beneficiaries.id"), nullable=False)
    match_score = Column(Float)  # 0-1 similarity score
    match_fields = Column(Text)  # JSON: fields that matched
    status = Column(String(20), default="pending")  # pending, confirmed_duplicate, not_duplicate
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class PDMTemplate(Base):
    """Post-Distribution Monitoring survey templates."""
    __tablename__ = "pdm_templates"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    distribution_type = Column(String(100))  # food, NFI, cash, voucher
    questions = Column(Text)  # JSON array of questions
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
