from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.finance import Donor, Grant, Transaction
from app.models.user import User
from app.models.enums import GrantStatus, TransactionType
from app.schemas.grants import DonorCreate, DonorOut, GrantCreate, GrantUpdate, GrantOut
from app.auth import get_current_user

router = APIRouter(prefix="/api/grants", tags=["Grant Management"])

# ── Donors ───────────────────────────────────────────────────────────────────

@router.get("/donors", response_model=List[DonorOut])
def list_donors(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Donor).all()

@router.post("/donors", response_model=DonorOut)
def create_donor(donor: DonorCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_donor = Donor(**donor.model_dump())
    db.add(db_donor)
    db.commit()
    db.refresh(db_donor)
    return db_donor

# ── Grants ───────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[GrantOut])
def list_grants(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Grant).all()

@router.post("/", response_model=GrantOut)
def create_grant(grant: GrantCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_grant = Grant(**grant.model_dump(), spent=0, status=GrantStatus.ACTIVE)
    db.add(db_grant)
    db.commit()
    db.refresh(db_grant)
    return db_grant

@router.get("/{grant_id}/bva")
def get_grant_bva(grant_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_grant = db.query(Grant).filter(Grant.id == grant_id).first()
    if not db_grant:
        raise HTTPException(status_code=404, detail="Grant not found")
    
    # Calculate actual spending from transactions
    actual_spent = db.query(Transaction).filter(
        Transaction.grant_id == grant_id,
        Transaction.type == TransactionType.EXPENSE
    ).sum(Transaction.amount) or 0
    
    # Update grant spent amount
    db_grant.spent = actual_spent
    db.commit()
    
    remaining = db_grant.amount - actual_spent
    burn_rate = (actual_spent / db_grant.amount * 100) if db_grant.amount > 0 else 0
    
    return {
        "grant_id": grant_id,
        "title": db_grant.name,
        "budget": db_grant.amount,
        "actual_spent": actual_spent,
        "remaining": remaining,
        "burn_rate": burn_rate,
        "currency": db_grant.currency
    }
