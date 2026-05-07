from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import Risk, User, RiskLikelihood, RiskImpact
from app.schemas import RiskCreate, RiskUpdate, RiskOut
from app.auth import get_current_user

router = APIRouter(prefix="/risks", tags=["إدارة المخاطر"])

LIKELIHOOD_SCORES = {"very_low": 1, "low": 2, "medium": 3, "high": 4, "very_high": 5}
IMPACT_SCORES = {"negligible": 1, "minor": 2, "moderate": 3, "major": 4, "severe": 5}


@router.get("/", response_model=List[RiskOut])
def list_risks(
    project_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Risk)
    if project_id:
        query = query.filter(Risk.project_id == project_id)
    if status:
        query = query.filter(Risk.status == status)
    return query.order_by(Risk.risk_score.desc()).all()


@router.post("/", response_model=RiskOut)
def create_risk(
    data: RiskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    score = LIKELIHOOD_SCORES.get(data.likelihood.value, 3) * IMPACT_SCORES.get(data.impact.value, 3)
    risk = Risk(**data.model_dump(), risk_score=score, created_by=current_user.id)
    db.add(risk)
    db.commit()
    db.refresh(risk)
    return risk


@router.put("/{risk_id}", response_model=RiskOut)
def update_risk(
    risk_id: int,
    data: RiskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    risk = db.query(Risk).filter(Risk.id == risk_id).first()
    if not risk:
        raise HTTPException(status_code=404, detail="المخاطرة غير موجودة")
    updates = data.model_dump(exclude_unset=True)
    for k, v in updates.items():
        setattr(risk, k, v)
    if "likelihood" in updates or "impact" in updates:
        risk.risk_score = LIKELIHOOD_SCORES.get(risk.likelihood.value, 3) * IMPACT_SCORES.get(risk.impact.value, 3)
    db.commit()
    db.refresh(risk)
    return risk


@router.delete("/{risk_id}")
def delete_risk(
    risk_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    risk = db.query(Risk).filter(Risk.id == risk_id).first()
    if not risk:
        raise HTTPException(status_code=404, detail="المخاطرة غير موجودة")
    db.delete(risk)
    db.commit()
    return {"detail": "تم حذف المخاطرة"}


@router.get("/matrix")
def risk_matrix(
    project_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Risk)
    if project_id:
        query = query.filter(Risk.project_id == project_id)
    risks = query.all()
    matrix = {}
    for r in risks:
        key = f"{r.likelihood.value}_{r.impact.value}"
        if key not in matrix:
            matrix[key] = []
        matrix[key].append({"id": r.id, "title": r.title, "score": r.risk_score})
    return {
        "total_risks": len(risks),
        "high_risks": len([r for r in risks if r.risk_score >= 12]),
        "medium_risks": len([r for r in risks if 6 <= r.risk_score < 12]),
        "low_risks": len([r for r in risks if r.risk_score < 6]),
        "matrix": matrix,
    }
