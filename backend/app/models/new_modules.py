"""New humanitarian modules: Protection, Emergency Response, Camp, Nutrition, WASH, Education, Livelihoods, Early Warning."""
from sqlalchemy import Column, Integer, String, Float, DateTime, Date, Text, ForeignKey, Boolean
from datetime import datetime
from app.database import Base


# ── Protection Case Management ───────────────────────────────────────────────

class ProtectionCase(Base):
    __tablename__ = "protection_cases"
    id = Column(Integer, primary_key=True, index=True)
    case_number = Column(String(50), unique=True, index=True)
    case_type = Column(String(50), nullable=False)  # gbv, child_protection, disability, general
    beneficiary_id = Column(Integer, ForeignKey("beneficiaries.id"), nullable=True)
    priority = Column(String(20), default="medium")  # low, medium, high, critical
    status = Column(String(20), default="open")  # open, in_progress, referred, closed
    description = Column(Text)
    intake_date = Column(Date)
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    referral_to = Column(String(255))  # external agency
    referral_date = Column(Date, nullable=True)
    closure_reason = Column(Text)
    closed_at = Column(DateTime, nullable=True)
    is_confidential = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class ProtectionReferral(Base):
    __tablename__ = "protection_referrals"
    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("protection_cases.id"), nullable=False)
    referred_from = Column(String(255))
    referred_to = Column(String(255))
    referral_reason = Column(Text)
    status = Column(String(20), default="pending")  # pending, accepted, completed
    created_at = Column(DateTime, default=datetime.utcnow)


# ── Emergency Response ───────────────────────────────────────────────────────

class EmergencyResponse(Base):
    __tablename__ = "emergency_responses"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    emergency_type = Column(String(100))  # conflict, natural_disaster, epidemic, displacement
    severity = Column(String(20))  # level_1, level_2, level_3
    location = Column(String(255))
    affected_population = Column(Integer, default=0)
    status = Column(String(20), default="active")  # active, monitoring, closed
    activation_date = Column(Date)
    deactivation_date = Column(Date, nullable=True)
    lead_coordinator_id = Column(Integer, ForeignKey("users.id"))
    sitrep = Column(Text)  # Latest situation report
    created_at = Column(DateTime, default=datetime.utcnow)


class RapidAssessment(Base):
    __tablename__ = "rapid_assessments"
    id = Column(Integer, primary_key=True, index=True)
    emergency_id = Column(Integer, ForeignKey("emergency_responses.id"), nullable=False)
    assessment_type = Column(String(50))  # initial, detailed, sectoral
    location = Column(String(255))
    population_affected = Column(Integer, default=0)
    priority_needs = Column(Text)  # JSON: [{sector, priority, description}]
    assessment_date = Column(Date)
    assessor_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)


# ── Camp Management (CCCM) ──────────────────────────────────────────────────

class Camp(Base):
    __tablename__ = "camps"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    location = Column(String(255))
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    capacity = Column(Integer, default=0)
    current_population = Column(Integer, default=0)
    status = Column(String(20), default="active")  # active, planned, closed
    camp_manager_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    services = Column(Text)  # JSON: available services
    infrastructure = Column(Text)  # JSON: infrastructure details
    created_at = Column(DateTime, default=datetime.utcnow)


class CampService(Base):
    __tablename__ = "camp_services"
    id = Column(Integer, primary_key=True, index=True)
    camp_id = Column(Integer, ForeignKey("camps.id"), nullable=False)
    service_type = Column(String(100))  # health, water, shelter, food, education, protection
    provider = Column(String(255))
    capacity = Column(Integer, default=0)
    status = Column(String(20), default="active")
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)


# ── Nutrition ────────────────────────────────────────────────────────────────

class NutritionScreening(Base):
    __tablename__ = "nutrition_screenings"
    id = Column(Integer, primary_key=True, index=True)
    beneficiary_id = Column(Integer, ForeignKey("beneficiaries.id"), nullable=False)
    screening_date = Column(Date, nullable=False)
    muac = Column(Float, nullable=True)  # Mid-Upper Arm Circumference in mm
    weight = Column(Float, nullable=True)
    height = Column(Float, nullable=True)
    wfh_zscore = Column(Float, nullable=True)  # Weight-for-Height Z-score
    classification = Column(String(20))  # normal, mam, sam
    referred = Column(Boolean, default=False)
    treatment_program = Column(String(100))  # OTP, SFP, TSFP
    screener_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)


# ── WASH ─────────────────────────────────────────────────────────────────────

class WaterPoint(Base):
    __tablename__ = "water_points"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255))
    water_source_type = Column(String(100))  # borehole, well, spring, river, truck
    location = Column(String(255))
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    capacity_liters_per_day = Column(Float, default=0)
    population_served = Column(Integer, default=0)
    water_quality_status = Column(String(20), default="unknown")  # safe, contaminated, unknown
    last_tested_at = Column(DateTime, nullable=True)
    status = Column(String(20), default="functional")
    created_at = Column(DateTime, default=datetime.utcnow)


class WaterQualityTest(Base):
    __tablename__ = "water_quality_tests"
    id = Column(Integer, primary_key=True, index=True)
    water_point_id = Column(Integer, ForeignKey("water_points.id"), nullable=False)
    test_date = Column(Date, nullable=False)
    ph_level = Column(Float, nullable=True)
    turbidity = Column(Float, nullable=True)
    residual_chlorine = Column(Float, nullable=True)
    e_coli = Column(Float, nullable=True)
    result = Column(String(20))  # pass, fail
    tester_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)


# ── Education in Emergencies ─────────────────────────────────────────────────

class School(Base):
    __tablename__ = "schools"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    school_type = Column(String(50))  # formal, non_formal, temporary_learning_space
    location = Column(String(255))
    capacity = Column(Integer, default=0)
    enrolled_students = Column(Integer, default=0)
    teachers_count = Column(Integer, default=0)
    status = Column(String(20), default="active")
    has_wash = Column(Boolean, default=False)
    has_protection = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


# ── Livelihoods ──────────────────────────────────────────────────────────────

class LivelihoodProgram(Base):
    __tablename__ = "livelihood_programs"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    program_type = Column(String(100))  # vocational_training, cash_for_work, micro_grants, apprenticeship
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    target_beneficiaries = Column(Integer, default=0)
    enrolled = Column(Integer, default=0)
    graduated = Column(Integer, default=0)
    budget = Column(Float, default=0)
    status = Column(String(20), default="active")
    created_at = Column(DateTime, default=datetime.utcnow)


# ── Early Warning ────────────────────────────────────────────────────────────

class EarlyWarningIndicator(Base):
    __tablename__ = "early_warning_indicators"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    category = Column(String(100))  # food_security, conflict, health, climate, displacement
    threshold_warning = Column(Float)
    threshold_critical = Column(Float)
    current_value = Column(Float, default=0)
    location = Column(String(255))
    status = Column(String(20), default="normal")  # normal, warning, critical
    last_updated = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)


class EarlyWarningAlert(Base):
    __tablename__ = "early_warning_alerts"
    id = Column(Integer, primary_key=True, index=True)
    indicator_id = Column(Integer, ForeignKey("early_warning_indicators.id"), nullable=False)
    alert_level = Column(String(20))  # warning, critical
    message = Column(Text)
    recommended_actions = Column(Text)
    is_acknowledged = Column(Boolean, default=False)
    acknowledged_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
