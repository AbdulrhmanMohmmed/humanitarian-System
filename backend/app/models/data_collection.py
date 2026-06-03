from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base
from .enums import FormStatus, FieldType, SubmissionStatus

class DataCollectionForm(Base):
    __tablename__ = "data_collection_forms"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    project_id = Column(Integer, ForeignKey("projects.id"))
    status = Column(SAEnum(FormStatus), default=FormStatus.DRAFT)
    version = Column(Integer, default=1)
    allow_edit_after_submit = Column(Boolean, default=False)
    collect_gps = Column(Boolean, default=False)
    require_authentication = Column(Boolean, default=True)
    submission_limit = Column(Integer)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    fields = relationship("FormField", back_populates="form", order_by="FormField.order")
    submissions = relationship("FormSubmission", back_populates="form")

class FormField(Base):
    __tablename__ = "form_fields"

    id = Column(Integer, primary_key=True, index=True)
    form_id = Column(Integer, ForeignKey("data_collection_forms.id"), nullable=False)
    field_name = Column(String(255), nullable=False)
    label = Column(String(500), nullable=False)
    field_type = Column(SAEnum(FieldType), default=FieldType.TEXT)
    is_required = Column(Boolean, default=False)
    options = Column(Text)
    default_value = Column(Text)
    validation_rules = Column(Text)
    help_text = Column(Text)
    order = Column(Integer, default=0)
    section_name = Column(String(255))
    skip_logic = Column(Text)
    appearance = Column(String(100))

    form = relationship("DataCollectionForm", back_populates="fields")

class FormSubmission(Base):
    __tablename__ = "form_submissions"

    id = Column(Integer, primary_key=True, index=True)
    form_id = Column(Integer, ForeignKey("data_collection_forms.id"), nullable=False)
    data = Column(Text, nullable=False)
    status = Column(SAEnum(SubmissionStatus), default=SubmissionStatus.SUBMITTED)
    submitted_by = Column(Integer, ForeignKey("users.id"))
    beneficiary_id = Column(Integer, ForeignKey("beneficiaries.id"))
    governorate = Column(String(100))
    district = Column(String(100))
    gps_latitude = Column(Float)
    gps_longitude = Column(Float)
    notes = Column(Text)
    validated_by = Column(Integer, ForeignKey("users.id"))
    validated_at = Column(DateTime)
    submitted_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    form = relationship("DataCollectionForm", back_populates="submissions")
