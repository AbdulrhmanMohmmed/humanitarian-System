from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
from datetime import datetime, timedelta
from app.database import get_db
from app.models import User, Project, Indicator, Complaint, ComplaintStatus, Recommendation, RecommendationStatus, Risk, IPTTEntry, FieldVisit
from app.auth import get_current_user

router = APIRouter(prefix="/api/scheduled-reports", tags=["Scheduled Reports"])

REPORT_SCHEDULES = []


@router.post("/schedule")
def create_schedule(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a scheduled report"""
    schedule = {
        "id": len(REPORT_SCHEDULES) + 1,
        "project_id": data.get("project_id"),
        "report_type": data.get("report_type", "monthly_meal"),
        "frequency": data.get("frequency", "monthly"),
        "recipients": data.get("recipients", []),
        "format": data.get("format", "excel"),
        "day_of_month": data.get("day_of_month", 1),
        "day_of_week": data.get("day_of_week"),
        "is_active": True,
        "last_run": None,
        "next_run": None,
        "created_by": current_user.id,
        "created_at": datetime.utcnow().isoformat(),
    }

    if schedule["frequency"] == "weekly":
        today = datetime.utcnow()
        days_ahead = (schedule.get("day_of_week", 0) - today.weekday()) % 7
        schedule["next_run"] = (today + timedelta(days=days_ahead or 7)).strftime("%Y-%m-%d")
    elif schedule["frequency"] == "monthly":
        today = datetime.utcnow()
        if today.day <= schedule["day_of_month"]:
            schedule["next_run"] = today.replace(day=schedule["day_of_month"]).strftime("%Y-%m-%d")
        else:
            month = today.month + 1 if today.month < 12 else 1
            year = today.year if today.month < 12 else today.year + 1
            schedule["next_run"] = datetime(year, month, schedule["day_of_month"]).strftime("%Y-%m-%d")

    REPORT_SCHEDULES.append(schedule)
    return schedule


@router.get("/schedules")
def list_schedules(current_user: User = Depends(get_current_user)):
    """List all report schedules"""
    return REPORT_SCHEDULES


@router.delete("/schedule/{schedule_id}")
def delete_schedule(schedule_id: int, current_user: User = Depends(get_current_user)):
    """Delete a schedule"""
    global REPORT_SCHEDULES
    REPORT_SCHEDULES = [s for s in REPORT_SCHEDULES if s["id"] != schedule_id]
    return {"status": "deleted"}


@router.get("/available-types")
def get_report_types(current_user: User = Depends(get_current_user)):
    """List available report types for scheduling"""
    return [
        {"key": "monthly_meal", "name": "تقرير MEAL الشهري", "description": "ملخص شامل لجميع أنشطة المتابعة والتقييم"},
        {"key": "iptt", "name": "تقرير IPTT", "description": "تتبع أداء المؤشرات"},
        {"key": "cfm", "name": "تقرير الشكاوى CFM", "description": "تحليل الشكاوى والتغذية الراجعة"},
        {"key": "compliance", "name": "تقرير الامتثال", "description": "تقييم الالتزام بالمعايير"},
        {"key": "field_visits", "name": "تقرير الزيارات الميدانية", "description": "ملخص الزيارات والتوصيات"},
        {"key": "risk_register", "name": "سجل المخاطر", "description": "تحديث المخاطر والتخفيف"},
        {"key": "donor_5w", "name": "تقرير 5W للمانح", "description": "من، ماذا، أين، متى، لمن"},
        {"key": "executive_summary", "name": "الملخص التنفيذي", "description": "ملخص للإدارة العليا"},
    ]


@router.get("/generate-infographic/{project_id}")
def generate_infographic_data(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate data for infographic poster"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="المشروع غير موجود")

    indicators = db.query(Indicator).filter(Indicator.project_id == project_id).all()
    complaints = db.query(Complaint).filter(Complaint.project_id == project_id).all()
    visits = db.query(FieldVisit).filter(FieldVisit.project_id == project_id).all()

    total_target = sum(i.target_value or 0 for i in indicators)
    total_actual = sum(i.current_value or 0 for i in indicators)

    return {
        "project": {
            "name": project.name,
            "sector": project.sector,
            "status": project.status.value if project.status else None,
            "period": f"{project.start_date} - {project.end_date}",
            "donor": project.donor,
        },
        "headline_numbers": {
            "total_beneficiaries": project.actual_beneficiaries or 0,
            "target_beneficiaries": project.target_beneficiaries or 0,
            "total_indicators": len(indicators),
            "budget": project.budget or 0,
            "spent": project.spent or 0,
        },
        "performance": {
            "overall_achievement": round(total_actual / total_target * 100, 1) if total_target else 0,
            "on_track": sum(1 for i in indicators if i.target_value and i.current_value and i.current_value / i.target_value >= 0.8),
            "at_risk": sum(1 for i in indicators if i.target_value and i.current_value and 0.5 <= i.current_value / i.target_value < 0.8),
            "off_track": sum(1 for i in indicators if i.target_value and i.current_value and i.current_value / i.target_value < 0.5),
        },
        "accountability": {
            "total_complaints": len(complaints),
            "resolved": sum(1 for c in complaints if c.status == ComplaintStatus.RESOLVED),
            "resolution_rate": round(sum(1 for c in complaints if c.status == ComplaintStatus.RESOLVED) / len(complaints) * 100, 1) if complaints else 0,
        },
        "monitoring": {
            "field_visits": len(visits),
        },
        "colors": {
            "primary": "#1a73e8",
            "success": "#34a853",
            "warning": "#fbbc04",
            "danger": "#ea4335",
            "background": "#f8f9fa",
        },
    }
