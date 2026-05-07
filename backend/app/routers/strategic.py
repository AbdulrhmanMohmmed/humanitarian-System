from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.project import Project
from app.models.finance import Grant
from sqlalchemy import func

router = APIRouter(prefix="/strategic", tags=["Strategic Dashboards"])

@router.get("/global-metrics")
def get_global_metrics(db: Session = Depends(get_db)):
    total_beneficiaries = 125400 # Mocked overall reach
    total_budget = db.query(func.sum(Project.budget)).scalar() or 0
    total_grants = db.query(func.sum(Grant.amount)).scalar() or 0
    
    return {
        "reach": total_beneficiaries,
        "funding_gap": max(0, total_budget - total_grants),
        "active_projects": db.query(Project).filter(Project.status == "active").count(),
        "sector_distribution": [
            {"sector": "WASH", "percentage": 35},
            {"sector": "Food Security", "percentage": 40},
            {"sector": "Health", "percentage": 15},
            {"sector": "Protection", "percentage": 10}
        ],
        "iati_compliance_score": 92
    }

@router.get("/ocha-3w-export")
def export_ocha_3w(db: Session = Depends(get_db)):
    # Mocked 3W (Who, What, Where) data for OCHA
    projects = db.query(Project).all()
    return [{
        "organization": "Our NGO",
        "project_title": p.name,
        "sector": p.sector,
        "location": p.governorate,
        "status": p.status,
        "start_date": p.start_date,
        "end_date": p.end_date
    } for p in projects]
