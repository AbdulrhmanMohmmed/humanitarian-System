from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
import random
import string
from sqlalchemy.exc import IntegrityError
from app.database import get_db
from app.models import (
    Complaint, ComplaintResponse, User, ComplaintStatus,
    SatisfactionLevel, SensitivityLevel, ComplaintCategory,
)
from app.schemas import (
    ComplaintCreate, ComplaintUpdate, ComplaintOut,
    ComplaintResponseCreate, ComplaintResponseOut
)
from app.auth import get_current_user

router = APIRouter(prefix="/accountability", tags=["المساءلة"])


def _generate_ref():
    return f"CFM-{datetime.now(timezone.utc).strftime('%Y%m')}-{''.join(random.choices(string.digits, k=8))}"


@router.get("/complaints", response_model=List[ComplaintOut])
def list_complaints(
    status: Optional[str] = None,
    category: Optional[str] = None,
    priority: Optional[str] = None,
    project_id: Optional[int] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Complaint)
    if status:
        query = query.filter(Complaint.status == status)
    if category:
        query = query.filter(Complaint.category == category)
    if priority:
        query = query.filter(Complaint.priority == priority)
    if project_id:
        query = query.filter(Complaint.project_id == project_id)
    if search:
        query = query.filter(
            (Complaint.subject.ilike(f"%{search}%")) |
            (Complaint.description.ilike(f"%{search}%")) |
            (Complaint.reference_number.ilike(f"%{search}%"))
        )
    return query.order_by(Complaint.created_at.desc()).all()


