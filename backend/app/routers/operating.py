from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import (
    Beneficiary,
    Complaint,
    DataQualityFinding,
    Indicator,
    IndicatorReference,
    OperatingAuditEvent,
    Project,
    Risk,
    User,
    WorkflowApproval,
)
from app.schemas import (
    DataQualityFindingCreate,
    DataQualityFindingOut,
    DataQualityFindingUpdate,
    IndicatorReferenceCreate,
    IndicatorReferenceOut,
    OperatingAuditEventCreate,
    OperatingAuditEventOut,
    WorkflowApprovalCreate,
    WorkflowApprovalDecision,
    WorkflowApprovalOut,
)

router = APIRouter(prefix="/operating", tags=["Humanitarian Operating System"])


def _status_from_score(score: float) -> str:
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
    has_corrective_action = 100
    if target > 0 and actual / target < 0.7:
        has_corrective_action = 100 if indicator.corrective_action else 25
    return round((progress * 0.35) + (documentation * 0.2) + (confidence * 0.2) + (has_source * 0.15) + (has_corrective_action * 0.1), 1)


def _log_event(db: Session, user_id: int, action: str, entity_type: str, entity_id: Optional[int], summary: str, sensitivity: str = "normal"):
    db.add(OperatingAuditEvent(
        actor_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        summary=summary,
        sensitivity=sensitivity,
    ))


