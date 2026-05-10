"""Webhook system for external notifications (Slack, Teams, Email, custom)."""

import enum
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class WebhookType(str, enum.Enum):
    SLACK = "slack"
    TEAMS = "teams"
    EMAIL = "email"
    CUSTOM = "custom"


class Webhook(Base):
    __tablename__ = "webhooks"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    url = Column(String(1000), nullable=False)
    type = Column(String(50), default="custom")
    secret = Column(String(255))
    events = Column(Text, default="*")
    is_active = Column(Integer, default=1)
    created_by = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    deliveries = relationship("WebhookDelivery", back_populates="webhook")


class WebhookDelivery(Base):
    __tablename__ = "webhook_deliveries"

    id = Column(Integer, primary_key=True, index=True)
    webhook_id = Column(Integer, ForeignKey("webhooks.id"), nullable=False, index=True)
    event = Column(String(100), nullable=False)
    payload = Column(Text)
    response_status = Column(Integer)
    response_body = Column(Text)
    success = Column(Integer, default=0)
    attempted_at = Column(DateTime, default=datetime.utcnow)

    webhook = relationship("Webhook", back_populates="deliveries")
