"""GDPR/Data Protection services — consent management and right to erasure."""
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.security import DataConsent, ErasureRequest


def record_consent(
    db: Session,
    beneficiary_id: int,
    consent_type: str,
    granted: bool,
    purpose: str = "",
    legal_basis: str = "consent",
    collector_id: int | None = None,
) -> DataConsent:
    consent = DataConsent(
        beneficiary_id=beneficiary_id,
        consent_type=consent_type,
        granted=granted,
        granted_at=datetime.utcnow() if granted else None,
        purpose=purpose,
        legal_basis=legal_basis,
        collector_id=collector_id,
    )
    db.add(consent)
    db.commit()
    db.refresh(consent)
    return consent


def revoke_consent(db: Session, consent_id: int) -> bool:
    consent = db.query(DataConsent).filter(DataConsent.id == consent_id).first()
    if not consent:
        return False
    consent.granted = False
    consent.revoked_at = datetime.utcnow()
    db.commit()
    return True


def get_consents(db: Session, beneficiary_id: int) -> list[dict]:
    consents = (
        db.query(DataConsent)
        .filter(DataConsent.beneficiary_id == beneficiary_id)
        .order_by(DataConsent.created_at.desc())
        .all()
    )
    return [
        {
            "id": c.id,
            "consent_type": c.consent_type,
            "granted": c.granted,
            "granted_at": str(c.granted_at) if c.granted_at else None,
            "revoked_at": str(c.revoked_at) if c.revoked_at else None,
            "purpose": c.purpose,
            "legal_basis": c.legal_basis,
        }
        for c in consents
    ]


def request_erasure(db: Session, beneficiary_id: int, requested_by: int, reason: str = "") -> ErasureRequest:
    req = ErasureRequest(
        beneficiary_id=beneficiary_id,
        requested_by=requested_by,
        reason=reason,
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return req


def process_erasure(db: Session, request_id: int, approved_by: int, approve: bool) -> dict:
    req = db.query(ErasureRequest).filter(ErasureRequest.id == request_id).first()
    if not req:
        return {"error": "Request not found"}

    if approve:
        req.status = "completed"
        req.approved_by = approved_by
        req.completed_at = datetime.utcnow()
        # Anonymize beneficiary data
        from app.models import Beneficiary
        ben = db.query(Beneficiary).filter(Beneficiary.id == req.beneficiary_id).first()
        if ben:
            ben.first_name = "[ERASED]"
            ben.last_name = "[ERASED]"
            ben.national_id = None
            ben.phone = None
            if hasattr(ben, "deleted_at"):
                ben.deleted_at = datetime.utcnow()
                ben.deleted_by = approved_by
    else:
        req.status = "rejected"
        req.approved_by = approved_by

    db.commit()
    return {"status": req.status, "id": req.id}
