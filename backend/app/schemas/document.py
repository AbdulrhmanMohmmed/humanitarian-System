from pydantic import BaseModel
from typing import Any, Optional
from datetime import date, datetime
from app.models.enums import DocumentCategory, ReportType

class DocumentCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: DocumentCategory = DocumentCategory.OTHER
    project_id: Optional[int] = None
    tags: Optional[str] = None
    custom_values: dict[str, Any] = {}

class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[DocumentCategory] = None
    project_id: Optional[int] = None
    tags: Optional[str] = None
    is_archived: Optional[bool] = None
    custom_values: Optional[dict[str, Any]] = None

class DocumentOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    category: DocumentCategory
    file_name: str
    file_path: str
    file_size: int
    file_type: Optional[str] = None
    project_id: Optional[int] = None
    tags: Optional[str] = None
    version: int
    is_archived: bool
    custom_values: dict[str, Any] = {}
    uploaded_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ReportTemplateCreate(BaseModel):
    name: str
    description: Optional[str] = None
    report_type: ReportType = ReportType.CUSTOM
    template_config: Optional[str] = None

class ReportTemplateOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    report_type: ReportType
    template_config: Optional[str] = None
    created_by: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ReportGenerateRequest(BaseModel):
    report_type: ReportType
    format: str = "excel"
    project_id: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    governorate: Optional[str] = None
    form_id: Optional[int] = None
    title: Optional[str] = None
