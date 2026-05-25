"""Supply Chain models: Stock Movement, Batch Tracking, Expiry, Barcode, Last-Mile, Maintenance."""
from sqlalchemy import Column, Integer, String, Float, DateTime, Date, Text, ForeignKey, Boolean
from datetime import datetime, timezone
from app.database import Base


class StockMovement(Base):
    __tablename__ = "stock_movements"
    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=False)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    movement_type = Column(String(20), nullable=False)  # in, out, transfer, adjustment
    quantity = Column(Float, nullable=False)
    unit = Column(String(50))
    reference = Column(String(100))  # PO number, distribution ID, etc.
    destination_warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=True)
    notes = Column(Text)
    performed_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class BatchLot(Base):
    __tablename__ = "batch_lots"
    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=False)
    batch_number = Column(String(100), nullable=False, index=True)
    lot_number = Column(String(100))
    manufacturing_date = Column(Date, nullable=True)
    expiry_date = Column(Date, nullable=True)
    quantity = Column(Float, default=0)
    unit = Column(String(50))
    supplier = Column(String(255))
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"))
    status = Column(String(20), default="active")  # active, expired, recalled
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class ExpiryAlert(Base):
    __tablename__ = "expiry_alerts"
    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("batch_lots.id"), nullable=False)
    alert_type = Column(String(20))  # warning (30 days), critical (7 days), expired
    alert_date = Column(Date)
    is_acknowledged = Column(Boolean, default=False)
    acknowledged_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class BarcodeItem(Base):
    __tablename__ = "barcode_items"
    id = Column(Integer, primary_key=True, index=True)
    barcode = Column(String(255), unique=True, index=True)
    barcode_type = Column(String(20), default="qr")  # qr, ean13, code128
    item_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=True)
    batch_id = Column(Integer, ForeignKey("batch_lots.id"), nullable=True)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=True)
    metadata_json = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class LastMileDelivery(Base):
    __tablename__ = "last_mile_deliveries"
    id = Column(Integer, primary_key=True, index=True)
    distribution_id = Column(Integer, ForeignKey("distributions.id"), nullable=False)
    driver_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=True)
    origin_warehouse_id = Column(Integer, ForeignKey("warehouses.id"))
    destination = Column(String(255))
    destination_lat = Column(Float, nullable=True)
    destination_lng = Column(Float, nullable=True)
    status = Column(String(20), default="pending")  # pending, in_transit, delivered, failed
    departed_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    delivery_proof = Column(String(500))  # photo URL
    recipient_signature = Column(Text)  # base64 or URL
    notes = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class VehicleMaintenanceSchedule(Base):
    __tablename__ = "vehicle_maintenance_schedules"
    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    maintenance_type = Column(String(100))  # oil_change, tire, brake, service, inspection
    scheduled_date = Column(Date, nullable=False)
    scheduled_km = Column(Integer, nullable=True)
    actual_date = Column(Date, nullable=True)
    actual_km = Column(Integer, nullable=True)
    cost = Column(Float, default=0)
    notes = Column(Text)
    status = Column(String(20), default="scheduled")  # scheduled, completed, overdue
    performed_by = Column(String(255))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
