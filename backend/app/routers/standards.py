"""International Standards endpoints — Sphere, Grand Bargain, Do No Harm, Gender Marker, Disability."""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import User
from app.models.standards import (
    SphereStandard, GrandBargainCommitment, DoNoHarmAnalysis,
    GenderMarker, DisabilityInclusionMarker,
)
from app.pagination import PaginationParams, paginate

router = APIRouter(prefix="/standards", tags=["المعايير الدولية"])


# ── Sphere Standards ─────────────────────────────────────────────────────────

@router.post("/sphere/seed")
def seed_sphere_standards(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if db.query(SphereStandard).count() > 0:
        return {"message": "Already seeded"}

    standards = [
        ("WASH", "WASH-1", "Water supply", "إمدادات المياه", "15L per person per day"),
        ("WASH", "WASH-2", "Excreta disposal", "التخلص من الفضلات", "Max 20 persons per toilet"),
        ("WASH", "WASH-3", "Hygiene promotion", "تعزيز النظافة", "250g soap/person/month"),
        ("Shelter", "SHL-1", "Living space", "مساحة المعيشة", "3.5 sqm covered space/person"),
        ("Food Security", "FSL-1", "Food assistance", "المساعدة الغذائية", "2,100 kcal/person/day"),
        ("Health", "HLT-1", "Health systems", "النظام الصحي", "1 health facility per 10,000"),
        ("Health", "HLT-2", "Essential health services", "الخدمات الصحية الأساسية", "≤1 death/10,000/day CMR"),
    ]
    for sector, num, title_en, title_ar, indicator in standards:
        db.add(SphereStandard(sector=sector, standard_number=num, title_en=title_en, title_ar=title_ar, key_indicator=indicator))
    db.commit()
    return {"seeded": len(standards)}


@router.get("/sphere")
def list_sphere_standards(sector: Optional[str] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(SphereStandard)
    if sector:
        query = query.filter(SphereStandard.sector == sector)
    standards = query.all()
    return [{"id": s.id, "sector": s.sector, "number": s.standard_number, "title": s.title_en, "title_ar": s.title_ar, "indicator": s.key_indicator} for s in standards]


# ── Grand Bargain ────────────────────────────────────────────────────────────

class GrandBargainInput(BaseModel):
    workstream: str
    commitment_number: str
    title: str
    description: str = ""
    progress: float = 0


@router.post("/grand-bargain")
def create_commitment(body: GrandBargainInput, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    c = GrandBargainCommitment(**body.model_dump())
    db.add(c)
    db.commit()
    return {"id": c.id, "title": c.title}


@router.get("/grand-bargain")
def list_commitments(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    items = db.query(GrandBargainCommitment).all()
    return [{"id": c.id, "workstream": c.workstream, "title": c.title, "progress": c.progress} for c in items]


# ── Do No Harm ───────────────────────────────────────────────────────────────

class DNHInput(BaseModel):
    project_id: int
    dividers: str = ""
    connectors: str = ""
    resource_transfer_effects: str = ""
    mitigation_actions: str = ""


@router.post("/do-no-harm")
def create_dnh(body: DNHInput, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    dnh = DoNoHarmAnalysis(**body.model_dump(), analyst_id=current_user.id)
    db.add(dnh)
    db.commit()
    return {"id": dnh.id, "project_id": dnh.project_id}


@router.get("/do-no-harm")
def list_dnh(project_id: Optional[int] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(DoNoHarmAnalysis)
    if project_id:
        query = query.filter(DoNoHarmAnalysis.project_id == project_id)
    items = query.all()
    return [{"id": d.id, "project_id": d.project_id} for d in items]


# ── Gender Marker ────────────────────────────────────────────────────────────

class GenderMarkerInput(BaseModel):
    project_id: int
    marker_code: str
    needs_analysis: str = ""
    adapted_activities: str = ""
    adequate_participation: str = ""
    benefits_equitable: str = ""
    overall_score: float = 0


@router.post("/gender-marker")
def assess_gender_marker(body: GenderMarkerInput, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    gm = GenderMarker(**body.model_dump(), assessor_id=current_user.id)
    db.add(gm)
    db.commit()
    return {"id": gm.id, "marker_code": gm.marker_code, "score": gm.overall_score}


# ── Disability Inclusion ─────────────────────────────────────────────────────

class DisabilityInput(BaseModel):
    project_id: int
    seeing: float = 0
    hearing: float = 0
    walking: float = 0
    remembering: float = 0
    self_care: float = 0
    communicating: float = 0
    barriers_identified: str = ""
    accommodations_planned: str = ""


@router.post("/disability-inclusion")
def assess_disability(body: DisabilityInput, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    overall = sum([body.seeing, body.hearing, body.walking, body.remembering, body.self_care, body.communicating]) / 6
    dim = DisabilityInclusionMarker(**body.model_dump(), overall_score=overall, assessor_id=current_user.id)
    db.add(dim)
    db.commit()
    return {"id": dim.id, "overall_score": overall}
