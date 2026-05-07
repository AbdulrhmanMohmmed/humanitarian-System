from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from app.database import get_db
from app.models import IPTTEntry, Indicator, Project, User
from app.auth import get_current_user

router = APIRouter(prefix="/iptt", tags=["IPTT"])


@router.get("/")
def list_entries(
    project_id: Optional[int] = None,
    indicator_id: Optional[int] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(IPTTEntry)
    if project_id:
        query = query.filter(IPTTEntry.project_id == project_id)
    if indicator_id:
        query = query.filter(IPTTEntry.indicator_id == indicator_id)
    if year:
        query = query.filter(IPTTEntry.year == year)
    entries = query.order_by(IPTTEntry.year, IPTTEntry.month).all()
    return [
        {
            "id": e.id, "indicator_id": e.indicator_id, "project_id": e.project_id,
            "period": e.period, "year": e.year, "month": e.month, "quarter": e.quarter,
            "target_value": e.target_value, "actual_value": e.actual_value,
            "cumulative_target": e.cumulative_target, "cumulative_actual": e.cumulative_actual,
            "achievement_rate": e.achievement_rate, "status_color": e.status_color,
            "deviation_explanation": e.deviation_explanation, "corrective_action": e.corrective_action,
        }
        for e in entries
    ]


@router.post("/")
def create_entry(
    indicator_id: int,
    project_id: int,
    year: int,
    month: int,
    target_value: float,
    actual_value: float,
    deviation_explanation: Optional[str] = None,
    corrective_action: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    prev_entries = db.query(IPTTEntry).filter(
        IPTTEntry.indicator_id == indicator_id,
        IPTTEntry.project_id == project_id,
        IPTTEntry.year == year,
        IPTTEntry.month < month,
    ).all()
    cum_target = sum(e.target_value for e in prev_entries) + target_value
    cum_actual = sum(e.actual_value for e in prev_entries) + actual_value
    rate = round(cum_actual / cum_target * 100, 1) if cum_target > 0 else 0
    color = "green" if rate >= 80 else ("yellow" if rate >= 50 else "red")
    quarter = (month - 1) // 3 + 1

    entry = IPTTEntry(
        indicator_id=indicator_id, project_id=project_id,
        period=f"{year}-{str(month).zfill(2)}", year=year, month=month, quarter=quarter,
        target_value=target_value, actual_value=actual_value,
        cumulative_target=cum_target, cumulative_actual=cum_actual,
        achievement_rate=rate, status_color=color,
        deviation_explanation=deviation_explanation, corrective_action=corrective_action,
        entered_by=current_user.id,
    )
    db.add(entry)
    indicator = db.query(Indicator).filter(Indicator.id == indicator_id).first()
    if indicator:
        indicator.actual_value = cum_actual
    db.commit()
    db.refresh(entry)
    return {"id": entry.id, "achievement_rate": rate, "status_color": color, "cumulative_actual": cum_actual}


@router.get("/summary/{project_id}")
def iptt_summary(
    project_id: int,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    indicators = db.query(Indicator).filter(Indicator.project_id == project_id).all()
    result = []
    for ind in indicators:
        query = db.query(IPTTEntry).filter(
            IPTTEntry.indicator_id == ind.id,
            IPTTEntry.project_id == project_id,
        )
        if year:
            query = query.filter(IPTTEntry.year == year)
        entries = query.order_by(IPTTEntry.year, IPTTEntry.month).all()
        monthly = [
            {"month": e.month, "year": e.year, "target": e.target_value, "actual": e.actual_value,
             "cum_target": e.cumulative_target, "cum_actual": e.cumulative_actual,
             "rate": e.achievement_rate, "color": e.status_color}
            for e in entries
        ]
        latest = entries[-1] if entries else None
        result.append({
            "indicator_id": ind.id, "code": ind.code, "name": ind.name,
            "type": ind.type.value if ind.type else None, "unit": ind.unit,
            "baseline": ind.baseline, "annual_target": ind.target_value,
            "cumulative_actual": latest.cumulative_actual if latest else 0,
            "achievement_rate": latest.achievement_rate if latest else 0,
            "status_color": latest.status_color if latest else "green",
            "monthly_data": monthly,
        })

    green = sum(1 for r in result if r["status_color"] == "green")
    yellow = sum(1 for r in result if r["status_color"] == "yellow")
    red = sum(1 for r in result if r["status_color"] == "red")
    return {
        "project_id": project_id,
        "indicators": result,
        "summary": {"total": len(result), "green": green, "yellow": yellow, "red": red},
    }


@router.get("/alerts")
def iptt_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    red_entries = db.query(IPTTEntry).filter(IPTTEntry.status_color == "red").all()
    alerts = []
    for e in red_entries:
        ind = db.query(Indicator).filter(Indicator.id == e.indicator_id).first()
        alerts.append({
            "indicator_id": e.indicator_id, "indicator_name": ind.name if ind else "غير معروف",
            "period": e.period, "achievement_rate": e.achievement_rate,
            "target": e.cumulative_target, "actual": e.cumulative_actual,
        })
    return {"total_alerts": len(alerts), "alerts": alerts}
