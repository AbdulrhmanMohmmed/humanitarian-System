from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Date, Text, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base
from .enums import AssetStatus, VehicleStatus, FuelType, Currency

class Asset(Base):
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True)
    name = Column(String(255), nullable=False)
    category = Column(String(100))
    serial_number = Column(String(100))
    purchase_date = Column(Date)
    purchase_cost = Column(Float)
    currency = Column(SAEnum(Currency), default=Currency.USD)
    status = Column(SAEnum(AssetStatus), default=AssetStatus.ACTIVE)
    location = Column(String(255))
    condition = Column(String(100))
    
    # Assignment
    assigned_to_id = Column(Integer, ForeignKey("users.id"))
    department = Column(String(100))
    project_id = Column(Integer, ForeignKey("projects.id"))
    
    notes = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    plate_number = Column(String(50), unique=True, index=True)
    make = Column(String(100))
    model = Column(String(100))
    year = Column(Integer)
    chassis_number = Column(String(100))
    status = Column(SAEnum(VehicleStatus), default=VehicleStatus.AVAILABLE)
    governorate = Column(String(100))
    
    # Technical
    fuel_type = Column(SAEnum(FuelType))
    current_odometer = Column(Integer, default=0)
    last_service_date = Column(Date)
    insurance_expiry = Column(Date)
    registration_expiry = Column(Date)
    
    assigned_driver_id = Column(Integer, ForeignKey("users.id"))
    project_id = Column(Integer, ForeignKey("projects.id"))
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class FuelLog(Base):
    __tablename__ = "fuel_logs"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    date = Column(Date, default=lambda: datetime.now(timezone.utc).date())
    odometer_reading = Column(Integer)
    liters = Column(Float)
    cost = Column(Float)
    currency = Column(SAEnum(Currency), default=Currency.USD)
    fuel_station = Column(String(255))
    coupon_number = Column(String(50))
    
    recorded_by_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
