from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import User, Grant, Transaction
from app.schemas import (
    GrantCreate, GrantOut, GrantUpdate,
    TransactionCreate, TransactionOut, TransactionUpdate,
)
from app.auth import get_current_user
from app.pagination import PaginationParams, paginate
from app.services import finance_service as svc

router = APIRouter(prefix="/finance", tags=["الإدارة المالية"])


# ── Grants ─────────────────────────────────────────────────────────────────────

@router.get("/grants")
def list_grants(
    params: PaginationParams = Depends(),
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Grant).filter(Grant.deleted_at.is_(None))
    if status:
        query = query.filter(Grant.status == status)
    query = query.order_by(Grant.created_at.desc())
    return paginate(query, params)


@router.get("/grants/stats")
def grant_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return svc.grant_stats(db)


@router.post("/grants", response_model=GrantOut)
def create_grant(data: GrantCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return svc.create_grant(db, data)


@router.get("/grants/{grant_id}", response_model=GrantOut)
def get_grant(grant_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return svc.get_grant(db, grant_id)


@router.put("/grants/{grant_id}", response_model=GrantOut)
def update_grant(
    grant_id: int, data: GrantUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return svc.update_grant(db, grant_id, data)


@router.delete("/grants/{grant_id}")
def delete_grant(grant_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    svc.delete_grant(db, grant_id)
    return {"message": "تم حذف المنحة بنجاح"}


# ── Transactions ───────────────────────────────────────────────────────────────

@router.get("/transactions")
def list_transactions(
    params: PaginationParams = Depends(),
    type: Optional[str] = None,
    grant_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Transaction).filter(Transaction.deleted_at.is_(None))
    if type:
        query = query.filter(Transaction.type == type)
    if grant_id:
        query = query.filter(Transaction.grant_id == grant_id)
    query = query.order_by(Transaction.created_at.desc())
    return paginate(query, params)


@router.get("/transactions/summary")
def transaction_summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return svc.transaction_summary(db)


@router.post("/transactions", response_model=TransactionOut)
def create_transaction(data: TransactionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return svc.create_transaction(db, data, current_user.id)


@router.put("/transactions/{transaction_id}", response_model=TransactionOut)
def update_transaction(
    transaction_id: int, data: TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return svc.update_transaction(db, transaction_id, data)


@router.delete("/transactions/{transaction_id}")
def delete_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc.delete_transaction(db, transaction_id)
    return {"message": "تم حذف المعاملة بنجاح"}
