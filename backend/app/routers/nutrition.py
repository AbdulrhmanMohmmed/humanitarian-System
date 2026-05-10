"""Nutrition Module endpoints — screenings, MUAC, SAM/MAM classification."""
from typing import Optional
from datetime import date
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.auth import get_current_user
from app.database import get_db
from app.models import User
from app.models.new_modules import NutritionScreening
from app.pagination import PaginationParams, paginate

router = APIRouter(prefix="/nutrition", tags=["التغذية"])


class ScreeningCreate(BaseModel):
    beneficiary_id: int
    screening_date: date
    muac: Optional[float] = None
    weight: Optional[float] = None
    height: Optional[float] = None
    wfh_zscore: Optional[float] = None


def _classify(muac: float | None, zscore: float | None) -> str:
    if muac is not None:
        if muac < 115:
            return "sam"
        if muac < 125:
            return "mam"
        return "normal"
    if zscore is not None:
        if zscore < -3:
            return "sam"
        if zscore < -2:
            return "mam"
        return "normal"
    return "unknown"


@router.post("/screenings")
def create_screening(body: ScreeningCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    classification = _classify(body.muac, body.wfh_zscore)
    screening = NutritionScreening(
        **body.model_dump(),
        classification=classification,
        referred=classification in ("sam", "mam"),
        treatment_program="OTP" if classification == "sam" else ("SFP" if classification == "mam" else ""),
        screener_id=current_user.id,
    )
    db.add(screening)
    db.commit()
    return {"id": screening.id, "classification": classification, "referred": screening.referred}


@router.get("/screenings")
def list_screenings(
    classification: Optional[str] = None,
    params: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(NutritionScreening)
    if classification:
        query = query.filter(NutritionScreening.classification == classification)
    return paginate(query.order_by(NutritionScreening.screening_date.desc()), params)


@router.get("/dashboard")
def nutrition_dashboard(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    total = db.query(NutritionScreening).count()
    sam = db.query(NutritionScreening).filter(NutritionScreening.classification == "sam").count()
    mam = db.query(NutritionScreening).filter(NutritionScreening.classification == "mam").count()
    normal = db.query(NutritionScreening).filter(NutritionScreening.classification == "normal").count()
    return {
        "total_screenings": total,
        "sam": sam, "mam": mam, "normal": normal,
        "gam_rate": round((sam + mam) / total * 100, 1) if total > 0 else 0,
    }
