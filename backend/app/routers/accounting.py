"""Accounting endpoints — Chart of Accounts, Journal Entries, Budget Lines, Trial Balance."""
from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import User
from app.models.accounting import Account, BudgetLine, DonorReportTemplate
from app.pagination import PaginationParams, paginate
from app.services import accounting_service

router = APIRouter(prefix="/accounting", tags=["المحاسبة"])


# ── Chart of Accounts ────────────────────────────────────────────────────────

@router.post("/accounts/seed")
def seed_accounts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    accounts = accounting_service.seed_chart_of_accounts(db)
    return {"seeded": len(accounts), "accounts": accounts}


@router.get("/accounts")
def list_accounts(
    account_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Account).filter(Account.is_active == True)
    if account_type:
        query = query.filter(Account.account_type == account_type)
    accounts = query.order_by(Account.code).all()
    return [{"id": a.id, "code": a.code, "name": a.name, "name_ar": a.name_ar, "type": a.account_type} for a in accounts]


class AccountCreate(BaseModel):
    code: str
    name: str
    name_ar: str = ""
    account_type: str
    parent_id: Optional[int] = None
    description: str = ""


@router.post("/accounts")
def create_account(body: AccountCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    acct = Account(code=body.code, name=body.name, name_ar=body.name_ar, account_type=body.account_type, parent_id=body.parent_id, description=body.description)
    db.add(acct)
    db.commit()
    db.refresh(acct)
    return {"id": acct.id, "code": acct.code, "name": acct.name}


# ── Journal Entries (Double-Entry) ───────────────────────────────────────────

class JournalLineInput(BaseModel):
    account_id: int
    debit: float = 0
    credit: float = 0
    description: str = ""


class JournalEntryCreate(BaseModel):
    reference: str
    date: date
    description: str
    lines: list[JournalLineInput]
    transaction_id: Optional[int] = None
    grant_id: Optional[int] = None
    project_id: Optional[int] = None


@router.post("/journal-entries")
def create_journal_entry(
    body: JournalEntryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = accounting_service.create_journal_entry(
        db, body.reference, body.date, body.description,
        [l.model_dump() for l in body.lines],
        current_user.id, body.transaction_id, body.grant_id, body.project_id,
    )
    if "error" in result:
        raise HTTPException(400, result["error"])
    return result


@router.get("/journal-entries")
def list_journal_entries(
    params: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.models.accounting import JournalEntry
    query = db.query(JournalEntry).order_by(JournalEntry.date.desc())
    return paginate(query, params)


@router.get("/trial-balance")
def trial_balance(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return accounting_service.get_trial_balance(db)


@router.get("/accounts/{account_id}/balance")
def account_balance(account_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return accounting_service.get_account_balance(db, account_id)


# ── Budget Lines ─────────────────────────────────────────────────────────────

class BudgetLineCreate(BaseModel):
    grant_id: int
    project_id: Optional[int] = None
    account_id: Optional[int] = None
    description: str
    budgeted_amount: float
    period_start: Optional[date] = None
    period_end: Optional[date] = None


@router.post("/budget-lines")
def create_budget_line(body: BudgetLineCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    bl = BudgetLine(**body.model_dump())
    db.add(bl)
    db.commit()
    db.refresh(bl)
    return {"id": bl.id, "description": bl.description, "budgeted_amount": bl.budgeted_amount}


@router.get("/budget-lines")
def list_budget_lines(
    grant_id: Optional[int] = None,
    params: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(BudgetLine)
    if grant_id:
        query = query.filter(BudgetLine.grant_id == grant_id)
    return paginate(query, params)


# ── Donor Report Templates ───────────────────────────────────────────────────

@router.get("/donor-templates")
def list_donor_templates(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    templates = db.query(DonorReportTemplate).filter(DonorReportTemplate.is_active == True).all()
    return [{"id": t.id, "name": t.name, "donor_name": t.donor_name, "type": t.template_type, "format": t.format} for t in templates]
