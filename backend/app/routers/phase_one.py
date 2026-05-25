from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import (
    Activity,
    Complaint,
    ComplaintPriority,
    ComplaintStatus,
    DataQualityFinding,
    Indicator,
    IndicatorReference,
    IPTTEntry,
    MEALPlan,
    OperatingAuditEvent,
    Project,
    Recommendation,
    Risk,
    User,
    WorkflowApproval,
)

router = APIRouter(prefix="/phase-one", tags=["Phase One Operating Core"])


class SmartIPTTEntry(BaseModel):
    indicator_id: int
    project_id: int
    year: int
    month: int
    target_value: float
    actual_value: float
    deviation_explanation: Optional[str] = None
    corrective_action: Optional[str] = None
    submit_for_approval: bool = True


class CFMDeadlinePolicy(BaseModel):
    low_hours: int = 168
    medium_hours: int = 120
    high_hours: int = 72
    critical_hours: int = 24


def _health_status(score: float) -> str:
    if score >= 80:
        return "healthy"
    if score >= 55:
        return "watch"
    return "critical"


def _indicator_health(indicator: Indicator, ref: Optional[IndicatorReference]) -> float:
    target = indicator.target_value or 0
    actual = indicator.actual_value or 0
    progress = 100 if target <= 0 else min((actual / target) * 100, 120)
    documentation = 100 if ref and ref.documentation_complete else 35
    confidence = ref.confidence_level if ref else 50
    has_source = 100 if (indicator.data_source or (ref and ref.verification_source)) else 40
    corrective = 100
    if target > 0 and actual / target < 0.7:
        corrective = 100 if indicator.corrective_action else 25
    return round((progress * 0.35) + (documentation * 0.2) + (confidence * 0.2) + (has_source * 0.15) + (corrective * 0.1), 1)


def _audit(db: Session, user_id: int, action: str, entity_type: str, entity_id: Optional[int], summary: str, sensitivity: str = "normal"):
    db.add(OperatingAuditEvent(
        actor_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        summary=summary,
        sensitivity=sensitivity,
    ))


def _priority_hours(priority, policy: CFMDeadlinePolicy) -> int:
    value = priority.value if hasattr(priority, "value") else str(priority or "medium")
    return {
        "low": policy.low_hours,
        "medium": policy.medium_hours,
        "high": policy.high_hours,
        "critical": policy.critical_hours,
    }.get(value, policy.medium_hours)


@router.get("/overview")
def phase_one_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    projects = db.query(Project).order_by(Project.created_at.desc()).all()
    indicator_refs = {r.indicator_id: r for r in db.query(IndicatorReference).all()}
    indicators = db.query(Indicator).all()
    health_scores = [_indicator_health(ind, indicator_refs.get(ind.id)) for ind in indicators]
    critical_indicators = sum(1 for score in health_scores if score < 55)
    pending_approvals = db.query(WorkflowApproval).filter(WorkflowApproval.status == "pending").count()
    open_findings = db.query(DataQualityFinding).filter(DataQualityFinding.status.in_(["open", "investigating"])).count()
    overdue_complaints = db.query(Complaint).filter(
        Complaint.response_deadline < datetime.now(timezone.utc),
        Complaint.status.in_([ComplaintStatus.RECEIVED, ComplaintStatus.UNDER_REVIEW, ComplaintStatus.IN_PROGRESS]),
    ).count()
    open_complaints = db.query(Complaint).filter(
        Complaint.status.in_([ComplaintStatus.RECEIVED, ComplaintStatus.UNDER_REVIEW, ComplaintStatus.IN_PROGRESS, ComplaintStatus.ESCALATED])
    ).count()

    project_cards = []
    for project in projects:
        project_indicators = [i for i in indicators if i.project_id == project.id]
        project_scores = [_indicator_health(ind, indicator_refs.get(ind.id)) for ind in project_indicators]
        project_findings = db.query(DataQualityFinding).filter(
            DataQualityFinding.project_id == project.id,
            DataQualityFinding.status.in_(["open", "investigating"]),
        ).count()
        project_complaints = db.query(Complaint).filter(
            Complaint.project_id == project.id,
            Complaint.status.in_([ComplaintStatus.RECEIVED, ComplaintStatus.UNDER_REVIEW, ComplaintStatus.IN_PROGRESS, ComplaintStatus.ESCALATED]),
        ).count()
        health = round(sum(project_scores) / len(project_scores), 1) if project_scores else 0
        risk_score = sum(1 for s in project_scores if s < 55) * 3 + project_findings * 2 + project_complaints
        project_cards.append({
            "id": project.id,
            "name": project.name,
            "sector": project.sector,
            "status": project.status.value if project.status else None,
            "budget": project.budget or 0,
            "spent": project.spent or 0,
            "indicator_health": health,
            "data_quality_findings": project_findings,
            "open_complaints": project_complaints,
            "risk_score": risk_score,
        })

    operating_score = max(0, round(
        (sum(health_scores) / len(health_scores) if health_scores else 50)
        - critical_indicators * 2
        - open_findings * 1.5
        - overdue_complaints * 4
        - pending_approvals,
        1,
    ))

    return {
        "summary": {
            "operating_score": operating_score,
            "projects": len(projects),
            "indicators": len(indicators),
            "critical_indicators": critical_indicators,
            "pending_approvals": pending_approvals,
            "open_data_quality_findings": open_findings,
            "open_complaints": open_complaints,
            "overdue_complaints": overdue_complaints,
        },
        "projects": sorted(project_cards, key=lambda p: p["risk_score"], reverse=True),
    }


