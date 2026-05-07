from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timedelta
from app.database import get_db
from app.models import Notification, User, Complaint, Risk, Project, NotificationType
from app.schemas import NotificationOut
from app.auth import get_current_user

router = APIRouter(prefix="/notifications", tags=["الإشعارات"])


@router.get("/", response_model=List[NotificationOut])
def list_notifications(
    unread_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    if unread_only:
        query = query.filter(Notification.is_read == False)
    return query.order_by(Notification.created_at.desc()).limit(50).all()


@router.put("/{notification_id}/read")
def mark_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    n = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id,
    ).first()
    if not n:
        raise HTTPException(status_code=404, detail="الإشعار غير موجود")
    n.is_read = True
    db.commit()
    return {"detail": "تم تحديد كمقروء"}


@router.put("/read-all")
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False,
    ).update({"is_read": True})
    db.commit()
    return {"detail": "تم تحديد الكل كمقروء"}


@router.get("/count")
def unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False,
    ).count()
    return {"unread_count": count}


@router.post("/generate")
def generate_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    generated = 0
    today = datetime.utcnow()

    critical_complaints = db.query(Complaint).filter(
        Complaint.priority == "critical",
        Complaint.status.in_(["received", "under_review"]),
    ).all()
    for c in critical_complaints:
        existing = db.query(Notification).filter(
            Notification.link == f"/accountability?complaint={c.id}",
            Notification.created_at > today - timedelta(hours=24),
        ).first()
        if not existing:
            n = Notification(
                user_id=current_user.id,
                title=f"شكوى حرجة: {c.subject}",
                message=f"شكوى رقم {c.reference_number} بحاجة لمتابعة عاجلة",
                type=NotificationType.COMPLAINT,
                link=f"/accountability?complaint={c.id}",
            )
            db.add(n)
            generated += 1

    high_risks = db.query(Risk).filter(Risk.risk_score >= 12, Risk.status == "identified").all()
    for r in high_risks:
        existing = db.query(Notification).filter(
            Notification.link == f"/risks?risk={r.id}",
            Notification.created_at > today - timedelta(hours=24),
        ).first()
        if not existing:
            n = Notification(
                user_id=current_user.id,
                title=f"مخاطرة عالية: {r.title}",
                message=f"مخاطرة بدرجة {r.risk_score} بحاجة لخطة تخفيف",
                type=NotificationType.RISK,
                link=f"/risks?risk={r.id}",
            )
            db.add(n)
            generated += 1

    db.commit()
    return {"generated": generated}
