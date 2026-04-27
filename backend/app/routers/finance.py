from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from app.database import get_db
from app.models import Grant, Transaction, User
from app.schemas import GrantCreate, GrantOut, TransactionCreate, TransactionOut
from app.auth import get_current_user

router = APIRouter(prefix="/api/finance", tags=["الإدارة المالية"])


# Grants
@router.get("/grants", response_model=List[GrantOut])
def list_grants(
    skip: int = 0, limit: int = 50,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Grant)
    if status:
        query = query.filter(Grant.status == status)
    return query.order_by(Grant.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/grants/stats")
def grant_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    total_amount = db.query(func.sum(Grant.amount)).scalar() or 0
    total_spent = db.query(func.sum(Grant.spent)).scalar() or 0
    active_grants = db.query(Grant).filter(Grant.status == "active").count()
    by_donor = db.query(Grant.donor, func.sum(Grant.amount)).group_by(Grant.donor).all()
    return {
        "total_amount": total_amount,
        "total_spent": total_spent,
        "remaining": total_amount - total_spent,
        "active_grants": active_grants,
        "by_donor": [{"donor": d, "amount": a} for d, a in by_donor],
    }


@router.post("/grants", response_model=GrantOut)
def create_grant(data: GrantCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if db.query(Grant).filter(Grant.code == data.code).first():
        raise HTTPException(status_code=400, detail="رمز المنحة موجود بالفعل")
    g = Grant(**data.model_dump())
    db.add(g)
    db.commit()
    db.refresh(g)
    return g


@router.get("/grants/{grant_id}", response_model=GrantOut)
def get_grant(grant_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    g = db.query(Grant).filter(Grant.id == grant_id).first()
    if not g:
        raise HTTPException(status_code=404, detail="المنحة غير موجودة")
    return g


@router.delete("/grants/{grant_id}")
def delete_grant(grant_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    g = db.query(Grant).filter(Grant.id == grant_id).first()
    if not g:
        raise HTTPException(status_code=404, detail="المنحة غير موجودة")
    db.delete(g)
    db.commit()
    return {"message": "تم حذف المنحة بنجاح"}


# Transactions
@router.get("/transactions", response_model=List[TransactionOut])
def list_transactions(
    skip: int = 0, limit: int = 50,
    type: Optional[str] = None,
    grant_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Transaction)
    if type:
        query = query.filter(Transaction.type == type)
    if grant_id:
        query = query.filter(Transaction.grant_id == grant_id)
    return query.order_by(Transaction.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/transactions/summary")
def transaction_summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    total_income = db.query(func.sum(Transaction.amount)).filter(Transaction.type == "income").scalar() or 0
    total_expense = db.query(func.sum(Transaction.amount)).filter(Transaction.type == "expense").scalar() or 0
    return {
        "total_income": total_income,
        "total_expense": total_expense,
        "balance": total_income - total_expense,
    }


@router.post("/transactions", response_model=TransactionOut)
def create_transaction(data: TransactionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    t = Transaction(**data.model_dump(), approved_by=current_user.id)
    db.add(t)
    db.commit()
    db.refresh(t)

    # Update grant spent amount
    if t.grant_id and t.type == "expense":
        grant = db.query(Grant).filter(Grant.id == t.grant_id).first()
        if grant:
            grant.spent = (grant.spent or 0) + t.amount
            db.commit()

    return t
