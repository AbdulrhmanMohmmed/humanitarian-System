from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date
from app.database import get_db
from app.models import AuditLog, AuditAction, User
from app.permissions import Permission, require_permission

router = APIRouter(prefix="/audit", tags=["سجل التدقيق"])


def log_audit(db: Session, user_id: int, action: AuditAction, entity_type: str,
              entity_id: int = None, details: str = None, old_values: str = None,
              new_values: str = None, ip_address: str = None):
    entry = AuditLog(
        user_id=user_id, action=action, entity_type=entity_type,
        entity_id=entity_id, details=details, old_values=old_values,
        new_values=new_values, ip_address=ip_address,
    )
    db.add(entry)
    db.commit()


@router.get("/")
def list_audit_logs(
    entity_type: Optional[str] = None,
    action: Optional[str] = None,
    user_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.AUDIT_READ)),
):
    query = db.query(AuditLog)
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)
    if action:
        query = query.filter(AuditLog.action == action)
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    if start_date:
        query = query.filter(AuditLog.created_at >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(AuditLog.created_at <= datetime.fromisoformat(end_date))

    total = query.count()
    logs = query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()

    return {
        "total": total,
        "logs": [
            {
                "id": l.id, "user_id": l.user_id,
                "action": l.action.value if l.action else None,
                "entity_type": l.entity_type, "entity_id": l.entity_id,
                "details": l.details, "ip_address": l.ip_address,
                "old_values": l.old_values, "new_values": l.new_values,
                "created_at": l.created_at.isoformat() if l.created_at else None,
            }
            for l in logs
        ],
    }


@router.get("/entity/{entity_type}/{entity_id}")
def entity_history(
    entity_type: str,
    entity_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.AUDIT_READ)),
):
    logs = db.query(AuditLog).filter(
        AuditLog.entity_type == entity_type,
        AuditLog.entity_id == entity_id,
    ).order_by(AuditLog.created_at.desc()).all()
    return [
        {
            "id": l.id, "action": l.action.value if l.action else None,
            "user_id": l.user_id, "details": l.details,
            "old_values": l.old_values, "new_values": l.new_values,
            "created_at": l.created_at.isoformat() if l.created_at else None,
        }
        for l in logs
    ]


@router.get("/summary")
def audit_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.AUDIT_READ)),
):
    total = db.query(AuditLog).count()
    by_action = {}
    for a in AuditAction:
        by_action[a.value] = db.query(AuditLog).filter(AuditLog.action == a).count()
    recent = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(10).all()
    return {
        "total_entries": total,
        "by_action": by_action,
        "recent": [
            {
                "id": l.id, "action": l.action.value if l.action else None,
                "entity_type": l.entity_type, "details": l.details,
                "created_at": l.created_at.isoformat() if l.created_at else None,
            }
            for l in recent
        ],
    }
