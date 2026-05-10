"""Security endpoints — API keys, sessions, GDPR, IP whitelist."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import User
from app.services import api_key_service, session_service, gdpr_service

router = APIRouter(prefix="/security", tags=["الأمان"])


# ── API Keys ─────────────────────────────────────────────────────────────────

class CreateAPIKeyRequest(BaseModel):
    name: str
    scopes: str = "read"


@router.post("/api-keys")
def create_api_key(
    body: CreateAPIKeyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return api_key_service.create_api_key(db, current_user.id, body.name, body.scopes)


@router.get("/api-keys")
def list_api_keys(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return api_key_service.list_api_keys(db, current_user.id)


@router.delete("/api-keys/{key_id}")
def revoke_api_key(key_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not api_key_service.revoke_api_key(db, key_id, current_user.id):
        raise HTTPException(404, "مفتاح غير موجود")
    return {"message": "تم إلغاء المفتاح"}


# ── Sessions ─────────────────────────────────────────────────────────────────

@router.get("/sessions")
def list_sessions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return session_service.list_active_sessions(db, current_user.id)


@router.delete("/sessions/{session_id}")
def terminate_session(session_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not session_service.terminate_session(db, session_id, current_user.id):
        raise HTTPException(404, "جلسة غير موجودة")
    return {"message": "تم إنهاء الجلسة"}


@router.post("/sessions/terminate-all")
def terminate_all_sessions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    count = session_service.terminate_all_sessions(db, current_user.id)
    return {"terminated": count}


# ── GDPR / Data Consent ──────────────────────────────────────────────────────

class ConsentRequest(BaseModel):
    beneficiary_id: int
    consent_type: str
    granted: bool
    purpose: str = ""
    legal_basis: str = "consent"


class ErasureRequest(BaseModel):
    beneficiary_id: int
    reason: str = ""


@router.post("/consent")
def record_consent(body: ConsentRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    consent = gdpr_service.record_consent(
        db, body.beneficiary_id, body.consent_type, body.granted, body.purpose, body.legal_basis, current_user.id
    )
    return {"id": consent.id, "consent_type": consent.consent_type, "granted": consent.granted}


@router.get("/consent/{beneficiary_id}")
def get_consents(beneficiary_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return gdpr_service.get_consents(db, beneficiary_id)


@router.post("/consent/{consent_id}/revoke")
def revoke_consent(consent_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not gdpr_service.revoke_consent(db, consent_id):
        raise HTTPException(404, "موافقة غير موجودة")
    return {"message": "تم إلغاء الموافقة"}


@router.post("/erasure-request")
def request_erasure(body: ErasureRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    req = gdpr_service.request_erasure(db, body.beneficiary_id, current_user.id, body.reason)
    return {"id": req.id, "status": req.status}


class ErasureDecision(BaseModel):
    approve: bool


@router.post("/erasure-request/{request_id}/decide")
def process_erasure(
    request_id: int,
    body: ErasureDecision,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = gdpr_service.process_erasure(db, request_id, current_user.id, body.approve)
    if "error" in result:
        raise HTTPException(404, result["error"])
    return result
