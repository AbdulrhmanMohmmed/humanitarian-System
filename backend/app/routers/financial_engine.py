from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import date
from app.database import get_db
from app.models.financial_engine import ExchangeRate, BudgetAllocation
from app.models.project import Project
from app.models.procurement import PurchaseRequest

router = APIRouter(prefix="/api/finance/engine", tags=["Financial Engine"])

@router.get("/rates")
def get_current_rates(region: str = "Global", db: Session = Depends(get_db)):
    return db.query(ExchangeRate).filter(ExchangeRate.region == region).order_by(ExchangeRate.date.desc()).limit(10).all()

@router.post("/rates")
def update_rate(rate_data: dict, db: Session = Depends(get_db)):
    rate = ExchangeRate(**rate_data)
    db.add(rate)
    db.commit()
    return rate

@router.get("/bva/{project_id}")
def get_project_bva(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Calculate Spent from Procurement (Awarded PRs)
    spent = db.query(func.sum(PurchaseRequest.estimated_cost)).filter(
        PurchaseRequest.project_id == project_id,
        PurchaseRequest.status == "AWARDED"
    ).scalar() or 0
    
    allocations = db.query(BudgetAllocation).filter(BudgetAllocation.project_id == project_id).all()
    
    return {
        "project_name": project.name,
        "total_budget": project.budget,
        "total_spent": spent,
        "remaining": project.budget - spent,
        "burn_rate": (spent / project.budget * 100) if project.budget > 0 else 0,
        "allocations": allocations
    }
