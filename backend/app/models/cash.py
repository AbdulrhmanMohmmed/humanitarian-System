from sqlalchemy import Column, Integer, String, Float, DateTime, Date, Text, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base
from .enums import CashTransferStatus, CashTransferMethod, Currency

class CashTransfer(Base):
    __tablename__ = "cash_transfers"

    id = Column(Integer, primary_key=True, index=True)
    reference = Column(String(100), unique=True, index=True)
    beneficiary_id = Column(Integer, ForeignKey("beneficiaries.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"))
    amount = Column(Float, nullable=False)
    currency = Column(SAEnum(Currency), default=Currency.YER)
    method = Column(SAEnum(CashTransferMethod), default=CashTransferMethod.CASH_IN_HAND)
    status = Column(SAEnum(CashTransferStatus), default=CashTransferStatus.PENDING)
    purpose = Column(String(255))
    transfer_date = Column(Date)
    received_date = Column(Date)
    agent_name = Column(String(255))
    agent_phone = Column(String(20))
    approved_by = Column(Integer, ForeignKey("users.id"))
    notes = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    beneficiary = relationship("Beneficiary", back_populates="cash_transfers")
