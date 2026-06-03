"""
Financial approval workflow (maker-checker pattern).
Supports multi-level approval chains for transactions above configurable thresholds.
"""

import enum
from datetime import datetime, timezone

from sqlalchemy import (
    Column, DateTime, Enum as SAEnum, Float, ForeignKey, Integer,
    String, Text,
)
from sqlalchemy.orm import relationship

from app.database import Base


class ApprovalStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"


class ApprovalEntityType(str, enum.Enum):
    TRANSACTION = "transaction"
    GRANT = "grant"
    PURCHASE_REQUEST = "purchase_request"
    PURCHASE_ORDER = "purchase_order"


class ApprovalRequest(Base):
    __tablename__ = "approval_requests"

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(SAEnum(ApprovalEntityType), nullable=False)
    entity_id = Column(Integer, nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="USD")
    description = Column(Text)
    status = Column(SAEnum(ApprovalStatus), default=ApprovalStatus.PENDING)
    required_level = Column(Integer, default=1)
    current_level = Column(Integer, default=0)

    requester_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    requester = relationship("User", foreign_keys=[requester_id])

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    steps = relationship("ApprovalStep", back_populates="request", order_by="ApprovalStep.level")


class ApprovalStep(Base):
    __tablename__ = "approval_steps"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("approval_requests.id"), nullable=False)
    level = Column(Integer, nullable=False)
    approver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(SAEnum(ApprovalStatus), default=ApprovalStatus.PENDING)
    comment = Column(Text)
    decided_at = Column(DateTime)

    request = relationship("ApprovalRequest", back_populates="steps")
    approver = relationship("User", foreign_keys=[approver_id])

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class ApprovalRule(Base):
    """Configurable rules: e.g. transactions > $5000 need 2-level approval."""
    __tablename__ = "approval_rules"

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(SAEnum(ApprovalEntityType), nullable=False)
    min_amount = Column(Float, default=0)
    max_amount = Column(Float)
    required_levels = Column(Integer, default=1)
    is_active = Column(Integer, default=1)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
