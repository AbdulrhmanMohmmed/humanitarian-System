from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class IndicatorReferenceBase(BaseModel):
    indicator_id: int
    calculation_method: Optional[str] = None
    verification_source: Optional[str] = None
    confidence_level: float = 0
    documentation_complete: bool = False
    quality_threshold: float = 80
    owner: Optional[str] = None
    review_frequency: Optional[str] = None


class IndicatorReferenceCreate(IndicatorReferenceBase):
    pass


class IndicatorReferenceOut(IndicatorReferenceBase):
    id: int
    health_score: float
    health_status: str
    last_reviewed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DataQualityFindingCreate(BaseModel):
    source_type: str
    source_id: Optional[int] = None
    project_id: Optional[int] = None
    finding_type: str
    severity: str = "medium"
    title: str
    description: Optional[str] = None
    score_impact: float = 0
    assigned_to: Optional[int] = None


class DataQualityFindingUpdate(BaseModel):
    status: Optional[str] = None
    resolution_notes: Optional[str] = None
    assigned_to: Optional[int] = None


class DataQualityFindingOut(DataQualityFindingCreate):
    id: int
    status: str
    created_by: Optional[int] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class WorkflowApprovalCreate(BaseModel):
    entity_type: str
    entity_id: int
    project_id: Optional[int] = None
    required_role: Optional[str] = None


class WorkflowApprovalDecision(BaseModel):
    status: str
    decision_notes: Optional[str] = None


class WorkflowApprovalOut(WorkflowApprovalCreate):
    id: int
    status: str
    submitted_by: Optional[int] = None
    reviewed_by: Optional[int] = None
    decision_notes: Optional[str] = None
    created_at: datetime
    reviewed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class OperatingAuditEventCreate(BaseModel):
    action: str
    entity_type: str
    entity_id: Optional[int] = None
    sensitivity: str = "normal"
    summary: Optional[str] = None
    metadata_json: Optional[str] = None


class OperatingAuditEventOut(OperatingAuditEventCreate):
    id: int
    actor_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True
