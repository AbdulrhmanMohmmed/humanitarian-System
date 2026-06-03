"""Supply Chain endpoints — Stock Movement, Batch, Expiry, Barcode, Last-Mile, Maintenance."""
from typing import Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import User
from app.models.supply_chain import (
    StockMovement, BatchLot, ExpiryAlert, BarcodeItem,
    LastMileDelivery, VehicleMaintenanceSchedule,
)
from app.pagination import PaginationParams, paginate

router = APIRouter(prefix="/supply-chain", tags=["سلسلة الإمداد"])


# ── Stock Movement ───────────────────────────────────────────────────────────

class StockMovementCreate(BaseModel):
    item_id: int
    warehouse_id: int
    movement_type: str
    quantity: float
    unit: str = ""
    reference: str = ""
    destination_warehouse_id: Optional[int] = None
    notes: str = ""


@router.post("/stock-movements")
def create_stock_movement(body: StockMovementCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    mv = StockMovement(**body.model_dump(), performed_by=current_user.id)
    db.add(mv)
    db.commit()
    return {"id": mv.id, "movement_type": mv.movement_type, "quantity": mv.quantity}


@router.get("/stock-movements")
def list_stock_movements(
    item_id: Optional[int] = None,
    warehouse_id: Optional[int] = None,
    params: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(StockMovement)
    if item_id:
        query = query.filter(StockMovement.item_id == item_id)
    if warehouse_id:
        query = query.filter(StockMovement.warehouse_id == warehouse_id)
    return paginate(query.order_by(StockMovement.created_at.desc()), params)


# ── Batch/Lot Tracking ──────────────────────────────────────────────────────

class BatchCreate(BaseModel):
    item_id: int
    batch_number: str
    lot_number: str = ""
    manufacturing_date: Optional[date] = None
    expiry_date: Optional[date] = None
    quantity: float = 0
    unit: str = ""
    supplier: str = ""
    warehouse_id: Optional[int] = None


@router.post("/batches")
def create_batch(body: BatchCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    batch = BatchLot(**body.model_dump())
    db.add(batch)
    db.commit()
    return {"id": batch.id, "batch_number": batch.batch_number}


@router.get("/batches")
def list_batches(
    item_id: Optional[int] = None,
    status: Optional[str] = None,
    params: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(BatchLot)
    if item_id:
        query = query.filter(BatchLot.item_id == item_id)
    if status:
        query = query.filter(BatchLot.status == status)
    return paginate(query.order_by(BatchLot.expiry_date), params)


# ── Expiry Alerts ────────────────────────────────────────────────────────────

@router.get("/expiry-alerts")
def list_expiry_alerts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    alerts = (
        db.query(ExpiryAlert)
        .filter(ExpiryAlert.is_acknowledged == False)
        .order_by(ExpiryAlert.alert_date)
        .limit(50)
        .all()
    )
    return [{"id": a.id, "batch_id": a.batch_id, "type": a.alert_type, "date": str(a.alert_date)} for a in alerts]


@router.post("/expiry-alerts/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    alert = db.query(ExpiryAlert).filter(ExpiryAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(404, "تنبيه غير موجود")
    alert.is_acknowledged = True
    alert.acknowledged_by = current_user.id
    db.commit()
    return {"acknowledged": True}


# ── Barcode/QR ───────────────────────────────────────────────────────────────

class BarcodeCreate(BaseModel):
    barcode: str
    barcode_type: str = "qr"
    item_id: Optional[int] = None
    batch_id: Optional[int] = None
    asset_id: Optional[int] = None


@router.post("/barcodes")
def create_barcode(body: BarcodeCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    bc = BarcodeItem(**body.model_dump())
    db.add(bc)
    db.commit()
    return {"id": bc.id, "barcode": bc.barcode}


@router.get("/barcodes/{barcode}")
def lookup_barcode(barcode: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    bc = db.query(BarcodeItem).filter(BarcodeItem.barcode == barcode).first()
    if not bc:
        raise HTTPException(404, "باركود غير موجود")
    return {"id": bc.id, "barcode": bc.barcode, "type": bc.barcode_type, "item_id": bc.item_id, "batch_id": bc.batch_id, "asset_id": bc.asset_id}


# ── Last-Mile Delivery ──────────────────────────────────────────────────────

class LastMileCreate(BaseModel):
    distribution_id: int
    driver_id: Optional[int] = None
    vehicle_id: Optional[int] = None
    origin_warehouse_id: Optional[int] = None
    destination: str = ""
    destination_lat: Optional[float] = None
    destination_lng: Optional[float] = None


@router.post("/last-mile")
def create_delivery(body: LastMileCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    delivery = LastMileDelivery(**body.model_dump())
    db.add(delivery)
    db.commit()
    return {"id": delivery.id, "status": delivery.status}


@router.post("/last-mile/{delivery_id}/status")
def update_delivery_status(
    delivery_id: int,
    status: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    delivery = db.query(LastMileDelivery).filter(LastMileDelivery.id == delivery_id).first()
    if not delivery:
        raise HTTPException(404, "تسليم غير موجود")
    delivery.status = status
    if status == "delivered":
        from datetime import datetime, timezone
        delivery.delivered_at = datetime.now(timezone.utc)
    db.commit()
    return {"id": delivery.id, "status": delivery.status}


# ── Vehicle Maintenance ──────────────────────────────────────────────────────

class MaintenanceCreate(BaseModel):
    vehicle_id: int
    maintenance_type: str
    scheduled_date: date
    scheduled_km: Optional[int] = None
    notes: str = ""


@router.post("/vehicle-maintenance")
def schedule_maintenance(body: MaintenanceCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    maint = VehicleMaintenanceSchedule(**body.model_dump())
    db.add(maint)
    db.commit()
    return {"id": maint.id, "maintenance_type": maint.maintenance_type}


@router.get("/vehicle-maintenance")
def list_maintenance(
    vehicle_id: Optional[int] = None,
    status: Optional[str] = None,
    params: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(VehicleMaintenanceSchedule)
    if vehicle_id:
        query = query.filter(VehicleMaintenanceSchedule.vehicle_id == vehicle_id)
    if status:
        query = query.filter(VehicleMaintenanceSchedule.status == status)
    return paginate(query.order_by(VehicleMaintenanceSchedule.scheduled_date), params)
