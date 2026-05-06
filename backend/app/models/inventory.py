from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Date, Text, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base
from .enums import ItemCategory, DistributionStatus, Currency

class Warehouse(Base):
    __tablename__ = "warehouses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, index=True)
    location = Column(String(255))
    governorate = Column(String(100))
    capacity = Column(Float, default=0)
    manager_id = Column(Integer, ForeignKey("users.id"))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    items = relationship("InventoryItem", back_populates="warehouse")

class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    sku = Column(String(100), index=True)
    category = Column(SAEnum(ItemCategory), default=ItemCategory.OTHER)
    quantity = Column(Float, default=0)
    unit = Column(String(50))
    min_stock = Column(Float, default=0)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    expiry_date = Column(Date)
    batch_number = Column(String(100))
    unit_cost = Column(Float, default=0)
    currency = Column(SAEnum(Currency), default=Currency.USD)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    warehouse = relationship("Warehouse", back_populates="items")

class Distribution(Base):
    __tablename__ = "distributions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"))
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"))
    distribution_date = Column(Date)
    location = Column(String(255))
    governorate = Column(String(100))
    status = Column(SAEnum(DistributionStatus), default=DistributionStatus.PLANNED)
    total_beneficiaries = Column(Integer, default=0)
    notes = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    items = relationship("DistributionItem", back_populates="distribution")

class DistributionItem(Base):
    __tablename__ = "distribution_items"

    id = Column(Integer, primary_key=True, index=True)
    distribution_id = Column(Integer, ForeignKey("distributions.id"), nullable=False)
    beneficiary_id = Column(Integer, ForeignKey("beneficiaries.id"), nullable=False)
    item_name = Column(String(255))
    quantity = Column(Float, default=0)
    unit = Column(String(50))
    received = Column(Boolean, default=False)
    received_date = Column(DateTime)
    notes = Column(Text)

    distribution = relationship("Distribution", back_populates="items")
    beneficiary = relationship("Beneficiary", back_populates="distributions")
