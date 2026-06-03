"""Protection Case Management endpoints."""
from typing import Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import User
from app.models.new_modules import ProtectionCase, ProtectionReferral
from app.pagination import PaginationParams, paginate

router = APIRouter(prefix="/protection", tags=["الحماية"])


class CaseCreate(BaseModel):
    case_type: str
    beneficiary_id: Optional[int] = None
    priority: str = "medium"
    description: str = ""
    intake_date: Optional[date] = None


@router.post("/cases")
def create_case(body: CaseCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    import secrets
    case = ProtectionCase(
        **body.model_dump(),
        case_number=f"PC-{secrets.token_hex(4).upper()}",
        assigned_to=current_user.id,
    )
    db.add(case)
    db.commit()
    return {"id": case.id, "case_number": case.case_number, "status": case.status}


@router.get("/cases")
def list_cases(
    case_type: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    params: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(ProtectionCase)
    if case_type:
        query = query.filter(ProtectionCase.case_type == case_type)
    if status:
        query = query.filter(ProtectionCase.status == status)
    if priority:
        query = query.filter(ProtectionCase.priority == priority)
    return paginate(query.order_by(ProtectionCase.created_at.desc()), params)


@router.put("/cases/{case_id}/status")
def update_case_status(case_id: int, status: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    case = db.query(ProtectionCase).filter(ProtectionCase.id == case_id).first()
    if not case:
        raise HTTPException(404, "حالة غير موجودة")
    case.status = status
    if status == "closed":
        from datetime import datetime, timezone
        case.closed_at = datetime.now(timezone.utc)
    db.commit()
    return {"id": case.id, "status": case.status}


class ReferralCreate(BaseModel):
    case_id: int
    referred_to: str
    referral_reason: str = ""


@router.post("/referrals")
def create_referral(body: ReferralCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ref = ProtectionReferral(**body.model_dump(), referred_from="HIAOS")
    db.add(ref)
    db.commit()
    return {"id": ref.id, "status": ref.status}
