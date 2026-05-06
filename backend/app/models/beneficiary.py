from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Date, Text, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base
from app.custom_values import CustomValuesMixin
from .enums import Gender, BeneficiaryStatus, DisabilityType

class Beneficiary(CustomValuesMixin, Base):
    __tablename__ = "beneficiaries"

    id = Column(Integer, primary_key=True, index=True)
    national_id = Column(String(50), unique=True, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    gender = Column(SAEnum(Gender))
    date_of_birth = Column(Date)
    phone = Column(String(20))
    governorate = Column(String(100))
    district = Column(String(100))
    village = Column(String(200))
    household_size = Column(Integer, default=1)
    head_of_household = Column(Boolean, default=False)
    has_disability = Column(Boolean, default=False)
    disability_type = Column(SAEnum(DisabilityType), nullable=True)
    vulnerability_score = Column(Float, default=0)
    is_pii_encrypted = Column(Boolean, default=False)
    status = Column(SAEnum(BeneficiaryStatus), default=BeneficiaryStatus.ACTIVE)
    notes = Column(Text)
    custom_values_json = Column(Text, default="{}")
    registered_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    distributions = relationship("DistributionItem", back_populates="beneficiary")
    cash_transfers = relationship("CashTransfer", back_populates="beneficiary")
