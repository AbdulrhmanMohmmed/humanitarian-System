"""Service layer for financial approval workflows (maker-checker)."""

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.orm import Session

from app.middleware.error_handler import ForbiddenError, NotFoundError
from app.models.approval import (
    ApprovalEntityType,
    ApprovalRequest,
    ApprovalRule,
    ApprovalStatus,
    ApprovalStep,
)


def get_required_levels(
    db: Session, entity_type: ApprovalEntityType, amount: float,
) -> int:
    """Determine required approval levels based on configurable rules."""
    rule = (
        db.query(ApprovalRule)
        .filter(
            ApprovalRule.entity_type == entity_type,
            ApprovalRule.is_active == 1,
            ApprovalRule.min_amount <= amount,
        )
        .order_by(ApprovalRule.min_amount.desc())
        .first()
    )
    if rule and (rule.max_amount is None or amount <= rule.max_amount):
        return rule.required_levels
    return 1


def create_approval_request(
    db: Session,
    *,
    entity_type: ApprovalEntityType,
    entity_id: int,
    amount: float,
    currency: str,
    description: str,
    requester_id: int,
    approver_ids: list[int],
) -> ApprovalRequest:
    """Create a new approval request with approval steps."""
    required_levels = get_required_levels(db, entity_type, amount)

    req = ApprovalRequest(
        entity_type=entity_type,
        entity_id=entity_id,
        amount=amount,
        currency=currency,
        description=description,
        status=ApprovalStatus.PENDING,
        required_level=required_levels,
        current_level=0,
        requester_id=requester_id,
    )
    db.add(req)
    db.flush()

    for level, approver_id in enumerate(approver_ids[:required_levels], start=1):
        step = ApprovalStep(
            request_id=req.id,
            level=level,
            approver_id=approver_id,
            status=ApprovalStatus.PENDING,
        )
        db.add(step)

    db.commit()
    db.refresh(req)
    return req


def process_approval(
    db: Session,
    request_id: int,
    approver_id: int,
    approved: bool,
    comment: Optional[str] = None,
) -> ApprovalRequest:
    """Process an approval step (approve or reject)."""
    req = db.query(ApprovalRequest).filter(ApprovalRequest.id == request_id).first()
    if not req:
        raise NotFoundError("ApprovalRequest", request_id)
    if req.status != ApprovalStatus.PENDING:
        raise ForbiddenError(f"Request already {req.status.value}")

    next_level = req.current_level + 1
    step = (
        db.query(ApprovalStep)
        .filter(
            ApprovalStep.request_id == request_id,
            ApprovalStep.level == next_level,
        )
        .first()
    )
    if not step:
        raise NotFoundError("ApprovalStep", f"level {next_level}")
    if step.approver_id != approver_id:
        raise ForbiddenError("You are not the designated approver for this level")

    step.status = ApprovalStatus.APPROVED if approved else ApprovalStatus.REJECTED
    step.comment = comment
    step.decided_at = datetime.now(timezone.utc)

    if not approved:
        req.status = ApprovalStatus.REJECTED
    else:
        req.current_level = next_level
        if next_level >= req.required_level:
            req.status = ApprovalStatus.APPROVED

    req.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(req)
    return req


def list_pending_approvals(
    db: Session, approver_id: int,
) -> list[ApprovalRequest]:
    """List all pending approval requests assigned to a specific approver."""
    pending_step_ids = (
        db.query(ApprovalStep.request_id)
        .filter(
            ApprovalStep.approver_id == approver_id,
            ApprovalStep.status == ApprovalStatus.PENDING,
        )
        .subquery()
    )
    return (
        db.query(ApprovalRequest)
        .filter(
            ApprovalRequest.id.in_(pending_step_ids),
            ApprovalRequest.status == ApprovalStatus.PENDING,
        )
        .all()
    )
