"""MEAL service — indicator registry, disaggregation, data quality, deduplication."""
import json
from difflib import SequenceMatcher
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.meal import (
    IndicatorDefinition, DisaggregatedValue, DataQualityRule,
    DataQualityIssue, BeneficiaryMatch,
)
from app.models import Beneficiary


def seed_global_indicators(db: Session) -> list[dict]:
    """Seed Sphere/CHS standard indicators."""
    if db.query(IndicatorDefinition).filter(IndicatorDefinition.is_global == True).count() > 0:
        return []

    indicators = [
        ("SPH-WASH-01", "Litres of water per person per day", "لتر ماء لكل شخص يومياً", "WASH", "Sphere", "litres/person/day", '["gender","age","disability","location"]'),
        ("SPH-WASH-02", "Number of persons per latrine", "عدد الأشخاص لكل مرحاض", "WASH", "Sphere", "persons/latrine", '["location"]'),
        ("SPH-NUT-01", "GAM rate (6-59 months)", "معدل سوء التغذية الحاد", "Nutrition", "Sphere", "percentage", '["gender","location"]'),
        ("SPH-NUT-02", "SAM rate (6-59 months)", "معدل سوء التغذية الحاد الوخيم", "Nutrition", "Sphere", "percentage", '["gender","location"]'),
        ("SPH-FSL-01", "Food Consumption Score", "درجة استهلاك الغذاء", "Food Security", "Sphere", "score", '["gender","location"]'),
        ("SPH-SHL-01", "Covered living space per person", "مساحة سكن مغطاة لكل شخص", "Shelter", "Sphere", "sqm/person", '["location"]'),
        ("SPH-HLT-01", "Crude mortality rate", "معدل الوفيات الخام", "Health", "Sphere", "deaths/10000/day", '["gender","age"]'),
        ("CHS-01", "Communities & people affected have access to information", "حصول المجتمعات على المعلومات", "Accountability", "CHS", "score", '[]'),
        ("IASC-GBV-01", "GBV incident reports responded to within 72h", "تقارير العنف القائم على النوع", "Protection", "IASC", "percentage", '["gender","age"]'),
        ("IASC-CP-01", "Unaccompanied/separated children identified", "أطفال غير مصحوبين", "Protection", "IASC", "count", '["gender","age"]'),
    ]
    seeded = []
    for code, name, name_ar, sector, standard, unit, disagg in indicators:
        ind = IndicatorDefinition(
            code=code, name=name, name_ar=name_ar, sector=sector,
            standard=standard, unit_of_measure=unit,
            disaggregation_types=disagg, is_global=True,
        )
        db.add(ind)
        seeded.append({"code": code, "name": name})
    db.commit()
    return seeded


def add_disaggregated_value(
    db: Session, measurement_id: int, indicator_id: int,
    dimension: str, category: str, value: float,
) -> dict:
    dv = DisaggregatedValue(
        measurement_id=measurement_id, indicator_id=indicator_id,
        dimension=dimension, category=category, value=value,
    )
    db.add(dv)
    db.commit()
    return {"id": dv.id, "dimension": dimension, "category": category, "value": value}


def get_disaggregation_summary(db: Session, indicator_id: int, dimension: str) -> list[dict]:
    results = (
        db.query(DisaggregatedValue.category, func.sum(DisaggregatedValue.value))
        .filter(DisaggregatedValue.indicator_id == indicator_id, DisaggregatedValue.dimension == dimension)
        .group_by(DisaggregatedValue.category)
        .all()
    )
    return [{"category": r[0], "total": float(r[1])} for r in results]


def run_deduplication(db: Session, threshold: float = 0.8) -> list[dict]:
    """Find potential duplicate beneficiaries using fuzzy name matching."""
    beneficiaries = db.query(Beneficiary).filter(Beneficiary.deleted_at.is_(None)).all()
    matches = []

    for i, a in enumerate(beneficiaries):
        for b in beneficiaries[i + 1:]:
            score = 0.0
            matched_fields = []

            # Name similarity (first_name + last_name)
            a_name = f"{a.first_name or ''} {a.last_name or ''}".strip()
            b_name = f"{b.first_name or ''} {b.last_name or ''}".strip()
            if a_name and b_name:
                name_sim = SequenceMatcher(None, a_name.lower(), b_name.lower()).ratio()
                score += name_sim * 0.5
                if name_sim > 0.8:
                    matched_fields.append("name")

            # National ID exact match
            if a.national_id and b.national_id and a.national_id == b.national_id:
                score += 0.4
                matched_fields.append("national_id")

            # Phone match
            if hasattr(a, "phone") and hasattr(b, "phone") and a.phone and b.phone and a.phone == b.phone:
                score += 0.1
                matched_fields.append("phone")

            if score >= threshold:
                existing = db.query(BeneficiaryMatch).filter(
                    BeneficiaryMatch.beneficiary_a_id == a.id,
                    BeneficiaryMatch.beneficiary_b_id == b.id,
                ).first()
                if not existing:
                    match = BeneficiaryMatch(
                        beneficiary_a_id=a.id,
                        beneficiary_b_id=b.id,
                        match_score=score,
                        match_fields=json.dumps(matched_fields),
                    )
                    db.add(match)
                    matches.append({"a_id": a.id, "b_id": b.id, "score": score, "fields": matched_fields})

    db.commit()
    return matches


def run_data_quality_checks(db: Session) -> list[dict]:
    """Run all active data quality rules and create issues."""
    rules = db.query(DataQualityRule).filter(DataQualityRule.is_active == True).all()
    issues = []

    for rule in rules:
        if rule.entity_type == "beneficiary" and rule.rule_type == "required":
            # Check for missing required fields
            beneficiaries = db.query(Beneficiary).filter(Beneficiary.deleted_at.is_(None)).all()
            for ben in beneficiaries:
                val = getattr(ben, rule.field_name, None) if rule.field_name else None
                if val is None or val == "":
                    issue = DataQualityIssue(
                        rule_id=rule.id,
                        entity_type="beneficiary",
                        entity_id=ben.id,
                        field_name=rule.field_name,
                        issue_description=f"Missing required field: {rule.field_name}",
                        severity=rule.severity,
                    )
                    db.add(issue)
                    issues.append({"entity": "beneficiary", "id": ben.id, "field": rule.field_name})

    db.commit()
    return issues
