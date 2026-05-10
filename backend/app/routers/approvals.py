"""Financial approval workflow endpoints (maker-checker pattern)."""

from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import User
from app.models.approval import ApprovalEntityType
from app.services import approval_service as svc

router = APIRouter(prefix="/approvals", tags=["Approval Workflow"])


class CreateApprovalRequest(BaseModel):
    entity_type: ApprovalEntityType
    entity_id: int
    amount: float
    currency: str = "USD"
    description: str
    approver_ids: list[int]


class ProcessApprovalRequest(BaseModel):
    approved: bool
    comment: Optional[str] = None


@router.post("/")
def create_approval(
    body: CreateApprovalRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return svc.create_approval_request(
        db,
        entity_type=body.entity_type,
        entity_id=body.entity_id,
        amount=body.amount,
        currency=body.currency,
        description=body.description,
        requester_id=current_user.id,
        approver_ids=body.approver_ids,
    )


@router.get("/pending")
def pending_approvals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return svc.list_pending_approvals(db, current_user.id)


@router.post("/{request_id}/decide")
def decide_approval(
    request_id: int,
    body: ProcessApprovalRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return svc.process_approval(
        db, request_id, current_user.id, body.approved, body.comment,
    )
