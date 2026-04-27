from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import Activity, User
from app.schemas import ActivityCreate, ActivityUpdate, ActivityOut
from app.auth import get_current_user

router = APIRouter(prefix="/api/activities", tags=["تتبع الأنشطة"])


@router.get("/", response_model=List[ActivityOut])
def list_activities(
    project_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Activity)
    if project_id:
        query = query.filter(Activity.project_id == project_id)
    return query.order_by(Activity.order, Activity.start_date).all()


@router.post("/", response_model=ActivityOut)
def create_activity(
    data: ActivityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    activity = Activity(**data.model_dump())
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return activity


@router.put("/{activity_id}", response_model=ActivityOut)
def update_activity(
    activity_id: int,
    data: ActivityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    activity = db.query(Activity).filter(Activity.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="النشاط غير موجود")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(activity, k, v)
    db.commit()
    db.refresh(activity)
    return activity


@router.delete("/{activity_id}")
def delete_activity(
    activity_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    activity = db.query(Activity).filter(Activity.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="النشاط غير موجود")
    db.delete(activity)
    db.commit()
    return {"detail": "تم حذف النشاط"}


@router.get("/gantt/{project_id}")
def gantt_data(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    activities = db.query(Activity).filter(
        Activity.project_id == project_id
    ).order_by(Activity.order, Activity.start_date).all()

    gantt_items = []
    for a in activities:
        gantt_items.append({
            "id": a.id,
            "name": a.name,
            "start_date": a.start_date.isoformat() if a.start_date else None,
            "end_date": a.end_date.isoformat() if a.end_date else None,
            "actual_start": a.actual_start.isoformat() if a.actual_start else None,
            "actual_end": a.actual_end.isoformat() if a.actual_end else None,
            "progress": a.progress,
            "status": a.status,
            "responsible": a.responsible,
            "parent_id": a.parent_id,
            "variance_days": None,
        })
        if a.end_date and a.actual_end:
            gantt_items[-1]["variance_days"] = (a.actual_end - a.end_date).days
        elif a.end_date and not a.actual_end and a.progress < 100:
            from datetime import date
            gantt_items[-1]["variance_days"] = (date.today() - a.end_date).days if date.today() > a.end_date else 0

    total = len(gantt_items)
    avg_progress = round(sum(g["progress"] for g in gantt_items) / total, 1) if total else 0
    on_track = len([g for g in gantt_items if (g["variance_days"] or 0) <= 0])
    delayed = len([g for g in gantt_items if (g["variance_days"] or 0) > 0])

    return {
        "activities": gantt_items,
        "summary": {
            "total": total,
            "avg_progress": avg_progress,
            "on_track": on_track,
            "delayed": delayed,
        },
    }
