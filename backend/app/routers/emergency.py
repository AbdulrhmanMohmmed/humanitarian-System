"""Emergency Response endpoints."""
from typing import Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import User
from app.models.new_modules import EmergencyResponse, RapidAssessment
from app.pagination import PaginationParams, paginate

router = APIRouter(prefix="/emergency", tags=["الاستجابة الطارئة"])


class EmergencyCreate(BaseModel):
    name: str
    emergency_type: str
    severity: str = "level_1"
    location: str = ""
    affected_population: int = 0
    activation_date: Optional[date] = None


@router.post("/")
def create_emergency(body: EmergencyCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    em = EmergencyResponse(**body.model_dump(), lead_coordinator_id=current_user.id)
    db.add(em)
    db.commit()
    return {"id": em.id, "name": em.name, "status": em.status}


@router.get("/")
def list_emergencies(
    status: Optional[str] = None,
    params: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(EmergencyResponse)
    if status:
        query = query.filter(EmergencyResponse.status == status)
    return paginate(query.order_by(EmergencyResponse.created_at.desc()), params)


@router.put("/{emergency_id}/sitrep")
def update_sitrep(emergency_id: int, sitrep: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    em = db.query(EmergencyResponse).filter(EmergencyResponse.id == emergency_id).first()
    if not em:
        raise HTTPException(404, "حالة طوارئ غير موجودة")
    em.sitrep = sitrep
    db.commit()
    return {"id": em.id, "sitrep_updated": True}


class AssessmentCreate(BaseModel):
    emergency_id: int
    assessment_type: str = "initial"
    location: str = ""
    population_affected: int = 0
    priority_needs: str = ""
    assessment_date: Optional[date] = None


@router.get("/assessments")
def list_assessments(
    emergency_id: Optional[int] = None,
    params: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(RapidAssessment)
    if emergency_id:
        query = query.filter(RapidAssessment.emergency_id == emergency_id)
    return paginate(query.order_by(RapidAssessment.created_at.desc()), params)


@router.post("/assessments")
def create_assessment(body: AssessmentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ra = RapidAssessment(**body.model_dump(), assessor_id=current_user.id)
    db.add(ra)
    db.commit()
    return {"id": ra.id, "assessment_type": ra.assessment_type}
