from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Text, Table
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base
from app.models.enums import ProcurementStatus, PurchaseOrderStatus, VendorCategory, Currency

# Association table for Purchase Requests and Vendors (RFQ)
purchase_request_vendors = Table(
    "purchase_request_vendors",
    Base.metadata,
    Column("purchase_request_id", Integer, ForeignKey("purchase_requests.id")),
    Column("vendor_id", Integer, ForeignKey("vendors.id"))
)

class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    category = Column(Enum(VendorCategory))
    contact_name = Column(String)
    email = Column(String)
    phone = Column(String)
    address = Column(Text)
    tax_id = Column(String)
    bank_details = Column(Text)
    is_active = Column(Integer, default=1)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    quotes = relationship("Quote", back_populates="vendor")
    purchase_orders = relationship("PurchaseOrder", back_populates="vendor")

class PurchaseRequest(Base):
    __tablename__ = "purchase_requests"

    id = Column(Integer, primary_key=True, index=True)
    request_number = Column(String, unique=True, index=True)
    title = Column(String)
    description = Column(Text)
    estimated_cost = Column(Float)
    currency = Column(Enum(Currency), default=Currency.USD)
    status = Column(Enum(ProcurementStatus), default=ProcurementStatus.DRAFT)
    
    project_id = Column(Integer, ForeignKey("projects.id"))
    requested_by_id = Column(Integer, ForeignKey("users.id"))
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    project = relationship("Project")
    requester = relationship("User")
    quotes = relationship("Quote", back_populates="purchase_request")
    vendors = relationship("Vendor", secondary=purchase_request_vendors)

class Quote(Base):
    __tablename__ = "quotes"

    id = Column(Integer, primary_key=True, index=True)
    purchase_request_id = Column(Integer, ForeignKey("purchase_requests.id"))
    vendor_id = Column(Integer, ForeignKey("vendors.id"))
    
    amount = Column(Float)
    currency = Column(Enum(Currency))
    delivery_time = Column(String)
    terms = Column(Text)
    is_winner = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    purchase_request = relationship("PurchaseRequest", back_populates="quotes")
    vendor = relationship("Vendor", back_populates="quotes")

class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id = Column(Integer, primary_key=True, index=True)
    po_number = Column(String, unique=True, index=True)
    purchase_request_id = Column(Integer, ForeignKey("purchase_requests.id"))
    vendor_id = Column(Integer, ForeignKey("vendors.id"))
    
    total_amount = Column(Float)
    currency = Column(Enum(Currency))
    status = Column(Enum(PurchaseOrderStatus), default=PurchaseOrderStatus.DRAFT)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    purchase_request = relationship("PurchaseRequest")
    vendor = relationship("Vendor", back_populates="purchase_orders")
