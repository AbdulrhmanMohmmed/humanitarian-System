from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import datetime, timezone
import json
from app.database import get_db
from app.models import User, PhoneSurvey, ThirdPartyCheck
from app.auth import get_current_user

router = APIRouter(prefix="/remote-monitoring", tags=["Remote Monitoring"])


@router.post("/phone-survey")
def create_phone_survey(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a phone-based survey for hard-to-reach areas"""
    survey = PhoneSurvey(
        title=data.get("title"),
        project_id=data.get("project_id"),
        beneficiary_id=data.get("beneficiary_id"),
        phone_number=data.get("phone_number"),
        governorate=data.get("governorate"),
        district=data.get("district"),
        survey_type=data.get("survey_type", "pdm"),
        questions=json.dumps(data.get("questions", []), ensure_ascii=False),
        responses=json.dumps(data.get("responses", {}), ensure_ascii=False),
        status=data.get("status", "scheduled"),
        interviewer=current_user.full_name,
        call_duration_minutes=data.get("call_duration_minutes"),
        call_quality=data.get("call_quality"),
        notes=data.get("notes"),
        consent_given=data.get("consent_given", False),
        created_by=current_user.id,
    )
    db.add(survey)
    db.commit()
    db.refresh(survey)
    return _survey_dict(survey)


@router.get("/phone-surveys")
def list_phone_surveys(
    project_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List phone surveys"""
    q = db.query(PhoneSurvey)
    if project_id:
        q = q.filter(PhoneSurvey.project_id == project_id)
    if status:
        q = q.filter(PhoneSurvey.status == status)
    return [_survey_dict(s) for s in q.order_by(PhoneSurvey.created_at.desc()).all()]


@router.put("/phone-survey/{survey_id}")
def update_phone_survey(
    survey_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update phone survey with responses"""
    survey = db.query(PhoneSurvey).filter(PhoneSurvey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="المسح غير موجود")

    for key in ["title", "phone_number", "governorate", "district", "survey_type",
                "call_duration_minutes", "call_quality", "notes", "consent_given"]:
        if key in data:
            setattr(survey, key, data[key])

    if "questions" in data:
        survey.questions = json.dumps(data["questions"], ensure_ascii=False)
    if "responses" in data:
        survey.responses = json.dumps(data["responses"], ensure_ascii=False)
    if "status" in data:
        survey.status = data["status"]
        if data["status"] == "completed":
            survey.completed_date = datetime.now(timezone.utc)

    db.commit()
    db.refresh(survey)
    return _survey_dict(survey)


@router.post("/third-party-check")
def create_third_party_check(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a third-party monitoring check for high-risk areas"""
    check = ThirdPartyCheck(
        project_id=data.get("project_id"),
        location=data.get("location"),
        governorate=data.get("governorate"),
        check_type=data.get("check_type", "verification"),
        third_party_name=data.get("third_party_name"),
        methodology=data.get("methodology"),
        findings=data.get("findings"),
        photos=json.dumps(data.get("photos", []), ensure_ascii=False),
        gps_coordinates=data.get("gps_coordinates"),
        risk_level=data.get("risk_level", "high"),
        access_constraints=data.get("access_constraints"),
        created_by=current_user.id,
    )
    db.add(check)
    db.commit()
    db.refresh(check)
    return _check_dict(check)


@router.get("/third-party-checks")
def list_third_party_checks(
    project_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(ThirdPartyCheck)
    if project_id:
        q = q.filter(ThirdPartyCheck.project_id == project_id)
    return [_check_dict(c) for c in q.order_by(ThirdPartyCheck.created_at.desc()).all()]


@router.get("/dashboard")
def remote_monitoring_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Dashboard for remote monitoring activities"""
    total_surveys = db.query(func.count(PhoneSurvey.id)).scalar() or 0
    completed_surveys = db.query(func.count(PhoneSurvey.id)).filter(PhoneSurvey.status == "completed").scalar() or 0
    scheduled_surveys = db.query(func.count(PhoneSurvey.id)).filter(PhoneSurvey.status == "scheduled").scalar() or 0

    total_checks = db.query(func.count(ThirdPartyCheck.id)).scalar() or 0
    completed_checks = db.query(func.count(ThirdPartyCheck.id)).filter(ThirdPartyCheck.status == "completed").scalar() or 0
    pending_checks = db.query(func.count(ThirdPartyCheck.id)).filter(ThirdPartyCheck.status == "pending").scalar() or 0

    return {
        "phone_surveys": {
            "total": total_surveys,
            "completed": completed_surveys,
            "scheduled": scheduled_surveys,
        },
        "third_party_checks": {
            "total": total_checks,
            "completed": completed_checks,
            "pending": pending_checks,
        },
        "methods": [
            {"method": "phone_survey", "name": "مسح هاتفي", "description": "مقابلات هاتفية مع المستفيدين"},
            {"method": "third_party", "name": "طرف ثالث", "description": "مراقبة عبر أطراف ثالثة موثوقة"},
            {"method": "sms_verification", "name": "تحقق SMS", "description": "رسائل تأكيد استلام المساعدات"},
            {"method": "satellite", "name": "أقمار صناعية", "description": "صور فضائية لتتبع التقدم"},
        ],
    }


def _survey_dict(s: PhoneSurvey) -> dict:
    return {
        "id": s.id,
        "title": s.title,
        "project_id": s.project_id,
        "beneficiary_id": s.beneficiary_id,
        "phone_number": s.phone_number,
        "governorate": s.governorate,
        "district": s.district,
        "survey_type": s.survey_type,
        "questions": json.loads(s.questions) if s.questions else [],
        "responses": json.loads(s.responses) if s.responses else {},
        "status": s.status,
        "scheduled_date": s.scheduled_date.isoformat() if s.scheduled_date else None,
        "completed_date": s.completed_date.isoformat() if s.completed_date else None,
        "interviewer": s.interviewer,
        "call_duration_minutes": s.call_duration_minutes,
        "call_quality": s.call_quality,
        "notes": s.notes,
        "consent_given": s.consent_given,
        "created_at": s.created_at.isoformat() if s.created_at else None,
    }


def _check_dict(c: ThirdPartyCheck) -> dict:
    return {
        "id": c.id,
        "project_id": c.project_id,
        "location": c.location,
        "governorate": c.governorate,
        "check_type": c.check_type,
        "third_party_name": c.third_party_name,
        "methodology": c.methodology,
        "findings": c.findings,
        "photos": json.loads(c.photos) if c.photos else [],
        "gps_coordinates": c.gps_coordinates,
        "status": c.status,
        "risk_level": c.risk_level,
        "access_constraints": c.access_constraints,
        "created_at": c.created_at.isoformat() if c.created_at else None,
    }
