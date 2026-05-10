"""Advanced MEAL endpoints — Indicator Registry, Disaggregation, DQA, Deduplication, PDM."""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import User
from app.models.meal import IndicatorDefinition, DataQualityRule, BeneficiaryMatch, PDMTemplate
from app.pagination import PaginationParams, paginate
from app.services import meal_service

router = APIRouter(prefix="/meal", tags=["المتابعة والتقييم المتقدم"])


# ── Indicator Registry ───────────────────────────────────────────────────────

@router.post("/indicators/seed-global")
def seed_global_indicators(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    indicators = meal_service.seed_global_indicators(db)
    return {"seeded": len(indicators), "indicators": indicators}


@router.get("/indicators/registry")
def list_indicator_definitions(
    sector: Optional[str] = None,
    standard: Optional[str] = None,
    params: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(IndicatorDefinition)
    if sector:
        query = query.filter(IndicatorDefinition.sector == sector)
    if standard:
        query = query.filter(IndicatorDefinition.standard == standard)
    return paginate(query.order_by(IndicatorDefinition.code), params)


class IndicatorCreate(BaseModel):
    code: str
    name: str
    name_ar: str = ""
    sector: str = ""
    unit_of_measure: str = ""
    collection_frequency: str = "monthly"


@router.post("/indicators/registry")
def create_indicator_definition(body: IndicatorCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ind = IndicatorDefinition(**body.model_dump())
    db.add(ind)
    db.commit()
    db.refresh(ind)
    return {"id": ind.id, "code": ind.code, "name": ind.name}


# ── Disaggregation ───────────────────────────────────────────────────────────

class DisaggInput(BaseModel):
    measurement_id: int
    indicator_id: int
    dimension: str
    category: str
    value: float


@router.post("/disaggregation")
def add_disaggregated_value(body: DisaggInput, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return meal_service.add_disaggregated_value(db, body.measurement_id, body.indicator_id, body.dimension, body.category, body.value)


@router.get("/disaggregation/{indicator_id}")
def get_disaggregation(indicator_id: int, dimension: str = "gender", db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return meal_service.get_disaggregation_summary(db, indicator_id, dimension)


# ── Data Quality ─────────────────────────────────────────────────────────────

class DQRuleCreate(BaseModel):
    name: str
    entity_type: str
    field_name: str = ""
    rule_type: str = "required"
    severity: str = "warning"


@router.post("/data-quality/rules")
def create_dq_rule(body: DQRuleCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rule = DataQualityRule(**body.model_dump())
    db.add(rule)
    db.commit()
    return {"id": rule.id, "name": rule.name}


@router.post("/data-quality/run")
def run_data_quality(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    issues = meal_service.run_data_quality_checks(db)
    return {"issues_found": len(issues), "issues": issues}


# ── Deduplication ────────────────────────────────────────────────────────────

@router.post("/deduplication/run")
def run_deduplication(threshold: float = 0.8, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    matches = meal_service.run_deduplication(db, threshold)
    return {"matches_found": len(matches), "matches": matches}


@router.get("/deduplication/pending")
def pending_matches(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    matches = db.query(BeneficiaryMatch).filter(BeneficiaryMatch.status == "pending").all()
    return [{"id": m.id, "a_id": m.beneficiary_a_id, "b_id": m.beneficiary_b_id, "score": m.match_score} for m in matches]


# ── PDM Templates ────────────────────────────────────────────────────────────

class PDMTemplateCreate(BaseModel):
    name: str
    distribution_type: str
    questions: str = "[]"


@router.post("/pdm-templates")
def create_pdm_template(body: PDMTemplateCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    tpl = PDMTemplate(**body.model_dump())
    db.add(tpl)
    db.commit()
    return {"id": tpl.id, "name": tpl.name}


@router.get("/pdm-templates")
def list_pdm_templates(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    templates = db.query(PDMTemplate).filter(PDMTemplate.is_active == True).all()
    return [{"id": t.id, "name": t.name, "type": t.distribution_type} for t in templates]
