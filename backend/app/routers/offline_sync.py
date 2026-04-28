from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.models import User, FormSubmission, SubmissionStatus
from app.auth import get_current_user

router = APIRouter(prefix="/api/offline", tags=["Offline Sync"])


@router.post("/sync")
def sync_offline_data(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Sync offline-collected data to server"""
    results = {"synced": 0, "failed": 0, "conflicts": [], "errors": []}

    submissions = data.get("submissions", [])
    for sub in submissions:
        try:
            client_id = sub.get("client_id")
            existing = None
            if client_id:
                existing = db.query(FormSubmission).filter(
                    FormSubmission.id == int(client_id) if client_id.isdigit() else False
                ).first()

            if existing:
                server_updated = existing.updated_at or existing.submitted_at
                client_updated = datetime.fromisoformat(sub.get("updated_at", "2000-01-01"))
                if server_updated and client_updated < server_updated:
                    results["conflicts"].append({
                        "client_id": client_id,
                        "reason": "Server version is newer",
                        "server_updated": server_updated.isoformat(),
                        "client_updated": sub.get("updated_at"),
                    })
                    continue
                existing.data = sub.get("data", {})
                existing.status = SubmissionStatus.SUBMITTED
                db.commit()
            else:
                new_sub = FormSubmission(
                    form_id=sub.get("form_id"),
                    submitted_by=current_user.id,
                    data=sub.get("data", {}),
                    status=SubmissionStatus.SUBMITTED,
                    gps_latitude=sub.get("gps_latitude"),
                    gps_longitude=sub.get("gps_longitude"),
                )
                db.add(new_sub)
                db.commit()

            results["synced"] += 1
        except Exception as e:
            results["failed"] += 1
            results["errors"].append({"client_id": sub.get("client_id"), "error": str(e)})
            db.rollback()

    return results


@router.get("/pending-forms")
def get_forms_for_offline(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get published forms for offline use"""
    from app.models import DataCollectionForm, FormField, FormStatus
    forms = db.query(DataCollectionForm).filter(DataCollectionForm.status == FormStatus.PUBLISHED).all()
    result = []
    for f in forms:
        fields = db.query(FormField).filter(FormField.form_id == f.id).order_by(FormField.order).all()
        result.append({
            "id": f.id, "title": f.title, "description": f.description,
            "fields": [
                {"id": ff.id, "label": ff.label, "field_type": ff.field_type.value,
                 "required": ff.is_required, "options": ff.options, "order": ff.order,
                 "validation_rules": ff.validation_rules}
                for ff in fields
            ],
        })
    return result


@router.get("/sync-status")
def get_sync_status(
    current_user: User = Depends(get_current_user),
):
    """Return sync configuration and status"""
    return {
        "offline_enabled": True,
        "max_offline_days": 30,
        "sync_interval_minutes": 15,
        "storage_type": "IndexedDB",
        "features": {
            "auto_sync_on_connect": True,
            "conflict_resolution": "server_wins",
            "data_compression": True,
            "queue_submissions": True,
        },
    }
