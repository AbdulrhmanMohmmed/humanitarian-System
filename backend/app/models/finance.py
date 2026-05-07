from sqlalchemy import Column, Integer, String, Float, DateTime, Date, Text, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from datetime import datetime, date
from app.database import Base
from app.custom_values import CustomValuesMixin
from .enums import GrantStatus, TransactionType, Currency, GrantCategory
from .mixins import SoftDeleteMixin

class Donor(Base):
    __tablename__ = "donors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True)
    short_name = Column(String(50), index=True)
    description = Column(Text)
    website = Column(String(255))
    contact_person = Column(String(255))
    email = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)

    grants = relationship("Grant", back_populates="donor")

class Grant(SoftDeleteMixin, CustomValuesMixin, Base):
    __tablename__ = "grants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    donor_id = Column(Integer, ForeignKey("donors.id"))
    category = Column(SAEnum(GrantCategory), default=GrantCategory.HUMANITARIAN)
    amount = Column(Float, nullable=False)
    spent = Column(Float, default=0)
    currency = Column(SAEnum(Currency), default=Currency.USD)
    status = Column(SAEnum(GrantStatus), default=GrantStatus.PENDING)
    start_date = Column(Date)
    end_date = Column(Date)
    project_id = Column(Integer, ForeignKey("projects.id"))
    
    donor = relationship("Donor", back_populates="grants")
    conditions = Column(Text)
    custom_values_json = Column(Text, default="{}")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    project = relationship("Project", back_populates="grants")
    transactions = relationship("Transaction", back_populates="grant")

class Transaction(SoftDeleteMixin, CustomValuesMixin, Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    reference = Column(String(100), index=True)
    type = Column(SAEnum(TransactionType), nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(SAEnum(Currency), default=Currency.USD)
    description = Column(Text)
    category = Column(String(100))
    grant_id = Column(Integer, ForeignKey("grants.id"))
    project_id = Column(Integer, ForeignKey("projects.id"))
    approved_by = Column(Integer, ForeignKey("users.id"))
    transaction_date = Column(Date, default=date.today)
    custom_values_json = Column(Text, default="{}")
    created_at = Column(DateTime, default=datetime.utcnow)

    grant = relationship("Grant", back_populates="transactions")
