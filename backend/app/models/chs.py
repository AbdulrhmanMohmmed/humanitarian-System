"""
Core Humanitarian Standard (CHS) 2024 compliance tracking.
Tracks compliance across all 9 CHS commitments with evidence and scoring.
"""

from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class CHSCommitment(Base):
    """Represents one of the 9 CHS commitments."""
    __tablename__ = "chs_commitments"

    id = Column(Integer, primary_key=True, index=True)
    number = Column(Integer, unique=True, nullable=False)
    title_en = Column(String(500), nullable=False)
    title_ar = Column(String(500))
    description = Column(Text)

    assessments = relationship("CHSAssessmentItem", back_populates="commitment")


class CHSAssessmentItem(Base):
    """Individual assessment score for a CHS commitment."""
    __tablename__ = "chs_assessment_items"

    id = Column(Integer, primary_key=True, index=True)
    commitment_id = Column(Integer, ForeignKey("chs_commitments.id"), nullable=False, index=True)
    assessment_period = Column(String(50))
    score = Column(Float, default=0)
    max_score = Column(Float, default=5)
    evidence = Column(Text)
    notes = Column(Text)
    assessor_id = Column(Integer)

    commitment = relationship("CHSCommitment", back_populates="assessments")

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
