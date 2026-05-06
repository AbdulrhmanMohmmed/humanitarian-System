from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Partner(Base):
    __tablename__ = "partners"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    acronym = Column(String(20))
    type = Column(String(50)) # Local NGO, INGO, Gov, Private
    contact_email = Column(String(255))
    rating = Column(Float, default=0) # Capacity rating 1-5
    status = Column(String(20), default="active")
    created_at = Column(DateTime, default=datetime.utcnow)

class SubGrant(Base):
    __tablename__ = "sub_grants"

    id = Column(Integer, primary_key=True, index=True)
    partner_id = Column(Integer, ForeignKey("partners.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="USD")
    status = Column(String(20), default="planned") # planned, active, completed
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    
    partner = relationship("Partner")
    project = relationship("Project")
