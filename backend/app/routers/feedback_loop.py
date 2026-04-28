from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import datetime
from app.database import get_db
from app.models import User, Complaint, ComplaintStatus, Project
from app.auth import get_current_user

router = APIRouter(prefix="/api/feedback-loop", tags=["Beneficiary Feedback Loop"])

FEEDBACK_ACTIONS = []
COMMUNITY_SESSIONS = []


@router.post("/action")
def create_feedback_action(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create action taken based on beneficiary feedback"""
    action = {
        "id": len(FEEDBACK_ACTIONS) + 1,
        "complaint_id": data.get("complaint_id"),
        "project_id": data.get("project_id"),
        "feedback_summary": data.get("feedback_summary"),
        "action_taken": data.get("action_taken"),
        "change_made": data.get("change_made"),
        "communicated_to_community": data.get("communicated_to_community", False),
        "communication_method": data.get("communication_method"),
        "communication_date": data.get("communication_date"),
        "impact_description": data.get("impact_description"),
        "status": "open",
        "created_by": current_user.id,
        "created_at": datetime.utcnow().isoformat(),
    }
    FEEDBACK_ACTIONS.append(action)
    return action


@router.get("/actions")
def list_feedback_actions(
    project_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
):
    result = FEEDBACK_ACTIONS
    if project_id:
        result = [a for a in result if a.get("project_id") == project_id]
    return result


@router.put("/action/{action_id}")
def update_feedback_action(
    action_id: int,
    data: dict,
    current_user: User = Depends(get_current_user),
):
    for a in FEEDBACK_ACTIONS:
        if a["id"] == action_id:
            a.update({k: v for k, v in data.items() if k != "id"})
            return a
    raise HTTPException(status_code=404, detail="الإجراء غير موجود")


@router.post("/community-session")
def create_community_session(
    data: dict,
    current_user: User = Depends(get_current_user),
):
    """Record a community feedback/accountability session"""
    session = {
        "id": len(COMMUNITY_SESSIONS) + 1,
        "project_id": data.get("project_id"),
        "session_type": data.get("session_type", "feedback"),
        "location": data.get("location"),
        "governorate": data.get("governorate"),
        "district": data.get("district"),
        "date": data.get("date"),
        "participants_count": data.get("participants_count", 0),
        "male_participants": data.get("male_participants", 0),
        "female_participants": data.get("female_participants", 0),
        "topics_discussed": data.get("topics_discussed", []),
        "key_feedback": data.get("key_feedback", []),
        "actions_agreed": data.get("actions_agreed", []),
        "follow_up_date": data.get("follow_up_date"),
        "facilitator": current_user.full_name,
        "photos": data.get("photos", []),
        "notes": data.get("notes"),
        "created_at": datetime.utcnow().isoformat(),
    }
    COMMUNITY_SESSIONS.append(session)
    return session


@router.get("/community-sessions")
def list_community_sessions(
    project_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
):
    result = COMMUNITY_SESSIONS
    if project_id:
        result = [s for s in result if s.get("project_id") == project_id]
    return result


@router.get("/dashboard/{project_id}")
def feedback_loop_dashboard(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Closed feedback loop dashboard - shows how feedback led to changes"""
    complaints = db.query(Complaint).filter(Complaint.project_id == project_id).all()
    project_actions = [a for a in FEEDBACK_ACTIONS if a.get("project_id") == project_id]
    project_sessions = [s for s in COMMUNITY_SESSIONS if s.get("project_id") == project_id]

    communicated = sum(1 for a in project_actions if a.get("communicated_to_community"))

    return {
        "feedback_received": len(complaints),
        "actions_taken": len(project_actions),
        "communicated_back": communicated,
        "community_sessions": len(project_sessions),
        "loop_closure_rate": round(communicated / len(project_actions) * 100, 1) if project_actions else 0,
        "total_participants": sum(s.get("participants_count", 0) for s in project_sessions),
        "feedback_channels": {
            "complaints": len(complaints),
            "community_sessions": len(project_sessions),
            "phone_surveys": 0,
        },
        "loop_stages": [
            {"stage": "استقبال الملاحظات", "count": len(complaints), "status": "active"},
            {"stage": "تحليل الملاحظات", "count": len(complaints), "status": "active"},
            {"stage": "اتخاذ إجراء", "count": len(project_actions), "status": "active" if project_actions else "pending"},
            {"stage": "إبلاغ المجتمع", "count": communicated, "status": "active" if communicated else "pending"},
            {"stage": "متابعة التأثير", "count": sum(1 for a in project_actions if a.get("impact_description")), "status": "active"},
        ],
    }
