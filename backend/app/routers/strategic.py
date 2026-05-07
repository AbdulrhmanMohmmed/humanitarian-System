from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from app.database import get_db
from app.models.project import Project
from app.models.finance import Grant
from app.models.beneficiary import Beneficiary

router = APIRouter(prefix="/strategic", tags=["Strategic Dashboards"])


@router.get("/global-metrics")
def get_global_metrics(db: Session = Depends(get_db)):
    total_beneficiaries = db.query(func.count(Beneficiary.id)).scalar() or 0
    total_budget = db.query(func.sum(Project.budget)).scalar() or 0
    total_grants = db.query(func.sum(Grant.amount)).scalar() or 0
    active_projects = db.query(Project).filter(Project.status == "active").count()

    sector_counts = (
        db.query(Project.sector, func.count(Project.id))
        .group_by(Project.sector)
        .all()
    )
    total_projects = sum(c for _, c in sector_counts) or 1
    sector_distribution = [
        {"sector": s or "Other", "percentage": round(c / total_projects * 100)}
        for s, c in sector_counts
    ]

    return {
        "reach": total_beneficiaries,
        "funding_gap": max(0, total_budget - total_grants),
        "active_projects": active_projects,
        "sector_distribution": sector_distribution,
    }


@router.get("/ocha-3w-export")
def export_ocha_3w(db: Session = Depends(get_db)):
    projects = db.query(Project).all()
    return [
        {
            "organization": "HIAOS Organization",
            "project_title": p.name,
            "sector": p.sector,
            "location": p.governorate,
            "status": p.status,
            "start_date": str(p.start_date) if p.start_date else None,
            "end_date": str(p.end_date) if p.end_date else None,
            "budget": p.budget,
            "beneficiaries_target": p.target_beneficiaries if hasattr(p, "target_beneficiaries") else None,
        }
        for p in projects
    ]
