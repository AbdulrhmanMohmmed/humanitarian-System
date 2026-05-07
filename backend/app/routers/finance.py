from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import User
from app.schemas import (
    GrantCreate, GrantOut, GrantUpdate,
    TransactionCreate, TransactionOut, TransactionUpdate,
)
from app.auth import get_current_user
from app.services import finance_service as svc

router = APIRouter(prefix="/finance", tags=["الإدارة المالية"])


# ── Grants ─────────────────────────────────────────────────────────────────────

@router.get("/grants", response_model=List[GrantOut])
def list_grants(
    skip: int = 0, limit: int = 50,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return svc.list_grants(db, skip=skip, limit=limit, status=status)


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

@router.get("/transactions", response_model=List[TransactionOut])
def list_transactions(
    skip: int = 0, limit: int = 50,
    type: Optional[str] = None,
    grant_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return svc.list_transactions(db, skip=skip, limit=limit, type=type, grant_id=grant_id)


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
