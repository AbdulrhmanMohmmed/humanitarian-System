from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime
from app.database import get_db
from app.models import Recommendation, RecommendationStatus, User
from app.auth import get_current_user

router = APIRouter(prefix="/api/recommendations", tags=["التوصيات"])


@router.get("/")
def list_recommendations(
    project_id: Optional[int] = None,
    status: Optional[str] = None,
    source: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Recommendation)
    if project_id:
        query = query.filter(Recommendation.project_id == project_id)
    if status:
        query = query.filter(Recommendation.status == status)
    if source:
        query = query.filter(Recommendation.source == source)
    recs = query.order_by(Recommendation.created_at.desc()).all()
    return [
        {
            "id": r.id, "title": r.title, "description": r.description,
            "source": r.source, "source_id": r.source_id,
            "project_id": r.project_id, "assigned_to": r.assigned_to,
            "responsible_department": r.responsible_department,
            "deadline": r.deadline.isoformat() if r.deadline else None,
            "status": r.status.value if r.status else None,
            "progress_notes": r.progress_notes, "priority": r.priority,
            "completion_date": r.completion_date.isoformat() if r.completion_date else None,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in recs
    ]


@router.post("/")
def create_recommendation(
    title: str,
    description: Optional[str] = None,
    source: Optional[str] = None,
    source_id: Optional[int] = None,
    project_id: Optional[int] = None,
    assigned_to: Optional[str] = None,
    responsible_department: Optional[str] = None,
    deadline: Optional[str] = None,
    priority: Optional[str] = "medium",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rec = Recommendation(
        title=title, description=description,
        source=source, source_id=source_id,
        project_id=project_id, assigned_to=assigned_to,
        responsible_department=responsible_department,
        deadline=date.fromisoformat(deadline) if deadline else None,
        priority=priority, created_by=current_user.id,
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return {"id": rec.id, "message": "تم إنشاء التوصية بنجاح"}


@router.put("/{rec_id}")
def update_recommendation(
    rec_id: int,
    status: Optional[str] = None,
    progress_notes: Optional[str] = None,
    assigned_to: Optional[str] = None,
    deadline: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rec = db.query(Recommendation).filter(Recommendation.id == rec_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="التوصية غير موجودة")
    if status:
        rec.status = RecommendationStatus(status)
        if status == "completed":
            rec.completion_date = date.today()
    if progress_notes:
        rec.progress_notes = progress_notes
    if assigned_to:
        rec.assigned_to = assigned_to
    if deadline:
        rec.deadline = date.fromisoformat(deadline)
    db.commit()
    return {"message": "تم تحديث التوصية"}


@router.delete("/{rec_id}")
def delete_recommendation(
    rec_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rec = db.query(Recommendation).filter(Recommendation.id == rec_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="التوصية غير موجودة")
    db.delete(rec)
    db.commit()
    return {"message": "تم حذف التوصية"}


@router.get("/dashboard")
def recommendations_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total = db.query(Recommendation).count()
    by_status = {}
    for s in RecommendationStatus:
        by_status[s.value] = db.query(Recommendation).filter(Recommendation.status == s).count()
    overdue = db.query(Recommendation).filter(
        Recommendation.status.in_([RecommendationStatus.PENDING, RecommendationStatus.IN_PROGRESS]),
        Recommendation.deadline < date.today(),
    ).count()
    return {"total": total, "by_status": by_status, "overdue": overdue}
