"""Service layer for Finance (Grants & Transactions) operations."""

from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.middleware.error_handler import ConflictError, NotFoundError
from app.models import Grant, Transaction
from app.schemas import GrantCreate, GrantUpdate, TransactionCreate, TransactionUpdate


# ── Grants ─────────────────────────────────────────────────────────────────────

def list_grants(
    db: Session, *, skip: int = 0, limit: int = 50, status: Optional[str] = None,
) -> list[Grant]:
    query = db.query(Grant)
    if status:
        query = query.filter(Grant.status == status)
    return query.order_by(Grant.created_at.desc()).offset(skip).limit(limit).all()


def grant_stats(db: Session) -> dict:
    total_amount = db.query(func.sum(Grant.amount)).scalar() or 0
    total_spent = db.query(func.sum(Grant.spent)).scalar() or 0
    active_grants = db.query(Grant).filter(Grant.status == "active").count()
    by_donor = (
        db.query(Grant.donor_id, func.sum(Grant.amount))
        .filter(Grant.donor_id.isnot(None))
        .group_by(Grant.donor_id)
        .all()
    )
    return {
        "total_amount": total_amount,
        "total_spent": total_spent,
        "remaining": total_amount - total_spent,
        "active_grants": active_grants,
        "by_donor": [{"donor_id": d, "amount": a} for d, a in by_donor],
    }


def get_grant(db: Session, grant_id: int) -> Grant:
    g = db.query(Grant).filter(Grant.id == grant_id).first()
    if not g:
        raise NotFoundError("Grant", grant_id)
    return g


def create_grant(db: Session, data: GrantCreate) -> Grant:
    g = Grant(**data.model_dump())
    db.add(g)
    db.commit()
    db.refresh(g)
    return g


def update_grant(db: Session, grant_id: int, data: GrantUpdate) -> Grant:
    g = get_grant(db, grant_id)
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(g, key, value)
    db.commit()
    db.refresh(g)
    return g


def delete_grant(db: Session, grant_id: int) -> None:
    g = get_grant(db, grant_id)
    db.delete(g)
    db.commit()


# ── Transactions ───────────────────────────────────────────────────────────────

def list_transactions(
    db: Session,
    *,
    skip: int = 0,
    limit: int = 50,
    type: Optional[str] = None,
    grant_id: Optional[int] = None,
) -> list[Transaction]:
    query = db.query(Transaction)
    if type:
        query = query.filter(Transaction.type == type)
    if grant_id:
        query = query.filter(Transaction.grant_id == grant_id)
    return query.order_by(Transaction.created_at.desc()).offset(skip).limit(limit).all()


def transaction_summary(db: Session) -> dict:
    total_income = (
        db.query(func.sum(Transaction.amount))
        .filter(Transaction.type == "income")
        .scalar()
        or 0
    )
    total_expense = (
        db.query(func.sum(Transaction.amount))
        .filter(Transaction.type == "expense")
        .scalar()
        or 0
    )
    return {
        "total_income": total_income,
        "total_expense": total_expense,
        "balance": total_income - total_expense,
    }


def recalculate_grant_spent(db: Session, grant_id: int) -> None:
    grant = db.query(Grant).filter(Grant.id == grant_id).first()
    if grant:
        grant.spent = (
            db.query(func.sum(Transaction.amount))
            .filter(
                Transaction.grant_id == grant_id,
                Transaction.type == "expense",
            )
            .scalar()
            or 0
        )


def create_transaction(
    db: Session, data: TransactionCreate, approved_by: int
) -> Transaction:
    t = Transaction(**data.model_dump(), approved_by=approved_by)
    db.add(t)
    db.commit()
    db.refresh(t)
    if t.grant_id and t.type == "expense":
        grant = db.query(Grant).filter(Grant.id == t.grant_id).first()
        if grant:
            grant.spent = (grant.spent or 0) + t.amount
            db.commit()
    return t


def update_transaction(
    db: Session, transaction_id: int, data: TransactionUpdate
) -> Transaction:
    t = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not t:
        raise NotFoundError("Transaction", transaction_id)
    old_grant_id = t.grant_id
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(t, key, value)
    db.commit()
    if old_grant_id:
        recalculate_grant_spent(db, old_grant_id)
    if t.grant_id and t.grant_id != old_grant_id:
        recalculate_grant_spent(db, t.grant_id)
    db.commit()
    db.refresh(t)
    return t


def delete_transaction(db: Session, transaction_id: int) -> None:
    t = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not t:
        raise NotFoundError("Transaction", transaction_id)
    grant_id = t.grant_id
    db.delete(t)
    db.commit()
    if grant_id:
        recalculate_grant_spent(db, grant_id)
        db.commit()
