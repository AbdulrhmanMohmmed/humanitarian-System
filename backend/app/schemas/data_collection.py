from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.enums import FormStatus, FieldType, SubmissionStatus

class FormFieldCreate(BaseModel):
    field_name: str
    label: str
    field_type: FieldType = FieldType.TEXT
    is_required: bool = False
    options: Optional[str] = None
    default_value: Optional[str] = None
    validation_rules: Optional[str] = None
    help_text: Optional[str] = None
    order: int = 0
    section_name: Optional[str] = None
    skip_logic: Optional[str] = None
    appearance: Optional[str] = None

class FormFieldOut(BaseModel):
    id: int
    field_name: str
    label: str
    field_type: FieldType
    is_required: bool
    options: Optional[str] = None
    default_value: Optional[str] = None
    validation_rules: Optional[str] = None
    help_text: Optional[str] = None
    order: int
    section_name: Optional[str] = None
    skip_logic: Optional[str] = None
    appearance: Optional[str] = None

    class Config:
        from_attributes = True

class DataCollectionFormCreate(BaseModel):
    title: str
    description: Optional[str] = None
    project_id: Optional[int] = None
    status: FormStatus = FormStatus.DRAFT
    allow_edit_after_submit: bool = False
    collect_gps: bool = False
    require_authentication: bool = True
    submission_limit: Optional[int] = None
    fields: List[FormFieldCreate] = []

class DataCollectionFormUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    project_id: Optional[int] = None
    status: Optional[FormStatus] = None
    allow_edit_after_submit: Optional[bool] = None
    collect_gps: Optional[bool] = None
    submission_limit: Optional[int] = None

class DataCollectionFormOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    project_id: Optional[int] = None
    status: FormStatus
    version: int
    allow_edit_after_submit: bool
    collect_gps: bool
    require_authentication: bool
    submission_limit: Optional[int] = None
    fields: List[FormFieldOut] = []
    submission_count: int = 0
    created_at: datetime

    class Config:
        from_attributes = True

class FormSubmissionCreate(BaseModel):
    form_id: int
    data: str
    beneficiary_id: Optional[int] = None
    governorate: Optional[str] = None
    district: Optional[str] = None
    gps_latitude: Optional[float] = None
    gps_longitude: Optional[float] = None
    notes: Optional[str] = None

class FormSubmissionOut(BaseModel):
    id: int
    form_id: int
    data: str
    status: SubmissionStatus
    submitted_by: Optional[int] = None
    beneficiary_id: Optional[int] = None
    governorate: Optional[str] = None
    district: Optional[str] = None
    gps_latitude: Optional[float] = None
    gps_longitude: Optional[float] = None
    notes: Optional[str] = None
    validated_by: Optional[int] = None
    validated_at: Optional[datetime] = None
    submitted_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