@router.get("/watchtower")
def watchtower(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    indicators = db.query(Indicator).all()
    refs = {r.indicator_id: r for r in db.query(IndicatorReference).all()}

    indicator_cards = []
    critical_indicators = 0
    health_total = 0
    for indicator in indicators:
        score = _indicator_health(indicator, refs.get(indicator.id))
        status = _status_from_score(score)
        health_total += score
        if status == "critical":
            critical_indicators += 1
        indicator_cards.append({
            "id": indicator.id,
            "code": indicator.code,
            "name": indicator.name,
            "project_id": indicator.project_id,
            "target": indicator.target_value or 0,
            "actual": indicator.actual_value or 0,
            "health_score": score,
            "health_status": status,
            "deviation_explanation": indicator.deviation_explanation,
            "corrective_action": indicator.corrective_action,
        })

    open_dq = db.query(DataQualityFinding).filter(DataQualityFinding.status.in_(["open", "investigating"])).count()
    severe_dq = db.query(DataQualityFinding).filter(
        DataQualityFinding.status.in_(["open", "investigating"]),
        DataQualityFinding.severity.in_(["high", "critical"]),
    ).count()
    pending_approvals = db.query(WorkflowApproval).filter(WorkflowApproval.status == "pending").count()
    sensitive_open = db.query(Complaint).filter(
        Complaint.status.in_(["received", "under_review", "in_progress", "escalated"]),
        Complaint.is_sensitive == True,  # noqa: E712
    ).count()
    high_risks = db.query(Risk).filter(Risk.risk_score >= 12).count()
    active_projects = db.query(Project).filter(Project.status == "active").count()
    total_projects = db.query(Project).count()
    total_beneficiaries = db.query(Beneficiary).count()

    average_health = round(health_total / len(indicators), 1) if indicators else 0
    operating_score = max(0, round(
        average_health
        - (critical_indicators * 3)
        - (severe_dq * 4)
        - (sensitive_open * 5)
        - (high_risks * 3)
        - (pending_approvals * 1.5),
        1,
    ))

    projects = db.query(Project).all()
    at_risk_projects = []
    for project in projects:
        project_indicators = [i for i in indicator_cards if i["project_id"] == project.id]
        red_count = sum(1 for i in project_indicators if i["health_status"] == "critical")
        project_sensitive = db.query(Complaint).filter(
            Complaint.project_id == project.id,
            Complaint.is_sensitive == True,  # noqa: E712
            Complaint.status.in_(["received", "under_review", "in_progress", "escalated"]),
        ).count()
        project_dq = db.query(DataQualityFinding).filter(
            DataQualityFinding.project_id == project.id,
            DataQualityFinding.status.in_(["open", "investigating"]),
            DataQualityFinding.severity.in_(["high", "critical"]),
        ).count()
        if red_count or project_sensitive or project_dq:
            at_risk_projects.append({
                "id": project.id,
                "name": project.name,
                "sector": project.sector,
                "risk_reasons": {
                    "critical_indicators": red_count,
                    "sensitive_complaints": project_sensitive,
                    "severe_data_quality_findings": project_dq,
                },
                "risk_score": red_count * 3 + project_sensitive * 5 + project_dq * 4,
            })

    recent_events = db.query(OperatingAuditEvent).order_by(OperatingAuditEvent.created_at.desc()).limit(8).all()
    recent_findings = db.query(DataQualityFinding).order_by(DataQualityFinding.created_at.desc()).limit(8).all()
    pending_items = db.query(WorkflowApproval).filter(WorkflowApproval.status == "pending").order_by(WorkflowApproval.created_at.desc()).limit(8).all()

    return {
        "summary": {
            "operating_score": operating_score,
            "average_indicator_health": average_health,
            "critical_indicators": critical_indicators,
            "open_data_quality_findings": open_dq,
            "severe_data_quality_findings": severe_dq,
            "pending_approvals": pending_approvals,
            "sensitive_open_complaints": sensitive_open,
            "high_risks": high_risks,
            "active_projects": active_projects,
            "total_projects": total_projects,
            "total_beneficiaries": total_beneficiaries,
        },
        "indicator_cards": sorted(indicator_cards, key=lambda x: x["health_score"])[:10],
        "at_risk_projects": sorted(at_risk_projects, key=lambda x: x["risk_score"], reverse=True)[:10],
        "recent_findings": [DataQualityFindingOut.model_validate(f).model_dump(mode="json") for f in recent_findings],
        "pending_approvals": [WorkflowApprovalOut.model_validate(a).model_dump(mode="json") for a in pending_items],
        "recent_events": [OperatingAuditEventOut.model_validate(e).model_dump(mode="json") for e in recent_events],
    }


@router.get("/indicator-references", response_model=List[IndicatorReferenceOut])
def list_indicator_references(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(IndicatorReference).order_by(IndicatorReference.updated_at.desc()).all()


@router.post("/indicator-references", response_model=IndicatorReferenceOut)
def upsert_indicator_reference(
    data: IndicatorReferenceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    indicator = db.query(Indicator).filter(Indicator.id == data.indicator_id).first()
    if not indicator:
        raise HTTPException(status_code=404, detail="Indicator not found")

    ref = db.query(IndicatorReference).filter(IndicatorReference.indicator_id == data.indicator_id).first()
    if ref:
        for key, value in data.model_dump().items():
            setattr(ref, key, value)
    else:
        ref = IndicatorReference(**data.model_dump(), created_by=current_user.id)
        db.add(ref)

    ref.health_score = _indicator_health(indicator, ref)
    ref.health_status = _status_from_score(ref.health_score)
    ref.last_reviewed_at = datetime.utcnow()
    _log_event(db, current_user.id, "upsert", "indicator_reference", data.indicator_id, "Indicator reference sheet updated")
    db.commit()
    db.refresh(ref)
    return ref


@router.get("/data-quality-findings", response_model=List[DataQualityFindingOut])
def list_data_quality_findings(
    status: Optional[str] = None,
    project_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(DataQualityFinding)
    if status:
        query = query.filter(DataQualityFinding.status == status)
    if project_id:
        query = query.filter(DataQualityFinding.project_id == project_id)
    return query.order_by(DataQualityFinding.created_at.desc()).all()


@router.post("/data-quality-findings", response_model=DataQualityFindingOut)
def create_data_quality_finding(
    data: DataQualityFindingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    finding = DataQualityFinding(**data.model_dump(), created_by=current_user.id)
    db.add(finding)
    _log_event(db, current_user.id, "create", "data_quality_finding", None, data.title, data.severity)
    db.commit()
    db.refresh(finding)
    return finding


@router.put("/data-quality-findings/{finding_id}", response_model=DataQualityFindingOut)
def update_data_quality_finding(
    finding_id: int,
    data: DataQualityFindingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    finding = db.query(DataQualityFinding).filter(DataQualityFinding.id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Data quality finding not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(finding, key, value)
    if finding.status in ["resolved", "closed"] and not finding.resolved_at:
        finding.resolved_at = datetime.utcnow()
    _log_event(db, current_user.id, "update", "data_quality_finding", finding.id, "Data quality finding updated", finding.severity)
    db.commit()
    db.refresh(finding)
    return finding


@router.get("/approvals", response_model=List[WorkflowApprovalOut])
def list_approvals(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(WorkflowApproval)
    if status:
        query = query.filter(WorkflowApproval.status == status)
    return query.order_by(WorkflowApproval.created_at.desc()).all()


@router.post("/approvals", response_model=WorkflowApprovalOut)
def submit_approval(
    data: WorkflowApprovalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    approval = WorkflowApproval(**data.model_dump(), submitted_by=current_user.id, status="pending")
    db.add(approval)
    _log_event(db, current_user.id, "submit", data.entity_type, data.entity_id, "Entity submitted for approval")
    db.commit()
    db.refresh(approval)
    return approval


@router.put("/approvals/{approval_id}/decision", response_model=WorkflowApprovalOut)
def decide_approval(
    approval_id: int,
    data: WorkflowApprovalDecision,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if data.status not in ["approved", "rejected", "needs_revision"]:
        raise HTTPException(status_code=400, detail="Invalid approval decision")
    approval = db.query(WorkflowApproval).filter(WorkflowApproval.id == approval_id).first()
    if not approval:
        raise HTTPException(status_code=404, detail="Approval not found")
    approval.status = data.status
    approval.decision_notes = data.decision_notes
    approval.reviewed_by = current_user.id
    approval.reviewed_at = datetime.utcnow()
    _log_event(db, current_user.id, data.status, approval.entity_type, approval.entity_id, f"Approval decision: {data.status}")
    db.commit()
    db.refresh(approval)
    return approval


@router.get("/audit-events", response_model=List[OperatingAuditEventOut])
def list_operating_audit_events(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(OperatingAuditEvent).order_by(OperatingAuditEvent.created_at.desc()).limit(limit).all()


@router.post("/audit-events", response_model=OperatingAuditEventOut)
def create_operating_audit_event(
    data: OperatingAuditEventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    event = OperatingAuditEvent(**data.model_dump(), actor_id=current_user.id)
    db.add(event)
    db.commit()
    db.refresh(event)
    return event
