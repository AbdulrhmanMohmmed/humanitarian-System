from pydantic import BaseModel
from typing import Any, Optional, List
from datetime import date, datetime
from app.models.enums import IndicatorType, LogFrameLevel, DQAStatus

class IndicatorCreate(BaseModel):
    code: Optional[str] = None
    name: str
    description: Optional[str] = None
    type: IndicatorType = IndicatorType.OUTPUT
    unit: Optional[str] = None
    target_value: float = 0
    project_id: int
    baseline: float = 0
    data_source: Optional[str] = None
    frequency: Optional[str] = None
    custom_values: dict[str, Any] = {}

class IndicatorOut(BaseModel):
    id: int
    code: Optional[str] = None
    name: str
    description: Optional[str] = None
    type: IndicatorType
    unit: Optional[str] = None
    target_value: float
    actual_value: float
    project_id: int
    baseline: float
    data_source: Optional[str] = None
    frequency: Optional[str] = None
    custom_values: dict[str, Any] = {}
    created_at: datetime

    class Config:
        from_attributes = True

class MeasurementCreate(BaseModel):
    indicator_id: int
    value: float
    date: date
    notes: Optional[str] = None
    governorate: Optional[str] = None
    district: Optional[str] = None

class MeasurementOut(BaseModel):
    id: int
    indicator_id: int
    value: float
    date: date
    notes: Optional[str] = None
    governorate: Optional[str] = None
    district: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class SurveyQuestionCreate(BaseModel):
    question_text: str
    question_type: str = "text"
    options: Optional[str] = None
    is_required: bool = True
    order: int = 0

class SurveyQuestionOut(BaseModel):
    id: int
    question_text: str
    question_type: str
    options: Optional[str] = None
    is_required: bool
    order: int

    class Config:
        from_attributes = True

class SurveyCreate(BaseModel):
    title: str
    description: Optional[str] = None
    project_id: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    questions: List[SurveyQuestionCreate] = []

class SurveyOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    project_id: Optional[int] = None
    is_active: bool
    total_responses: int
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    questions: List[SurveyQuestionOut] = []
    created_at: datetime

    class Config:
        from_attributes = True

class LogFrameCreate(BaseModel):
    project_id: int
    level: LogFrameLevel
    code: Optional[str] = None
    description: str
    indicators: Optional[str] = None
    means_of_verification: Optional[str] = None
    assumptions: Optional[str] = None
    parent_id: Optional[int] = None
    order: int = 0

class LogFrameOut(BaseModel):
    id: int
    project_id: int
    level: LogFrameLevel
    code: Optional[str] = None
    description: str
    indicators: Optional[str] = None
    means_of_verification: Optional[str] = None
    assumptions: Optional[str] = None
    parent_id: Optional[int] = None
    order: int
    created_at: datetime
    children: List["LogFrameOut"] = []

    class Config:
        from_attributes = True

class DQACreate(BaseModel):
    project_id: Optional[int] = None
    form_id: Optional[int] = None

class DQAOut(BaseModel):
    id: int
    project_id: Optional[int] = None
    form_id: Optional[int] = None
    assessment_date: date
    total_records: int
    complete_records: int
    accuracy_score: float
    timeliness_score: float
    consistency_score: float
    overall_score: float
    status: DQAStatus
    findings: Optional[str] = None
    recommendations: Optional[str] = None
    assessed_by: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True
