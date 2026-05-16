"""WASH Module endpoints — Water points, quality testing, hygiene."""
from typing import Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import User
from app.models.new_modules import WaterPoint, WaterQualityTest
from app.pagination import PaginationParams, paginate

router = APIRouter(prefix="/wash", tags=["المياه والصرف الصحي"])


class WaterPointCreate(BaseModel):
    name: str
    water_source_type: str
    location: str = ""
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    capacity_liters_per_day: float = 0
    population_served: int = 0


@router.post("/water-points")
def create_water_point(body: WaterPointCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    wp = WaterPoint(**body.model_dump())
    db.add(wp)
    db.commit()
    return {"id": wp.id, "name": wp.name}


@router.get("/water-points")
def list_water_points(
    status: Optional[str] = None,
    params: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(WaterPoint)
    if status:
        query = query.filter(WaterPoint.status == status)
    return paginate(query.order_by(WaterPoint.name), params)


class WaterTestCreate(BaseModel):
    water_point_id: int
    test_date: date
    ph_level: Optional[float] = None
    turbidity: Optional[float] = None
    residual_chlorine: Optional[float] = None
    e_coli: Optional[float] = None


def _evaluate_water_quality(ph: float | None, turbidity: float | None, e_coli: float | None) -> str:
    if e_coli and e_coli > 0:
        return "fail"
    if ph is not None and (ph < 6.5 or ph > 8.5):
        return "fail"
    if turbidity is not None and turbidity > 5:
        return "fail"
    return "pass"


@router.post("/water-tests")
def create_water_test(body: WaterTestCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = _evaluate_water_quality(body.ph_level, body.turbidity, body.e_coli)
    test = WaterQualityTest(**body.model_dump(), result=result, tester_id=current_user.id)
    db.add(test)

    # Update water point status
    wp = db.query(WaterPoint).filter(WaterPoint.id == body.water_point_id).first()
    if wp:
        from datetime import datetime
        wp.water_quality_status = "safe" if result == "pass" else "contaminated"
        wp.last_tested_at = datetime.utcnow()

    db.commit()
    return {"id": test.id, "result": result}


@router.get("/dashboard")
def wash_dashboard(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    total = db.query(WaterPoint).count()
    functional = db.query(WaterPoint).filter(WaterPoint.status == "functional").count()
    safe = db.query(WaterPoint).filter(WaterPoint.water_quality_status == "safe").count()
    from sqlalchemy import func
    total_served = db.query(func.coalesce(func.sum(WaterPoint.population_served), 0)).scalar()
    return {"total_water_points": total, "functional": functional, "safe_water": safe, "total_served": int(total_served)}
