from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Date, Text, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base
from app.custom_values import CustomValuesMixin
from .enums import ProjectStatus, Currency
from .mixins import SoftDeleteMixin

class Project(SoftDeleteMixin, CustomValuesMixin, Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    sector = Column(String(100))
    status = Column(SAEnum(ProjectStatus), default=ProjectStatus.PLANNED)
    start_date = Column(Date)
    end_date = Column(Date)
    budget = Column(Float, default=0)
    spent = Column(Float, default=0)
    currency = Column(SAEnum(Currency), default=Currency.USD)
    target_beneficiaries = Column(Integer, default=0)
    actual_beneficiaries = Column(Integer, default=0)
    governorate = Column(String(100))
    district = Column(String(100))
    latitude = Column(Float)
    longitude = Column(Float)
    custom_values_json = Column(Text, default="{}")
    manager_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    activities = relationship("Activity", back_populates="project")
    grants = relationship("Grant", back_populates="project")
    indicators = relationship("Indicator", back_populates="project")

class Activity(CustomValuesMixin, Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    start_date = Column(Date)
    end_date = Column(Date)
    actual_start = Column(Date)
    actual_end = Column(Date)
    budget = Column(Float, default=0)
    spent = Column(Float, default=0)
    progress = Column(Float, default=0)
    status = Column(SAEnum(ProjectStatus), default=ProjectStatus.PLANNED)
    responsible = Column(String(255))
    parent_id = Column(Integer, ForeignKey("activities.id"))
    order = Column(Integer, default=0)
    custom_values_json = Column(Text, default="{}")
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="activities")
    children = relationship("Activity", backref="parent", remote_side=[id])
