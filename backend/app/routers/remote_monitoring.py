from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime, timezone
from app.database import get_db
from app.models import User
from app.auth import get_current_user

router = APIRouter(prefix="/remote-monitoring", tags=["Remote Monitoring"])

PHONE_SURVEYS = []
REMOTE_CHECKS = []


@router.post("/phone-survey")
def create_phone_survey(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a phone-based survey for hard-to-reach areas"""
    survey = {
        "id": len(PHONE_SURVEYS) + 1,
        "title": data.get("title"),
        "project_id": data.get("project_id"),
        "beneficiary_id": data.get("beneficiary_id"),
        "phone_number": data.get("phone_number"),
        "governorate": data.get("governorate"),
        "district": data.get("district"),
        "survey_type": data.get("survey_type", "pdm"),
        "questions": data.get("questions", []),
        "responses": data.get("responses", {}),
        "status": data.get("status", "scheduled"),
        "scheduled_date": data.get("scheduled_date"),
        "completed_date": None,
        "interviewer": current_user.full_name,
        "call_duration_minutes": data.get("call_duration_minutes"),
        "call_quality": data.get("call_quality"),
        "notes": data.get("notes"),
        "consent_given": data.get("consent_given", False),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    PHONE_SURVEYS.append(survey)
    return survey


@router.get("/phone-surveys")
def list_phone_surveys(
    project_id: Optional[int] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
):
    """List phone surveys"""
    result = PHONE_SURVEYS
    if project_id:
        result = [s for s in result if s.get("project_id") == project_id]
    if status:
        result = [s for s in result if s.get("status") == status]
    return result


@router.put("/phone-survey/{survey_id}")
def update_phone_survey(
    survey_id: int,
    data: dict,
    current_user: User = Depends(get_current_user),
):
    """Update phone survey with responses"""
    for s in PHONE_SURVEYS:
        if s["id"] == survey_id:
            s.update({k: v for k, v in data.items() if k != "id"})
            if data.get("status") == "completed":
                s["completed_date"] = datetime.now(timezone.utc).isoformat()
            return s
    raise HTTPException(status_code=404, detail="المسح غير موجود")


@router.post("/third-party-check")
def create_third_party_check(
    data: dict,
    current_user: User = Depends(get_current_user),
):
    """Create a third-party monitoring check for high-risk areas"""
    check = {
        "id": len(REMOTE_CHECKS) + 1,
        "project_id": data.get("project_id"),
        "location": data.get("location"),
        "governorate": data.get("governorate"),
        "check_type": data.get("check_type", "verification"),
        "third_party_name": data.get("third_party_name"),
        "methodology": data.get("methodology"),
        "findings": data.get("findings"),
        "photos": data.get("photos", []),
        "gps_coordinates": data.get("gps_coordinates"),
        "status": "pending",
        "risk_level": data.get("risk_level", "high"),
        "access_constraints": data.get("access_constraints"),
        "created_by": current_user.id,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    REMOTE_CHECKS.append(check)
    return check


@router.get("/third-party-checks")
def list_third_party_checks(
    project_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
):
    result = REMOTE_CHECKS
    if project_id:
        result = [c for c in result if c.get("project_id") == project_id]
    return result


@router.get("/dashboard")
def remote_monitoring_dashboard(
    current_user: User = Depends(get_current_user),
):
    """Dashboard for remote monitoring activities"""
    return {
        "phone_surveys": {
            "total": len(PHONE_SURVEYS),
            "completed": sum(1 for s in PHONE_SURVEYS if s.get("status") == "completed"),
            "scheduled": sum(1 for s in PHONE_SURVEYS if s.get("status") == "scheduled"),
            "by_type": {},
        },
        "third_party_checks": {
            "total": len(REMOTE_CHECKS),
            "completed": sum(1 for c in REMOTE_CHECKS if c.get("status") == "completed"),
            "pending": sum(1 for c in REMOTE_CHECKS if c.get("status") == "pending"),
        },
        "methods": [
            {"method": "phone_survey", "name": "مسح هاتفي", "description": "مقابلات هاتفية مع المستفيدين"},
            {"method": "third_party", "name": "طرف ثالث", "description": "مراقبة عبر أطراف ثالثة موثوقة"},
            {"method": "sms_verification", "name": "تحقق SMS", "description": "رسائل تأكيد استلام المساعدات"},
            {"method": "satellite_imagery", "name": "صور أقمار صناعية", "description": "مراقبة المواقع عبر صور الأقمار"},
            {"method": "community_reporter", "name": "مراسل مجتمعي", "description": "متطوعين محليين للرصد والإبلاغ"},
        ],
    }
