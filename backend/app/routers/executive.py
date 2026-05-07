from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import (
    Project, Beneficiary, Indicator, Measurement, Complaint,
    Risk, DataCollectionForm, FormSubmission, User
)
from app.auth import get_current_user

router = APIRouter(prefix="/executive", tags=["لوحة المعلومات التنفيذية"])


def _traffic_light(value, target):
    if target == 0:
        return "green"
    ratio = value / target
    if ratio >= 0.8:
        return "green"
    elif ratio >= 0.5:
        return "yellow"
    return "red"


@router.get("/dashboard")
def executive_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total_projects = db.query(Project).count()
    active_projects = db.query(Project).filter(Project.status == "active").count()
    completed_projects = db.query(Project).filter(Project.status == "completed").count()

    total_beneficiaries = db.query(Beneficiary).count()
    total_budget = db.query(func.sum(Project.budget)).scalar() or 0
    total_spent = db.query(func.sum(Project.spent)).scalar() or 0
    budget_util = round((total_spent / total_budget * 100) if total_budget > 0 else 0, 1)

    total_indicators = db.query(Indicator).count()
    total_forms = db.query(DataCollectionForm).count()
    total_submissions = db.query(FormSubmission).count()

    open_complaints = db.query(Complaint).filter(
        Complaint.status.in_(["received", "under_review", "in_progress"])
    ).count()
    critical_complaints = db.query(Complaint).filter(
        Complaint.priority == "critical",
        Complaint.status.in_(["received", "under_review"]),
    ).count()

    high_risks = db.query(Risk).filter(Risk.risk_score >= 12).count()
    total_risks = db.query(Risk).count()

    projects = db.query(Project).filter(Project.status == "active").all()
    project_kpis = []
    for p in projects:
        indicators = db.query(Indicator).filter(Indicator.project_id == p.id).all()
        achieved = sum(1 for i in indicators if i.actual_value >= i.target_value) if indicators else 0
        total_ind = len(indicators)
        ind_ratio = achieved / total_ind if total_ind > 0 else 0

        p_budget_util = round((p.spent / p.budget * 100) if p.budget > 0 else 0, 1)

        project_kpis.append({
            "id": p.id,
            "name": p.name,
            "status": p.status.value if p.status else "unknown",
            "budget": p.budget or 0,
            "spent": p.spent or 0,
            "budget_utilization": p_budget_util,
            "budget_light": _traffic_light(p.spent or 0, p.budget or 0),
            "indicators_total": total_ind,
            "indicators_achieved": achieved,
            "indicator_light": "green" if ind_ratio >= 0.8 else ("yellow" if ind_ratio >= 0.5 else "red"),
            "governorate": p.governorate,
            "sector": p.sector,
        })

    return {
        "summary": {
            "total_projects": total_projects,
            "active_projects": active_projects,
            "completed_projects": completed_projects,
            "total_beneficiaries": total_beneficiaries,
            "total_budget": total_budget,
            "total_spent": total_spent,
            "budget_utilization": budget_util,
            "budget_light": _traffic_light(total_spent, total_budget),
            "total_indicators": total_indicators,
            "total_forms": total_forms,
            "total_submissions": total_submissions,
            "open_complaints": open_complaints,
            "critical_complaints": critical_complaints,
            "complaint_light": "red" if critical_complaints > 0 else ("yellow" if open_complaints > 5 else "green"),
            "high_risks": high_risks,
            "total_risks": total_risks,
            "risk_light": "red" if high_risks > 3 else ("yellow" if high_risks > 0 else "green"),
        },
        "project_kpis": project_kpis,
    }
