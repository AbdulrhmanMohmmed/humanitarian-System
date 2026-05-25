from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Enum as SAEnum
from datetime import datetime, timezone
from app.database import Base
from app.custom_values import CustomValuesMixin
from .enums import DocumentCategory, ReportType

class Document(CustomValuesMixin, Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    category = Column(SAEnum(DocumentCategory), default=DocumentCategory.OTHER)
    file_name = Column(String(500), nullable=False)
    file_path = Column(String(1000), nullable=False)
    file_size = Column(Integer, default=0)
    file_type = Column(String(100))
    project_id = Column(Integer, ForeignKey("projects.id"))
    tags = Column(Text)
    version = Column(Integer, default=1)
    is_archived = Column(Boolean, default=False)
    custom_values_json = Column(Text, default="{}")
    uploaded_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class ReportTemplate(Base):
    __tablename__ = "report_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    report_type = Column(SAEnum(ReportType), default=ReportType.CUSTOM)
    template_config = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
