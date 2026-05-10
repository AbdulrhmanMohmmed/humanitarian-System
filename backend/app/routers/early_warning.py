"""Early Warning System endpoints."""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import User
from app.models.new_modules import EarlyWarningIndicator, EarlyWarningAlert
from app.pagination import PaginationParams, paginate

router = APIRouter(prefix="/early-warning", tags=["الإنذار المبكر"])


class IndicatorCreate(BaseModel):
    name: str
    category: str
    threshold_warning: float = 0
    threshold_critical: float = 0
    location: str = ""


@router.post("/indicators")
def create_indicator(body: IndicatorCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ind = EarlyWarningIndicator(**body.model_dump())
    db.add(ind)
    db.commit()
    return {"id": ind.id, "name": ind.name}


@router.get("/indicators")
def list_indicators(
    category: Optional[str] = None,
    status: Optional[str] = None,
    params: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(EarlyWarningIndicator)
    if category:
        query = query.filter(EarlyWarningIndicator.category == category)
    if status:
        query = query.filter(EarlyWarningIndicator.status == status)
    return paginate(query.order_by(EarlyWarningIndicator.name), params)


class UpdateValue(BaseModel):
    value: float


@router.put("/indicators/{indicator_id}/value")
def update_indicator_value(indicator_id: int, body: UpdateValue, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ind = db.query(EarlyWarningIndicator).filter(EarlyWarningIndicator.id == indicator_id).first()
    if not ind:
        raise HTTPException(404, "مؤشر غير موجود")

    from datetime import datetime
    ind.current_value = body.value
    ind.last_updated = datetime.utcnow()

    old_status = ind.status
    if body.value >= ind.threshold_critical:
        ind.status = "critical"
    elif body.value >= ind.threshold_warning:
        ind.status = "warning"
    else:
        ind.status = "normal"

    # Auto-create alert on status change
    if ind.status != old_status and ind.status in ("warning", "critical"):
        alert = EarlyWarningAlert(
            indicator_id=ind.id,
            alert_level=ind.status,
            message=f"Indicator '{ind.name}' reached {ind.status} level: {body.value}",
        )
        db.add(alert)

    db.commit()
    return {"id": ind.id, "status": ind.status, "value": ind.current_value}


@router.get("/alerts")
def list_alerts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    alerts = (
        db.query(EarlyWarningAlert)
        .filter(EarlyWarningAlert.is_acknowledged == False)
        .order_by(EarlyWarningAlert.created_at.desc())
        .limit(50)
        .all()
    )
    return [{"id": a.id, "indicator_id": a.indicator_id, "level": a.alert_level, "message": a.message} for a in alerts]