@router.post("/complaints", response_model=ComplaintOut)
def create_complaint(
    data: ComplaintCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    for _ in range(5):
        try:
            complaint = Complaint(
                reference_number=_generate_ref(),
                **data.model_dump(),
                created_by=current_user.id,
            )
            db.add(complaint)
            db.commit()
            db.refresh(complaint)
            return complaint
        except IntegrityError as e:
            db.rollback()
            if "reference_number" not in str(e.orig):
                raise HTTPException(status_code=400, detail="فشل في إنشاء الشكوى بسبب خطأ في البيانات")
    raise HTTPException(status_code=500, detail="تعذر توليد رقم مرجعي فريد")


@router.get("/complaints/{complaint_id}", response_model=ComplaintOut)
def get_complaint(
    complaint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="الشكوى غير موجودة")
    return complaint


@router.put("/complaints/{complaint_id}", response_model=ComplaintOut)
def update_complaint(
    complaint_id: int,
    data: ComplaintUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="الشكوى غير موجودة")
    update_data = data.model_dump(exclude_unset=True)
    if "status" in update_data and update_data["status"] in ["resolved", "closed"]:
        complaint.resolution_date = datetime.now(timezone.utc)
    for key, value in update_data.items():
        setattr(complaint, key, value)
    db.commit()
    db.refresh(complaint)
    return complaint


@router.delete("/complaints/{complaint_id}")
def delete_complaint(
    complaint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="الشكوى غير موجودة")
    db.delete(complaint)
    db.commit()
    return {"message": "تم حذف الشكوى بنجاح"}


@router.post("/complaints/{complaint_id}/responses", response_model=ComplaintResponseOut)
def add_response(
    complaint_id: int,
    data: ComplaintResponseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="الشكوى غير موجودة")
    response = ComplaintResponse(
        complaint_id=complaint_id,
        response_text=data.response_text,
        action_taken=data.action_taken,
        responded_by=current_user.id,
    )
    db.add(response)
    if complaint.status == ComplaintStatus.RECEIVED:
        complaint.status = ComplaintStatus.UNDER_REVIEW
    db.commit()
    db.refresh(response)
    return response


@router.put("/complaints/{complaint_id}/satisfaction")
def record_satisfaction(
    complaint_id: int,
    satisfaction_score: str,
    satisfaction_feedback: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="الشكوى غير موجودة")
    complaint.satisfaction_score = SatisfactionLevel(satisfaction_score)
    complaint.satisfaction_feedback = satisfaction_feedback
    db.commit()
    return {"message": "تم تسجيل تقييم الرضا"}


@router.put("/complaints/{complaint_id}/refer")
def refer_complaint(
    complaint_id: int,
    referred_to: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="الشكوى غير موجودة")
    complaint.referred_to = referred_to
    complaint.referral_date = datetime.now(timezone.utc)
    complaint.status = ComplaintStatus.REFERRED
    db.commit()
    return {"message": "تم إحالة الشكوى"}


SENSITIVE_KEYWORDS = {
    "psea": ["استغلال", "تحرش", "جنسي", "اعتداء", "اغتصاب"],
    "protection": ["عنف", "تهديد", "ضرب", "إيذاء", "خطر"],
    "fraud": ["احتيال", "سرقة", "تزوير", "فساد", "رشوة"],
}


@router.post("/complaints/{complaint_id}/auto-classify")
def auto_classify(
    complaint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="الشكوى غير موجودة")
    text = f"{complaint.subject} {complaint.description}".lower()
    classifications = []
    for category, keywords in SENSITIVE_KEYWORDS.items():
        for kw in keywords:
            if kw in text:
                classifications.append(category)
                break
    if classifications:
        complaint.auto_classification = ",".join(classifications)
        if "psea" in classifications:
            complaint.sensitivity_level = SensitivityLevel.CRITICAL
            complaint.is_sensitive = True
        elif "protection" in classifications:
            complaint.sensitivity_level = SensitivityLevel.HIGH
            complaint.is_sensitive = True
        db.commit()
    return {"classifications": classifications, "sensitivity_level": complaint.sensitivity_level.value if complaint.sensitivity_level else "low"}


@router.get("/stats")
def accountability_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total = db.query(Complaint).count()
    received = db.query(Complaint).filter(Complaint.status == ComplaintStatus.RECEIVED).count()
    in_progress = db.query(Complaint).filter(Complaint.status == ComplaintStatus.IN_PROGRESS).count()
    resolved = db.query(Complaint).filter(Complaint.status == ComplaintStatus.RESOLVED).count()
    closed = db.query(Complaint).filter(Complaint.status == ComplaintStatus.CLOSED).count()
    escalated = db.query(Complaint).filter(Complaint.status == ComplaintStatus.ESCALATED).count()
    sensitive = db.query(Complaint).filter(Complaint.is_sensitive == True).count()

    overdue = db.query(Complaint).filter(
        Complaint.response_deadline < datetime.now(timezone.utc),
        Complaint.status.in_([ComplaintStatus.RECEIVED, ComplaintStatus.IN_PROGRESS, ComplaintStatus.UNDER_REVIEW]),
    ).count()

    satisfied = db.query(Complaint).filter(
        Complaint.satisfaction_score.in_([SatisfactionLevel.VERY_SATISFIED, SatisfactionLevel.SATISFIED])
    ).count()
    total_rated = db.query(Complaint).filter(Complaint.satisfaction_score.isnot(None)).count()

    return {
        "total": total,
        "received": received,
        "in_progress": in_progress,
        "resolved": resolved,
        "closed": closed,
        "escalated": escalated,
        "sensitive": sensitive,
        "overdue": overdue,
        "satisfaction_rate": round(satisfied / total_rated * 100, 1) if total_rated > 0 else 0,
        "total_rated": total_rated,
    }


@router.get("/stats/detailed")
def detailed_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from sqlalchemy import func
    by_channel = db.query(
        Complaint.channel, func.count(Complaint.id)
    ).group_by(Complaint.channel).all()

    by_category = db.query(
        Complaint.category, func.count(Complaint.id)
    ).group_by(Complaint.category).all()

    by_sensitivity = db.query(
        Complaint.sensitivity_level, func.count(Complaint.id)
    ).group_by(Complaint.sensitivity_level).all()

    avg_resolution = db.query(Complaint).filter(
        Complaint.resolution_date.isnot(None)
    ).all()
    total_days = sum(
        (c.resolution_date - c.created_at).days for c in avg_resolution
        if c.resolution_date and c.created_at
    )
    avg_days = round(total_days / len(avg_resolution), 1) if avg_resolution else 0

    return {
        "by_channel": [{"channel": c.value if c else "غير محدد", "count": n} for c, n in by_channel],
        "by_category": [{"category": c.value if c else "غير محدد", "count": n} for c, n in by_category],
        "by_sensitivity": [{"level": c.value if c else "غير محدد", "count": n} for c, n in by_sensitivity],
        "avg_resolution_days": avg_days,
    }
