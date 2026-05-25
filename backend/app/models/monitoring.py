from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Date, Text, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone, date
from app.database import Base
from app.custom_values import CustomValuesMixin
from .enums import IndicatorType, LogFrameLevel, DQAStatus

class Indicator(CustomValuesMixin, Base):
    __tablename__ = "indicators"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    type = Column(SAEnum(IndicatorType), default=IndicatorType.OUTPUT)
    unit = Column(String(50))
    target_value = Column(Float, default=0)
    actual_value = Column(Float, default=0)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    baseline = Column(Float, default=0)
    data_source = Column(String(255))
    frequency = Column(String(50))
    means_of_verification = Column(Text)
    responsible_person = Column(String(255))
    disaggregation = Column(Text)
    sector = Column(String(100))
    cumulative_target = Column(Float, default=0)
    deviation_explanation = Column(Text)
    corrective_action = Column(Text)
    custom_values_json = Column(Text, default="{}")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    project = relationship("Project", back_populates="indicators")
    measurements = relationship("Measurement", back_populates="indicator")

class Measurement(Base):
    __tablename__ = "measurements"

    id = Column(Integer, primary_key=True, index=True)
    indicator_id = Column(Integer, ForeignKey("indicators.id"), nullable=False)
    value = Column(Float, nullable=False)
    date = Column(Date, nullable=False)
    notes = Column(Text)
    collected_by = Column(Integer, ForeignKey("users.id"))
    governorate = Column(String(100))
    district = Column(String(100))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    indicator = relationship("Indicator", back_populates="measurements")

class Survey(Base):
    __tablename__ = "surveys"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    project_id = Column(Integer, ForeignKey("projects.id"))
    is_active = Column(Boolean, default=True)
    total_responses = Column(Integer, default=0)
    start_date = Column(Date)
    end_date = Column(Date)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    questions = relationship("SurveyQuestion", back_populates="survey")

class SurveyQuestion(Base):
    __tablename__ = "survey_questions"

    id = Column(Integer, primary_key=True, index=True)
    survey_id = Column(Integer, ForeignKey("surveys.id"), nullable=False)
    question_text = Column(Text, nullable=False)
    question_type = Column(String(50), default="text")
    options = Column(Text)
    is_required = Column(Boolean, default=True)
    order = Column(Integer, default=0)

    survey = relationship("Survey", back_populates="questions")
    responses = relationship("SurveyResponse", back_populates="question")

class SurveyResponse(Base):
    __tablename__ = "survey_responses"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("survey_questions.id"), nullable=False)
    respondent_id = Column(Integer, ForeignKey("beneficiaries.id"))
    answer = Column(Text)
    collected_by = Column(Integer, ForeignKey("users.id"))
    collected_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    governorate = Column(String(100))

    question = relationship("SurveyQuestion", back_populates="responses")

class LogFrame(Base):
    __tablename__ = "logframes"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    level = Column(SAEnum(LogFrameLevel), nullable=False)
    code = Column(String(50))
    description = Column(Text, nullable=False)
    indicators = Column(Text)
    means_of_verification = Column(Text)
    assumptions = Column(Text)
    baseline_value = Column(String(255))
    target_value = Column(String(255))
    frequency = Column(String(100))
    responsible_person = Column(String(255))
    disaggregation = Column(Text)
    parent_id = Column(Integer, ForeignKey("logframes.id"))
    order = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    children = relationship("LogFrame", backref="parent", remote_side=[id])

class DataQualityAssessment(Base):
    __tablename__ = "data_quality_assessments"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    form_id = Column(Integer, ForeignKey("data_collection_forms.id"))
    assessment_date = Column(Date, default=date.today)
    total_records = Column(Integer, default=0)
    complete_records = Column(Integer, default=0)
    accuracy_score = Column(Float, default=0)
    timeliness_score = Column(Float, default=0)
    consistency_score = Column(Float, default=0)
    overall_score = Column(Float, default=0)
    status = Column(SAEnum(DQAStatus), default=DQAStatus.GOOD)
    findings = Column(Text)
    recommendations = Column(Text)
    assessed_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class IPTTEntry(Base):
    __tablename__ = "iptt_entries"

    id = Column(Integer, primary_key=True, index=True)
    indicator_id = Column(Integer, ForeignKey("indicators.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    period = Column(String(20), nullable=False)
    year = Column(Integer, nullable=False)
    month = Column(Integer)
    quarter = Column(Integer)
    target_value = Column(Float, default=0)
    actual_value = Column(Float, default=0)
    cumulative_target = Column(Float, default=0)
    cumulative_actual = Column(Float, default=0)
    achievement_rate = Column(Float, default=0)
    status_color = Column(String(10), default="green")
    deviation_explanation = Column(Text)
    corrective_action = Column(Text)
    data_source = Column(String(255))
    entered_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class SectorIndicator(Base):
    __tablename__ = "sector_indicators"

    id = Column(Integer, primary_key=True, index=True)
    sector = Column(String(100), nullable=False)
    indicator_code = Column(String(50), nullable=False)
    indicator_name = Column(String(500), nullable=False)
    definition = Column(Text)
    calculation_method = Column(Text)
    data_source = Column(String(255))
    frequency = Column(String(50))
    disaggregation = Column(Text)
    target = Column(Float)
    unit = Column(String(50))
    is_standard = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
