from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base

class IncidentReport(Base):
    __tablename__ = "incident_reports"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    incident_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    location_name = Column(String(100))
    latitude = Column(Float)
    longitude = Column(Float)
    severity = Column(String(20)) # Low, Medium, High, Critical
    status = Column(String(20), default="reported") # reported, investigated, closed
    reported_by_id = Column(Integer, ForeignKey("users.id"))
    project_id = Column(Integer, ForeignKey("projects.id"))
    
    reported_by = relationship("User")
    project = relationship("Project")

class RiskMatrix(Base):
    __tablename__ = "risk_matrices"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    category = Column(String(50)) # Financial, Security, Operational, Political
    risk_description = Column(Text, nullable=False)
    probability = Column(Integer) # 1-5
    impact = Column(Integer) # 1-5
    mitigation_plan = Column(Text)
    status = Column(String(20), default="active")
    
    project = relationship("Project")
