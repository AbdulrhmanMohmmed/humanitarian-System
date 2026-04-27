from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import random
import string
from sqlalchemy.exc import IntegrityError
from app.database import get_db
from app.models import Complaint, ComplaintResponse, User, ComplaintStatus
from app.schemas import (
    ComplaintCreate, ComplaintUpdate, ComplaintOut,
    ComplaintResponseCreate, ComplaintResponseOut
)
from app.auth import get_current_user

router = APIRouter(prefix="/api/accountability", tags=["المساءلة"])


def _generate_ref():
    return f"CFM-{datetime.utcnow().strftime('%Y%m')}-{''.join(random.choices(string.digits, k=8))}"


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
        except IntegrityError:
            db.rollback()
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
        complaint.resolution_date = datetime.utcnow()
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
    return {
        "total": total,
        "received": received,
        "in_progress": in_progress,
        "resolved": resolved,
        "closed": closed,
        "escalated": escalated,
    }
