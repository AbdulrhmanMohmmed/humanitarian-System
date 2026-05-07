"""Service layer for Beneficiary operations."""

from datetime import date
from typing import Optional

from difflib import SequenceMatcher
from sqlalchemy import or_, func
from sqlalchemy.orm import Session

from app.events import Events, event_bus
from app.middleware.error_handler import ConflictError, NotFoundError
from app.models import AuditAction, Beneficiary
from app.models.enums import Gender
from app.routers.audit import log_audit
from app.schemas import BeneficiaryCreate, BeneficiaryUpdate


def calculate_vulnerability_score(
    data: BeneficiaryCreate | BeneficiaryUpdate,
) -> float:
    score = 0.0
    if getattr(data, "has_disability", False):
        score += 30.0
    if getattr(data, "household_size", 1) > 5:
        score += 20.0
    if getattr(data, "gender", None) == Gender.FEMALE and getattr(
        data, "head_of_household", False
    ):
        score += 25.0
    if getattr(data, "date_of_birth", None):
        age = (date.today() - data.date_of_birth).days / 365
        if age > 60:
            score += 20.0
    return min(score, 100.0)


def list_beneficiaries(
    db: Session,
    *,
    skip: int = 0,
    limit: int = 50,
    search: Optional[str] = None,
    governorate: Optional[str] = None,
    status: Optional[str] = None,
) -> list[Beneficiary]:
    query = db.query(Beneficiary)
    if search:
        query = query.filter(
            or_(
                Beneficiary.first_name.contains(search),
                Beneficiary.last_name.contains(search),
                Beneficiary.national_id.contains(search),
                Beneficiary.phone.contains(search),
            )
        )
    if governorate:
        query = query.filter(Beneficiary.governorate == governorate)
    if status:
        query = query.filter(Beneficiary.status == status)
    return query.order_by(Beneficiary.created_at.desc()).offset(skip).limit(limit).all()


def count_beneficiaries(db: Session) -> int:
    return db.query(Beneficiary).count()


def get_by_governorate(db: Session) -> list[dict]:
    results = (
        db.query(Beneficiary.governorate, func.count(Beneficiary.id))
        .group_by(Beneficiary.governorate)
        .all()
    )
    return [{"governorate": g or "غير محدد", "count": c} for g, c in results]


def get_beneficiary(db: Session, beneficiary_id: int) -> Beneficiary:
    b = db.query(Beneficiary).filter(Beneficiary.id == beneficiary_id).first()
    if not b:
        raise NotFoundError("Beneficiary", beneficiary_id)
    return b


def create_beneficiary(
    db: Session, data: BeneficiaryCreate, user_id: int
) -> Beneficiary:
    if data.national_id:
        existing = (
            db.query(Beneficiary)
            .filter(Beneficiary.national_id == data.national_id)
            .first()
        )
        if existing:
            raise ConflictError("رقم الهوية مسجل بالفعل - احتمال ازدواجية")

    if data.vulnerability_score == 0:
        data.vulnerability_score = calculate_vulnerability_score(data)

    b = Beneficiary(**data.model_dump(), registered_by=user_id)
    db.add(b)
    db.commit()
    db.refresh(b)
    log_audit(
        db, user_id, AuditAction.CREATE, "beneficiary", b.id,
        details="Beneficiary created",
    )
    event_bus.emit(Events.BENEFICIARY_CREATED, {"id": b.id, "user_id": user_id})
    return b


def update_beneficiary(
    db: Session, beneficiary_id: int, data: BeneficiaryUpdate, user_id: int
) -> Beneficiary:
    b = get_beneficiary(db, beneficiary_id)
    changed_fields = list(data.model_dump(exclude_unset=True).keys())
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(b, key, value)
    db.commit()
    db.refresh(b)
    log_audit(
        db, user_id, AuditAction.UPDATE, "beneficiary", b.id,
        details=f"Beneficiary updated: {', '.join(changed_fields)}",
    )
    return b


def delete_beneficiary(db: Session, beneficiary_id: int, user_id: int) -> None:
    b = get_beneficiary(db, beneficiary_id)
    db.delete(b)
    db.commit()
    log_audit(
        db, user_id, AuditAction.DELETE, "beneficiary", b.id,
        details="Beneficiary deleted",
    )
    event_bus.emit(Events.BENEFICIARY_DELETED, {"id": beneficiary_id, "user_id": user_id})


def check_duplicate(
    db: Session, first_name: str, last_name: str, national_id: Optional[str] = None
) -> list[dict]:
    """Check for duplicate beneficiaries using fuzzy matching."""
    if national_id:
        exact = (
            db.query(Beneficiary)
            .filter(Beneficiary.national_id == national_id)
            .first()
        )
        if exact:
            return [
                {
                    "id": exact.id,
                    "name": f"{exact.first_name} {exact.last_name}",
                    "national_id": exact.national_id,
                    "match_type": "exact_national_id",
                    "similarity": 1.0,
                }
            ]

    candidates = db.query(Beneficiary).limit(1000).all()
    full_name = f"{first_name} {last_name}".lower()
    matches = []
    for c in candidates:
        c_name = f"{c.first_name} {c.last_name}".lower()
        ratio = SequenceMatcher(None, full_name, c_name).ratio()
        if ratio > 0.75:
            matches.append(
                {
                    "id": c.id,
                    "name": f"{c.first_name} {c.last_name}",
                    "national_id": c.national_id,
                    "match_type": "fuzzy_name",
                    "similarity": round(ratio, 2),
                }
            )
    return sorted(matches, key=lambda x: x["similarity"], reverse=True)[:10]
