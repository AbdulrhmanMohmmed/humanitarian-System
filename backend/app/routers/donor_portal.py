from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

from app.database import get_db
from app.auth import get_current_user
from app.models import User
from app.models.donor_portal import (
    Proposal, ProposalStatus,
    FundingOpportunity, FundingStatus,
    DonorInstallment, InstallmentStatus,
    DonorVisit, VisitStatus,
    DonorCommunication,
)

router = APIRouter(prefix="/donor-portal", tags=["بوابة المانحين"])


# ── Schemas ──────────────────────────────────────────────────────────────────

class ProposalCreate(BaseModel):
    title: str
    code: Optional[str] = None
    sector: Optional[str] = None
    donor_id: Optional[int] = None
    budget_requested: float = 0
    duration_months: int = 12
    target_beneficiaries: int = 0
    governorate: Optional[str] = None
    summary: Optional[str] = None
    objectives: Optional[str] = "[]"
    outcomes: Optional[str] = "[]"
    outputs: Optional[str] = "[]"
    activities_json: Optional[str] = "[]"
    indicators_json: Optional[str] = "[]"
    budget_json: Optional[str] = "[]"
    logframe_json: Optional[str] = "{}"
    submission_deadline: Optional[datetime] = None


class ProposalUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None
    sector: Optional[str] = None
    donor_id: Optional[int] = None
    budget_requested: Optional[float] = None
    duration_months: Optional[int] = None
    target_beneficiaries: Optional[int] = None
    governorate: Optional[str] = None
    summary: Optional[str] = None
    objectives: Optional[str] = None
    outcomes: Optional[str] = None
    outputs: Optional[str] = None
    activities_json: Optional[str] = None
    indicators_json: Optional[str] = None
    budget_json: Optional[str] = None
    logframe_json: Optional[str] = None
    submission_deadline: Optional[datetime] = None
    rejection_reason: Optional[str] = None


class FundingCreate(BaseModel):
    title: str
    donor_name: Optional[str] = None
    donor_id: Optional[int] = None
    sector: Optional[str] = None
    subsector: Optional[str] = None
    description: Optional[str] = None
    eligibility: Optional[str] = None
    min_amount: Optional[float] = None
    max_amount: Optional[float] = None
    currency: str = "USD"
    countries: Optional[str] = "[]"
    closing_date: Optional[datetime] = None
    application_url: Optional[str] = None
    contact_email: Optional[str] = None
    is_featured: bool = False
    source: Optional[str] = None


class InstallmentCreate(BaseModel):
    grant_id: int
    donor_id: Optional[int] = None
    installment_number: int = 1
    amount: float
    currency: str = "USD"
    scheduled_date: datetime
    conditions: Optional[str] = None
    notes: Optional[str] = None


class VisitCreate(BaseModel):
    donor_id: Optional[int] = None
    project_id: Optional[int] = None
    title: str
    visit_date: datetime
    location: Optional[str] = None
    agenda: Optional[str] = None
    visitors: Optional[str] = "[]"


class CommunicationCreate(BaseModel):
    donor_id: Optional[int] = None
    grant_id: Optional[int] = None
    subject: str
    message: str
    direction: str = "outgoing"
    channel: str = "email"


# ── Proposals ────────────────────────────────────────────────────────────────

@router.get("/proposals")
def list_proposals(
    status: Optional[str] = None,
    sector: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Proposal)
    if status:
        q = q.filter(Proposal.status == status)
    if sector:
        q = q.filter(Proposal.sector == sector)
    if search:
        q = q.filter(Proposal.title.ilike(f"%{search}%"))
    items = q.order_by(desc(Proposal.updated_at)).all()
    return {"items": [_proposal_dict(p) for p in items], "total": len(items)}


@router.get("/proposals/stats")
def proposal_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total = db.query(Proposal).count()
    by_status = {}
    for st in ProposalStatus:
        count = db.query(Proposal).filter(Proposal.status == st).count()
        if count > 0:
            by_status[st.value] = count
    total_budget = db.query(func.coalesce(func.sum(Proposal.budget_requested), 0)).scalar()
    approved_budget = db.query(func.coalesce(func.sum(Proposal.budget_requested), 0)).filter(
        Proposal.status.in_([ProposalStatus.APPROVED, ProposalStatus.CONVERTED])
    ).scalar()
    return {
        "total": total,
        "by_status": by_status,
        "total_budget_requested": float(total_budget),
        "approved_budget": float(approved_budget),
        "success_rate": round(by_status.get("approved", 0) / max(total, 1) * 100, 1),
    }


