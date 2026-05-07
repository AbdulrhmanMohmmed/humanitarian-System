from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.logistics import Asset, Vehicle, FuelLog
from app.models.user import User
from app.schemas.logistics import (
    AssetCreate, AssetOut, 
    VehicleCreate, VehicleOut,
    FuelLogCreate, FuelLogOut
)
from app.auth import get_current_user

router = APIRouter(prefix="/logistics", tags=["Logistics & Fleet"])

# ── Assets ───────────────────────────────────────────────────────────────────

@router.get("/assets", response_model=List[AssetOut])
def list_assets(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Asset).all()

@router.post("/assets", response_model=AssetOut)
def create_asset(asset: AssetCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_asset = Asset(**asset.model_dump())
    db.add(db_asset)
    db.commit()
    db.refresh(db_asset)
    return db_asset

# ── Fleet ────────────────────────────────────────────────────────────────────

@router.get("/vehicles", response_model=List[VehicleOut])
def list_vehicles(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Vehicle).all()

@router.post("/vehicles", response_model=VehicleOut)
def create_vehicle(vehicle: VehicleCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_vehicle = Vehicle(**vehicle.model_dump())
    db.add(db_vehicle)
    db.commit()
    db.refresh(db_vehicle)
    return db_vehicle

@router.post("/fuel-logs", response_model=FuelLogOut)
def add_fuel_log(log: FuelLogCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_log = FuelLog(**log.model_dump(), recorded_by_id=current_user.id)
    
    # Update vehicle odometer
    vehicle = db.query(Vehicle).filter(Vehicle.id == log.vehicle_id).first()
    if vehicle and log.odometer_reading:
        vehicle.current_odometer = log.odometer_reading
        
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

@router.get("/fuel-logs", response_model=List[FuelLogOut])
def list_fuel_logs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(FuelLog).all()
