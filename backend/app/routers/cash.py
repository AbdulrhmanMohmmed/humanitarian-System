from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime
import uuid
from app.database import get_db
from app.models import CashTransfer, User
from app.schemas import CashTransferCreate, CashTransferUpdate, CashTransferOut
from app.auth import get_current_user

router = APIRouter(prefix="/api/cash", tags=["التحويلات النقدية"])


@router.get("/transfers", response_model=List[CashTransferOut])
def list_transfers(
    skip: int = 0, limit: int = 50,
    status: Optional[str] = None,
    method: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(CashTransfer)
    if status:
        query = query.filter(CashTransfer.status == status)
    if method:
        query = query.filter(CashTransfer.method == method)
    return query.order_by(CashTransfer.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/transfers/stats")
def transfer_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    total_amount = db.query(func.sum(CashTransfer.amount)).scalar() or 0
    total_disbursed = db.query(func.sum(CashTransfer.amount)).filter(CashTransfer.status == "disbursed").scalar() or 0
    total_received = db.query(func.sum(CashTransfer.amount)).filter(CashTransfer.status == "received").scalar() or 0
    pending_count = db.query(CashTransfer).filter(CashTransfer.status == "pending").count()
    by_method = db.query(CashTransfer.method, func.count(CashTransfer.id), func.sum(CashTransfer.amount)).group_by(CashTransfer.method).all()
    return {
        "total_amount": total_amount,
        "total_disbursed": total_disbursed,
        "total_received": total_received,
        "pending_count": pending_count,
        "by_method": [{"method": str(m), "count": c, "amount": a or 0} for m, c, a in by_method],
    }


@router.post("/transfers", response_model=CashTransferOut)
def create_transfer(data: CashTransferCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    reference = f"CT-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    t = CashTransfer(**data.model_dump(), reference=reference, approved_by=current_user.id)
    db.add(t)
    db.commit()
    db.refresh(t)
    return t


@router.put("/transfers/{transfer_id}", response_model=CashTransferOut)
def update_transfer(transfer_id: int, data: CashTransferUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    t = db.query(CashTransfer).filter(CashTransfer.id == transfer_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="التحويل غير موجود")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(t, key, value)
    db.commit()
    db.refresh(t)
    return t


@router.delete("/transfers/{transfer_id}")
def delete_transfer(transfer_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    t = db.query(CashTransfer).filter(CashTransfer.id == transfer_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="التحويل غير موجود")
    db.delete(t)
    db.commit()
    return {"message": "تم حذف التحويل بنجاح"}