@router.get("/projects/{project_id}/workspace")
def project_workspace(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    refs = {r.indicator_id: r for r in db.query(IndicatorReference).all()}
    indicators = db.query(Indicator).filter(Indicator.project_id == project_id).all()
    indicator_cards = []
    for indicator in indicators:
        score = _indicator_health(indicator, refs.get(indicator.id))
        latest = db.query(IPTTEntry).filter(IPTTEntry.indicator_id == indicator.id).order_by(IPTTEntry.year.desc(), IPTTEntry.month.desc()).first()
        indicator_cards.append({
            "id": indicator.id,
            "code": indicator.code,
            "name": indicator.name,
            "target": indicator.target_value or 0,
            "actual": indicator.actual_value or 0,
            "health_score": score,
            "health_status": _health_status(score),
            "latest_iptt": {
                "period": latest.period,
                "achievement_rate": latest.achievement_rate,
                "status_color": latest.status_color,
            } if latest else None,
        })

    return {
        "project": {
            "id": project.id,
            "code": project.code,
            "name": project.name,
            "sector": project.sector,
            "donor": project.donor,
            "status": project.status.value if project.status else None,
            "budget": project.budget or 0,
            "spent": project.spent or 0,
            "governorate": project.governorate,
            "district": project.district,
        },
        "activities": db.query(Activity).filter(Activity.project_id == project_id).count(),
        "meal_plans": db.query(MEALPlan).filter(MEALPlan.project_id == project_id).count(),
        "risks": db.query(Risk).filter(Risk.project_id == project_id).count(),
        "indicators": indicator_cards,
        "data_quality_findings": db.query(DataQualityFinding).filter(DataQualityFinding.project_id == project_id).count(),
        "complaints": db.query(Complaint).filter(Complaint.project_id == project_id).count(),
        "recommendations": db.query(Recommendation).filter(Recommendation.project_id == project_id).count(),
    }


@router.post("/iptt/smart-entry")
def create_smart_iptt_entry(
    data: SmartIPTTEntry,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    indicator = db.query(Indicator).filter(Indicator.id == data.indicator_id, Indicator.project_id == data.project_id).first()
    if not indicator:
        raise HTTPException(status_code=404, detail="Indicator not found")

    previous = db.query(IPTTEntry).filter(
        IPTTEntry.indicator_id == data.indicator_id,
        IPTTEntry.project_id == data.project_id,
        IPTTEntry.year == data.year,
        IPTTEntry.month < data.month,
    ).all()
    cumulative_target = sum(e.target_value for e in previous) + data.target_value
    cumulative_actual = sum(e.actual_value for e in previous) + data.actual_value
    achievement_rate = round(cumulative_actual / cumulative_target * 100, 1) if cumulative_target > 0 else 0

    if achievement_rate < 80 and (not data.deviation_explanation or not data.corrective_action):
        raise HTTPException(
            status_code=400,
            detail="Deviation explanation and corrective action are required when achievement is below 80%",
        )

    status_color = "green" if achievement_rate >= 80 else ("yellow" if achievement_rate >= 50 else "red")
    entry = IPTTEntry(
        indicator_id=data.indicator_id,
        project_id=data.project_id,
        period=f"{data.year}-{data.month:02d}",
        year=data.year,
        month=data.month,
        quarter=(data.month - 1) // 3 + 1,
        target_value=data.target_value,
        actual_value=data.actual_value,
        cumulative_target=cumulative_target,
        cumulative_actual=cumulative_actual,
        achievement_rate=achievement_rate,
        status_color=status_color,
        deviation_explanation=data.deviation_explanation,
        corrective_action=data.corrective_action,
        entered_by=current_user.id,
    )
    indicator.actual_value = cumulative_actual
    indicator.deviation_explanation = data.deviation_explanation
    indicator.corrective_action = data.corrective_action
    db.add(entry)
    db.flush()

    approval = None
    if data.submit_for_approval:
        approval = WorkflowApproval(
            entity_type="iptt_entry",
            entity_id=entry.id,
            project_id=data.project_id,
            status="pending",
            submitted_by=current_user.id,
            required_role="MEAL Officer",
        )
        db.add(approval)
    _audit(db, current_user.id, "smart_iptt_entry", "iptt_entry", entry.id, "Smart IPTT entry created and submitted for approval")
    db.commit()
    db.refresh(entry)
    return {
        "id": entry.id,
        "achievement_rate": achievement_rate,
        "status_color": status_color,
        "approval_required": bool(approval),
    }


@router.post("/projects/{project_id}/run-data-quality")
def run_data_quality_v1(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    created = 0
    indicators = db.query(Indicator).filter(Indicator.project_id == project_id).all()
    refs = {r.indicator_id: r for r in db.query(IndicatorReference).filter(IndicatorReference.indicator_id.in_([i.id for i in indicators] or [0])).all()}
    existing_open = {
        (f.source_type, f.source_id, f.finding_type)
        for f in db.query(DataQualityFinding).filter(DataQualityFinding.project_id == project_id, DataQualityFinding.status.in_(["open", "investigating"])).all()
    }

    for indicator in indicators:
        ref = refs.get(indicator.id)
        checks = []
        if not indicator.data_source and not (ref and ref.verification_source):
            checks.append(("missing_verification_source", "high", "مصدر التحقق غير مكتمل"))
        if not ref or not ref.documentation_complete:
            checks.append(("incomplete_indicator_reference", "medium", "بطاقة تعريف المؤشر غير مكتملة"))
        if indicator.target_value and indicator.actual_value / indicator.target_value < 0.5 and not indicator.corrective_action:
            checks.append(("low_progress_without_correction", "critical", "انخفاض تقدم المؤشر دون خطة تصحيح"))
        for finding_type, severity, title in checks:
            key = ("indicator", indicator.id, finding_type)
            if key in existing_open:
                continue
            db.add(DataQualityFinding(
                source_type="indicator",
                source_id=indicator.id,
                project_id=project_id,
                finding_type=finding_type,
                severity=severity,
                title=title,
                description=f"{indicator.code or indicator.id}: {indicator.name}",
                score_impact=10 if severity == "critical" else 5,
                created_by=current_user.id,
            ))
            created += 1

    red_entries = db.query(IPTTEntry).filter(IPTTEntry.project_id == project_id, IPTTEntry.status_color == "red").all()
    for entry in red_entries:
        if entry.deviation_explanation and entry.corrective_action:
            continue
        key = ("iptt_entry", entry.id, "red_iptt_missing_controls")
        if key in existing_open:
            continue
        db.add(DataQualityFinding(
            source_type="iptt_entry",
            source_id=entry.id,
            project_id=project_id,
            finding_type="red_iptt_missing_controls",
            severity="critical",
            title="إدخال IPTT أحمر دون ضوابط كافية",
            description=f"Period {entry.period} achievement {entry.achievement_rate}%",
            score_impact=12,
            created_by=current_user.id,
        ))
        created += 1

    _audit(db, current_user.id, "run_data_quality_v1", "project", project_id, f"Data quality rules executed, created {created} findings")
    db.commit()
    return {"project_id": project_id, "created_findings": created, "checked_indicators": len(indicators)}


@router.post("/cfm/apply-sla")
def apply_cfm_sla(
    policy: CFMDeadlinePolicy,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    complaints = db.query(Complaint).filter(Complaint.response_deadline.is_(None)).all()
    updated = 0
    for complaint in complaints:
        base = complaint.created_at or datetime.now(timezone.utc)
        complaint.response_deadline = base + timedelta(hours=_priority_hours(complaint.priority, policy))
        updated += 1
    _audit(db, current_user.id, "apply_cfm_sla", "complaint", None, f"SLA deadlines applied to {updated} complaints")
    db.commit()
    return {"updated_complaints": updated}
