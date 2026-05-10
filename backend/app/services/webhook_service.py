"""Webhook delivery service."""

import hashlib
import hmac
import json
import logging
from typing import Optional

import httpx
from sqlalchemy.orm import Session

from app.models.webhook import Webhook, WebhookDelivery

logger = logging.getLogger(__name__)


def list_webhooks(db: Session, active_only: bool = True) -> list[Webhook]:
    query = db.query(Webhook)
    if active_only:
        query = query.filter(Webhook.is_active == 1)
    return query.all()


def create_webhook(
    db: Session,
    *,
    name: str,
    url: str,
    webhook_type: str = "custom",
    secret: Optional[str] = None,
    events: str = "*",
    created_by: int,
) -> Webhook:
    wh = Webhook(
        name=name, url=url, type=webhook_type,
        secret=secret, events=events, created_by=created_by,
    )
    db.add(wh)
    db.commit()
    db.refresh(wh)
    return wh


def _matches_event(webhook: Webhook, event: str) -> bool:
    """Check if webhook is subscribed to this event."""
    if webhook.events == "*":
        return True
    subscribed = [e.strip() for e in webhook.events.split(",")]
    return event in subscribed


def _sign_payload(payload: str, secret: str) -> str:
    return hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()


async def dispatch_event(db: Session, event: str, payload: dict):
    """Send webhook to all matching registered endpoints."""
    webhooks = list_webhooks(db)
    payload_str = json.dumps(payload, default=str)

    async with httpx.AsyncClient(timeout=10.0) as client:
        for wh in webhooks:
            if not _matches_event(wh, event):
                continue

            headers = {
                "Content-Type": "application/json",
                "X-Webhook-Event": event,
            }
            if wh.secret:
                headers["X-Webhook-Signature"] = _sign_payload(payload_str, wh.secret)

            delivery = WebhookDelivery(
                webhook_id=wh.id, event=event, payload=payload_str,
            )

            try:
                resp = await client.post(wh.url, content=payload_str, headers=headers)
                delivery.response_status = resp.status_code
                delivery.response_body = resp.text[:2000]
                delivery.success = 1 if resp.status_code < 400 else 0
            except Exception as exc:
                logger.warning("Webhook %s delivery failed: %s", wh.name, exc)
                delivery.response_status = 0
                delivery.response_body = str(exc)[:2000]
                delivery.success = 0

            db.add(delivery)

    db.commit()


def format_slack_message(event: str, payload: dict) -> dict:
    """Format payload as Slack-compatible message."""
    return {
        "text": f"*{event}*\n```{json.dumps(payload, indent=2, default=str)[:1500]}```",
    }


def format_teams_message(event: str, payload: dict) -> dict:
    """Format payload as Microsoft Teams-compatible message."""
    return {
        "@type": "MessageCard",
        "summary": event,
        "sections": [{
            "activityTitle": event,
            "text": json.dumps(payload, indent=2, default=str)[:2000],
        }],
    }
