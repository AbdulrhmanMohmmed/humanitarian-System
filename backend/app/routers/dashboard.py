from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import (
    Beneficiary, Project, Employee, Grant, Transaction,
    Distribution, CashTransfer, LeaveRequest, InventoryItem, Survey, User
)
from app.schemas import DashboardStats
from app.auth import get_current_user
from app.cache import cache_get, cache_set

router = APIRouter(prefix="/dashboard", tags=["لوحة المعلومات"])


@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    cached = cache_get("dashboard:stats")
    if cached is not None:
        return DashboardStats(**cached)

    total_beneficiaries = db.query(Beneficiary).count()
    active_projects = db.query(Project).filter(Project.status == "active").count()
    total_employees = db.query(Employee).filter(Employee.status == "active").count()
    total_grants = db.query(func.sum(Grant.amount)).scalar() or 0
    total_spent = db.query(func.sum(Transaction.amount)).filter(Transaction.type == "expense").scalar() or 0
    total_distributions = db.query(Distribution).count()
    total_cash_transfers = db.query(func.sum(CashTransfer.amount)).scalar() or 0
    pending_leaves = db.query(LeaveRequest).filter(LeaveRequest.status == "pending").count()
    low_stock_items = db.query(InventoryItem).filter(InventoryItem.quantity <= InventoryItem.min_stock).count()
    active_surveys = db.query(Survey).filter(Survey.is_active == True).count()

    result = DashboardStats(
        total_beneficiaries=total_beneficiaries,
        active_projects=active_projects,
        total_employees=total_employees,
        total_grants=total_grants,
        total_spent=total_spent,
        total_distributions=total_distributions,
        total_cash_transfers=total_cash_transfers,
        pending_leaves=pending_leaves,
        low_stock_items=low_stock_items,
        active_surveys=active_surveys,
    )
    cache_set("dashboard:stats", result.model_dump(), ttl=60)
    return result


@router.get("/recent-activities")
def get_recent_activities(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    recent_beneficiaries = db.query(Beneficiary).order_by(Beneficiary.created_at.desc()).limit(5).all()
    recent_projects = db.query(Project).order_by(Project.created_at.desc()).limit(5).all()
    recent_transactions = db.query(Transaction).order_by(Transaction.created_at.desc()).limit(5).all()

    return {
        "recent_beneficiaries": [
            {"id": b.id, "name": f"{b.first_name} {b.last_name}", "governorate": b.governorate, "date": str(b.created_at)}
            for b in recent_beneficiaries
        ],
        "recent_projects": [
            {"id": p.id, "name": p.name, "status": p.status, "date": str(p.created_at)}
            for p in recent_projects
        ],
        "recent_transactions": [
            {"id": t.id, "type": t.type, "amount": t.amount, "description": t.description, "date": str(t.created_at)}
            for t in recent_transactions
        ],
    }
