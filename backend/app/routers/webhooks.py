"""Webhook management endpoints."""

from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.middleware.error_handler import NotFoundError
from app.models import User
from app.models.webhook import Webhook, WebhookDelivery
from app.services import webhook_service as svc

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])


class WebhookCreate(BaseModel):
    name: str
    url: str
    type: str = "custom"
    secret: Optional[str] = None
    events: str = "*"


class WebhookUpdate(BaseModel):
    name: Optional[str] = None
    url: Optional[str] = None
    events: Optional[str] = None
    is_active: Optional[int] = None


@router.get("/")
def list_webhooks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return svc.list_webhooks(db, active_only=False)


@router.post("/")
def create_webhook(
    body: WebhookCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return svc.create_webhook(
        db, name=body.name, url=body.url, webhook_type=body.type,
        secret=body.secret, events=body.events, created_by=current_user.id,
    )


@router.put("/{webhook_id}")
def update_webhook(
    webhook_id: int,
    body: WebhookUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    wh = db.query(Webhook).filter(Webhook.id == webhook_id).first()
    if not wh:
        raise NotFoundError("Webhook", webhook_id)
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(wh, key, value)
    db.commit()
    db.refresh(wh)
    return wh


@router.delete("/{webhook_id}")
def delete_webhook(
    webhook_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    wh = db.query(Webhook).filter(Webhook.id == webhook_id).first()
    if not wh:
        raise NotFoundError("Webhook", webhook_id)
    db.delete(wh)
    db.commit()
    return {"message": "Webhook deleted"}


@router.get("/{webhook_id}/deliveries")
def list_deliveries(
    webhook_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(WebhookDelivery)
        .filter(WebhookDelivery.webhook_id == webhook_id)
        .order_by(WebhookDelivery.attempted_at.desc())
        .limit(50)
        .all()
    )
