from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Date, JSON, Enum as SAEnum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base
from .enums import Currency

class ExchangeRate(Base):
    __tablename__ = "exchange_rates"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, default=lambda: datetime.now(timezone.utc).date())
    from_currency = Column(SAEnum(Currency), nullable=False)
    to_currency = Column(SAEnum(Currency), nullable=False)
    rate = Column(Float, nullable=False)
    region = Column(String(50), default="Global") # For Yemen: "Sana'a", "Aden"
    source = Column(String(100)) # Central Bank, Market, etc.
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class BudgetAllocation(Base):
    __tablename__ = "budget_allocations"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    sector = Column(String(100))
    allocated_amount = Column(Float, nullable=False)
    currency = Column(SAEnum(Currency), default=Currency.USD)
    notes = Column(String(255))
    
    project = relationship("Project")