@router.post("/proposals")
def create_proposal(
    body: ProposalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    code = body.code or f"PROP-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
    proposal = Proposal(
        title=body.title,
        code=code,
        sector=body.sector,
        donor_id=body.donor_id,
        budget_requested=body.budget_requested,
        duration_months=body.duration_months,
        target_beneficiaries=body.target_beneficiaries,
        governorate=body.governorate,
        summary=body.summary,
        objectives=body.objectives,
        outcomes=body.outcomes,
        outputs=body.outputs,
        activities_json=body.activities_json,
        indicators_json=body.indicators_json,
        budget_json=body.budget_json,
        logframe_json=body.logframe_json,
        submission_deadline=body.submission_deadline,
        created_by=current_user.id,
    )
    db.add(proposal)
    db.commit()
    db.refresh(proposal)
    return _proposal_dict(proposal)


@router.get("/proposals/{proposal_id}")
def get_proposal(
    proposal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    p = db.query(Proposal).filter(Proposal.id == proposal_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="المقترح غير موجود")
    return _proposal_dict(p)


@router.put("/proposals/{proposal_id}")
def update_proposal(
    proposal_id: int,
    body: ProposalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    p = db.query(Proposal).filter(Proposal.id == proposal_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="المقترح غير موجود")
    for field, value in body.model_dump(exclude_unset=True).items():
        if field == "status" and value:
            p.status = value
            if value == "submitted":
                p.submitted_at = datetime.utcnow()
            elif value == "approved":
                p.approved_at = datetime.utcnow()
        else:
            setattr(p, field, value)
    p.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(p)
    return _proposal_dict(p)


@router.delete("/proposals/{proposal_id}")
def delete_proposal(
    proposal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    p = db.query(Proposal).filter(Proposal.id == proposal_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="المقترح غير موجود")
    db.delete(p)
    db.commit()
    return {"message": "تم حذف المقترح"}


@router.post("/proposals/{proposal_id}/convert")
def convert_to_project(
    proposal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.models.project import Project
    p = db.query(Proposal).filter(Proposal.id == proposal_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="المقترح غير موجود")
    if p.status not in [ProposalStatus.APPROVED]:
        raise HTTPException(status_code=400, detail="يجب أن يكون المقترح معتمداً للتحويل")

    project = Project(
        name=p.title,
        code=p.code.replace("PROP", "PRJ"),
        status="planned",
        sector=p.sector,
        budget=p.budget_requested,
        target_beneficiaries=p.target_beneficiaries,
        governorate=p.governorate,
        description=p.summary,
    )
    db.add(project)
    p.status = ProposalStatus.CONVERTED
    p.project_id = project.id
    db.commit()
    db.refresh(project)
    return {"message": "تم تحويل المقترح إلى مشروع", "project_id": project.id}


# ── Funding Opportunities ────────────────────────────────────────────────────

@router.get("/funding")
def list_funding(
    status: Optional[str] = None,
    sector: Optional[str] = None,
    search: Optional[str] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(FundingOpportunity)
    if status:
        q = q.filter(FundingOpportunity.status == status)
    if sector:
        q = q.filter(FundingOpportunity.sector.ilike(f"%{sector}%"))
    if search:
        q = q.filter(FundingOpportunity.title.ilike(f"%{search}%"))
    if min_amount:
        q = q.filter(FundingOpportunity.max_amount >= min_amount)
    if max_amount:
        q = q.filter(FundingOpportunity.min_amount <= max_amount)
    items = q.order_by(desc(FundingOpportunity.closing_date)).all()
    return {"items": [_funding_dict(f) for f in items], "total": len(items)}


@router.get("/funding/stats")
def funding_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total = db.query(FundingOpportunity).count()
    open_count = db.query(FundingOpportunity).filter(FundingOpportunity.status == FundingStatus.OPEN).count()
    return {
        "total": total,
        "open": open_count,
        "closing_soon": db.query(FundingOpportunity).filter(FundingOpportunity.status == FundingStatus.CLOSING_SOON).count(),
        "closed": db.query(FundingOpportunity).filter(FundingOpportunity.status == FundingStatus.CLOSED).count(),
    }


@router.post("/funding")
def create_funding(
    body: FundingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    f = FundingOpportunity(**body.model_dump())
    db.add(f)
    db.commit()
    db.refresh(f)
    return _funding_dict(f)


@router.get("/funding/{funding_id}")
def get_funding(
    funding_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    f = db.query(FundingOpportunity).filter(FundingOpportunity.id == funding_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="فرصة التمويل غير موجودة")
    return _funding_dict(f)


@router.delete("/funding/{funding_id}")
def delete_funding(
    funding_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    f = db.query(FundingOpportunity).filter(FundingOpportunity.id == funding_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="فرصة التمويل غير موجودة")
    db.delete(f)
    db.commit()
    return {"message": "تم حذف فرصة التمويل"}


# ── Installments ─────────────────────────────────────────────────────────────

@router.get("/installments")
def list_installments(
    grant_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(DonorInstallment)
    if grant_id:
        q = q.filter(DonorInstallment.grant_id == grant_id)
    if status:
        q = q.filter(DonorInstallment.status == status)
    items = q.order_by(DonorInstallment.scheduled_date).all()
    return {"items": [_installment_dict(i) for i in items], "total": len(items)}


@router.post("/installments")
def create_installment(
    body: InstallmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    inst = DonorInstallment(**body.model_dump())
    db.add(inst)
    db.commit()
    db.refresh(inst)
    return _installment_dict(inst)


@router.put("/installments/{inst_id}/disburse")
def disburse_installment(
    inst_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    inst = db.query(DonorInstallment).filter(DonorInstallment.id == inst_id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="القسط غير موجود")
    inst.status = InstallmentStatus.DISBURSED
    inst.actual_date = datetime.utcnow()
    db.commit()
    return _installment_dict(inst)


# ── Donor Visits ─────────────────────────────────────────────────────────────

@router.get("/visits")
def list_visits(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(DonorVisit)
    if status:
        q = q.filter(DonorVisit.status == status)
    items = q.order_by(desc(DonorVisit.visit_date)).all()
    return {"items": [_visit_dict(v) for v in items], "total": len(items)}


@router.post("/visits")
def create_visit(
    body: VisitCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    v = DonorVisit(**body.model_dump(), created_by=current_user.id)
    db.add(v)
    db.commit()
    db.refresh(v)
    return _visit_dict(v)


@router.put("/visits/{visit_id}/complete")
def complete_visit(
    visit_id: int,
    findings: Optional[str] = None,
    recommendations_text: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    v = db.query(DonorVisit).filter(DonorVisit.id == visit_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="الزيارة غير موجودة")
    v.status = VisitStatus.COMPLETED
    if findings:
        v.findings = findings
    if recommendations_text:
        v.recommendations_text = recommendations_text
    db.commit()
    return _visit_dict(v)


# ── Communications ───────────────────────────────────────────────────────────

@router.get("/communications")
def list_communications(
    donor_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(DonorCommunication)
    if donor_id:
        q = q.filter(DonorCommunication.donor_id == donor_id)
    items = q.order_by(desc(DonorCommunication.sent_at)).all()
    return {"items": [_comm_dict(c) for c in items], "total": len(items)}


@router.post("/communications")
def create_communication(
    body: CommunicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    c = DonorCommunication(**body.model_dump(), sent_by=current_user.id)
    db.add(c)
    db.commit()
    db.refresh(c)
    return _comm_dict(c)


# ── Dashboard ────────────────────────────────────────────────────────────────

@router.get("/dashboard")
def donor_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.models.finance import Grant
    from app.models.project import Project

    total_grants = db.query(Grant).count()
    active_grants = db.query(Grant).filter(Grant.status == "active").count()
    total_projects = db.query(Project).count()
    active_projects = db.query(Project).filter(Project.status == "active").count()
    total_proposals = db.query(Proposal).count()
    pending_proposals = db.query(Proposal).filter(
        Proposal.status.in_(["draft", "submitted", "under_review"])
    ).count()
    total_installments = db.query(DonorInstallment).count()
    pending_installments = db.query(DonorInstallment).filter(
        DonorInstallment.status.in_([InstallmentStatus.SCHEDULED, InstallmentStatus.REQUESTED])
    ).count()
    upcoming_visits = db.query(DonorVisit).filter(
        DonorVisit.status.in_([VisitStatus.SCHEDULED, VisitStatus.CONFIRMED])
    ).count()

    return {
        "grants": {"total": total_grants, "active": active_grants},
        "projects": {"total": total_projects, "active": active_projects},
        "proposals": {"total": total_proposals, "pending": pending_proposals},
        "installments": {"total": total_installments, "pending": pending_installments},
        "upcoming_visits": upcoming_visits,
    }


# ── Helpers ──────────────────────────────────────────────────────────────────

def _proposal_dict(p: Proposal) -> dict:
    return {
        "id": p.id, "title": p.title, "code": p.code,
        "status": p.status.value if hasattr(p.status, 'value') else p.status,
        "sector": p.sector, "donor_id": p.donor_id, "project_id": p.project_id,
        "budget_requested": p.budget_requested, "duration_months": p.duration_months,
        "target_beneficiaries": p.target_beneficiaries, "governorate": p.governorate,
        "summary": p.summary,
        "objectives": p.objectives, "outcomes": p.outcomes, "outputs": p.outputs,
        "activities_json": p.activities_json, "indicators_json": p.indicators_json,
        "budget_json": p.budget_json, "logframe_json": p.logframe_json,
        "submission_deadline": str(p.submission_deadline) if p.submission_deadline else None,
        "submitted_at": str(p.submitted_at) if p.submitted_at else None,
        "approved_at": str(p.approved_at) if p.approved_at else None,
        "rejection_reason": p.rejection_reason,
        "created_at": str(p.created_at), "updated_at": str(p.updated_at),
    }


def _funding_dict(f: FundingOpportunity) -> dict:
    return {
        "id": f.id, "title": f.title, "donor_name": f.donor_name,
        "donor_id": f.donor_id, "sector": f.sector, "subsector": f.subsector,
        "description": f.description, "eligibility": f.eligibility,
        "min_amount": f.min_amount, "max_amount": f.max_amount,
        "currency": f.currency, "countries": f.countries,
        "closing_date": str(f.closing_date) if f.closing_date else None,
        "status": f.status.value if hasattr(f.status, 'value') else f.status,
        "application_url": f.application_url, "contact_email": f.contact_email,
        "is_featured": f.is_featured, "source": f.source,
        "created_at": str(f.created_at),
    }


def _installment_dict(i: DonorInstallment) -> dict:
    return {
        "id": i.id, "grant_id": i.grant_id, "donor_id": i.donor_id,
        "installment_number": i.installment_number, "amount": i.amount,
        "currency": i.currency,
        "scheduled_date": str(i.scheduled_date) if i.scheduled_date else None,
        "actual_date": str(i.actual_date) if i.actual_date else None,
        "status": i.status.value if hasattr(i.status, 'value') else i.status,
        "conditions": i.conditions, "notes": i.notes,
    }


def _visit_dict(v: DonorVisit) -> dict:
    return {
        "id": v.id, "donor_id": v.donor_id, "project_id": v.project_id,
        "title": v.title,
        "visit_date": str(v.visit_date) if v.visit_date else None,
        "location": v.location,
        "status": v.status.value if hasattr(v.status, 'value') else v.status,
        "agenda": v.agenda, "findings": v.findings,
        "recommendations_text": v.recommendations_text,
        "visitors": v.visitors,
    }


def _comm_dict(c: DonorCommunication) -> dict:
    return {
        "id": c.id, "donor_id": c.donor_id, "grant_id": c.grant_id,
        "subject": c.subject, "message": c.message,
        "direction": c.direction, "channel": c.channel,
        "sent_at": str(c.sent_at) if c.sent_at else None,
        "read_at": str(c.read_at) if c.read_at else None,
    }
