from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
import json
import math
from datetime import date, datetime
from app.database import get_db
from app.models import (
    Project, Beneficiary, Indicator, Measurement,
    DataCollectionForm, FormSubmission, Distribution, DistributionItem,
    DataQualityAssessment, User, DQAStatus, FormStatus
)
from app.schemas import DQACreate, DQAOut
from app.auth import get_current_user

router = APIRouter(prefix="/api/analytics", tags=["التحليلات"])


@router.get("/overview")
def analytics_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total_projects = db.query(Project).count()
    active_projects = db.query(Project).filter(Project.status == "active").count()
    total_beneficiaries = db.query(Beneficiary).count()
    total_indicators = db.query(Indicator).count()
    total_forms = db.query(DataCollectionForm).count()
    total_submissions = db.query(FormSubmission).count()

    total_budget = db.query(func.sum(Project.budget)).scalar() or 0
    total_spent = db.query(func.sum(Project.spent)).scalar() or 0

    return {
        "total_projects": total_projects,
        "active_projects": active_projects,
        "total_beneficiaries": total_beneficiaries,
        "total_indicators": total_indicators,
        "total_forms": total_forms,
        "total_submissions": total_submissions,
        "total_budget": total_budget,
        "total_spent": total_spent,
        "budget_utilization": round((total_spent / total_budget * 100) if total_budget > 0 else 0, 1),
    }


@router.get("/geographic")
def geographic_analysis(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    beneficiary_by_gov = db.query(
        Beneficiary.governorate,
        func.count(Beneficiary.id)
    ).group_by(Beneficiary.governorate).all()

    project_by_gov = db.query(
        Project.governorate,
        func.count(Project.id)
    ).group_by(Project.governorate).all()

    return {
        "beneficiaries_by_governorate": [
            {"governorate": g or "غير محدد", "count": c}
            for g, c in beneficiary_by_gov if g
        ],
        "projects_by_governorate": [
            {"governorate": g or "غير محدد", "count": c}
            for g, c in project_by_gov if g
        ],
    }


@router.get("/trends")
def trend_analysis(
    project_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Measurement)
    if project_id:
        query = query.join(Indicator).filter(Indicator.project_id == project_id)

    measurements = query.order_by(Measurement.date).all()

    indicator_trends = {}
    for m in measurements:
        ind_id = m.indicator_id
        if ind_id not in indicator_trends:
            indicator = db.query(Indicator).filter(Indicator.id == ind_id).first()
            indicator_trends[ind_id] = {
                "indicator_name": indicator.name if indicator else f"مؤشر {ind_id}",
                "target": indicator.target_value if indicator else 0,
                "data_points": [],
            }
        indicator_trends[ind_id]["data_points"].append({
            "date": m.date.isoformat() if m.date else None,
            "value": m.value,
        })

    return {"trends": list(indicator_trends.values())}


@router.get("/5w")
def five_w_report(
    project_id: Optional[int] = None,
    governorate: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Project)
    if project_id:
        query = query.filter(Project.id == project_id)
    if governorate:
        query = query.filter(Project.governorate == governorate)

    projects = query.all()
    report_data = []
    for p in projects:
        activities = p.activities if hasattr(p, 'activities') else []
        for act in activities:
            report_data.append({
                "who": p.donor or "غير محدد",
                "what": act.name,
                "where": p.governorate or "غير محدد",
                "when": act.start_date.isoformat() if act.start_date else "غير محدد",
                "for_whom": f"{p.target_beneficiaries} مستفيد",
                "project": p.name,
                "sector": p.sector or "غير محدد",
                "status": act.status.value if act.status else "غير محدد",
            })

    if not report_data:
        for p in projects:
            report_data.append({
                "who": p.donor or "غير محدد",
                "what": p.name,
                "where": p.governorate or "غير محدد",
                "when": p.start_date.isoformat() if p.start_date else "غير محدد",
                "for_whom": f"{p.target_beneficiaries} مستفيد",
                "project": p.name,
                "sector": p.sector or "غير محدد",
                "status": p.status.value if p.status else "غير محدد",
            })

    return {"data": report_data}


@router.get("/sample-calculator")
def sample_calculator(
    population: int = 1000,
    confidence: float = 95,
    margin_error: float = 5,
    current_user: User = Depends(get_current_user),
):
    z_scores = {90: 1.645, 95: 1.96, 99: 2.576}
    z = z_scores.get(confidence, 1.96)
    p = 0.5
    e = margin_error / 100

    if e == 0 or population <= 0:
        raise HTTPException(status_code=400, detail="حجم السكان يجب أن يكون أكبر من صفر وهامش الخطأ يجب أن يكون أكبر من صفر")

    n0 = (z * z * p * (1 - p)) / (e * e)
    n = n0 / (1 + (n0 - 1) / population)
    sample_size = math.ceil(n)

    return {
        "population": population,
        "confidence_level": confidence,
        "margin_of_error": margin_error,
        "sample_size": sample_size,
        "formula": f"n = (Z²×p×(1-p)) / e² adjusted for finite population",
    }


@router.post("/dqa", response_model=DQAOut)
def run_data_quality_assessment(
    data: DQACreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(FormSubmission)
    if data.form_id:
        query = query.filter(FormSubmission.form_id == data.form_id)

    submissions = query.all()
    total = len(submissions)

    if total == 0:
        dqa = DataQualityAssessment(
            project_id=data.project_id,
            form_id=data.form_id,
            total_records=0,
            complete_records=0,
            accuracy_score=0,
            timeliness_score=0,
            consistency_score=0,
            overall_score=0,
            status=DQAStatus.CRITICAL,
            findings="لا توجد بيانات للتقييم",
            assessed_by=current_user.id,
        )
        db.add(dqa)
        db.commit()
        db.refresh(dqa)
        return dqa

    complete = 0
    has_data = 0
    for sub in submissions:
        try:
            sub_data = json.loads(sub.data)
            non_empty = sum(1 for v in sub_data.values() if v)
            total_fields = len(sub_data)
            if total_fields > 0 and (non_empty / total_fields) >= 0.8:
                complete += 1
            if non_empty > 0:
                has_data += 1
        except (json.JSONDecodeError, AttributeError):
            pass

    completeness = (complete / total * 100) if total > 0 else 0
    accuracy = (has_data / total * 100) if total > 0 else 0
    timeliness = min(100, completeness + 10)
    consistency = min(100, accuracy + 5)
    overall = (completeness + accuracy + timeliness + consistency) / 4

    if overall >= 80:
        status = DQAStatus.GOOD
    elif overall >= 60:
        status = DQAStatus.ACCEPTABLE
    elif overall >= 40:
        status = DQAStatus.POOR
    else:
        status = DQAStatus.CRITICAL

    findings_parts = []
    if completeness < 80:
        findings_parts.append(f"نسبة الاكتمال منخفضة ({completeness:.0f}%)")
    if accuracy < 80:
        findings_parts.append(f"نسبة الدقة تحتاج تحسين ({accuracy:.0f}%)")

    recommendations_parts = []
    if completeness < 80:
        recommendations_parts.append("تدريب جامعي البيانات على تعبئة جميع الحقول")
    if accuracy < 90:
        recommendations_parts.append("مراجعة صحة البيانات المدخلة")

    dqa = DataQualityAssessment(
        project_id=data.project_id,
        form_id=data.form_id,
        total_records=total,
        complete_records=complete,
        accuracy_score=round(accuracy, 1),
        timeliness_score=round(timeliness, 1),
        consistency_score=round(consistency, 1),
        overall_score=round(overall, 1),
        status=status,
        findings="; ".join(findings_parts) if findings_parts else "جودة البيانات جيدة",
        recommendations="; ".join(recommendations_parts) if recommendations_parts else "لا توجد توصيات حالياً",
        assessed_by=current_user.id,
    )
    db.add(dqa)
    db.commit()
    db.refresh(dqa)
    return dqa


@router.get("/dqa/history", response_model=List[DQAOut])
def dqa_history(
    project_id: Optional[int] = None,
    form_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(DataQualityAssessment)
    if project_id:
        query = query.filter(DataQualityAssessment.project_id == project_id)
    if form_id:
        query = query.filter(DataQualityAssessment.form_id == form_id)
    return query.order_by(DataQualityAssessment.created_at.desc()).all()


@router.get("/deduplication")
def check_duplicates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    duplicates = db.query(
        Beneficiary.first_name,
        Beneficiary.last_name,
        Beneficiary.governorate,
        func.count(Beneficiary.id).label("count")
    ).group_by(
        Beneficiary.first_name,
        Beneficiary.last_name,
        Beneficiary.governorate,
    ).having(func.count(Beneficiary.id) > 1).all()

    results = []
    for d in duplicates:
        matching = db.query(Beneficiary).filter(
            Beneficiary.first_name == d[0],
            Beneficiary.last_name == d[1],
            Beneficiary.governorate == d[2],
        ).all()
        results.append({
            "name": f"{d[0]} {d[1]}",
            "governorate": d[2] or "غير محدد",
            "count": d[3],
            "ids": [m.id for m in matching],
            "national_ids": [m.national_id for m in matching],
        })

    return {
        "total_duplicates": len(results),
        "duplicate_groups": results,
    }


@router.get("/cross-project-comparison")
def cross_project_comparison(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    projects = db.query(Project).all()
    comparison = []
    for p in projects:
        indicators = db.query(Indicator).filter(Indicator.project_id == p.id).all()
        beneficiaries = db.query(func.count(func.distinct(DistributionItem.beneficiary_id))).join(
            Distribution, DistributionItem.distribution_id == Distribution.id
        ).filter(Distribution.project_id == p.id).scalar() or 0
        submissions = db.query(FormSubmission).join(DataCollectionForm).filter(
            DataCollectionForm.project_id == p.id
        ).count()
        achieved = sum(1 for i in indicators if i.actual_value >= i.target_value)
        total_ind = len(indicators)
        comparison.append({
            "id": p.id,
            "name": p.name,
            "status": p.status.value if p.status else "unknown",
            "sector": p.sector,
            "governorate": p.governorate,
            "budget": p.budget or 0,
            "spent": p.spent or 0,
            "budget_utilization": round((p.spent / p.budget * 100) if p.budget else 0, 1),
            "beneficiaries": beneficiaries,
            "submissions": submissions,
            "indicators_total": total_ind,
            "indicators_achieved": achieved,
            "indicator_rate": round(achieved / total_ind * 100 if total_ind else 0, 1),
        })
    return comparison


@router.get("/gis-data")
def gis_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    YEMEN_GOVERNORATES = {
        "صنعاء": {"lat": 15.3694, "lng": 44.1910},
        "عدن": {"lat": 12.7855, "lng": 45.0187},
        "تعز": {"lat": 13.5789, "lng": 44.0219},
        "الحديدة": {"lat": 14.7980, "lng": 42.9540},
        "إب": {"lat": 13.9670, "lng": 44.1720},
        "حضرموت": {"lat": 15.3320, "lng": 48.5164},
        "مأرب": {"lat": 15.4630, "lng": 45.3266},
        "أبين": {"lat": 13.6360, "lng": 45.6330},
        "لحج": {"lat": 13.0550, "lng": 44.8820},
        "الضالع": {"lat": 13.6940, "lng": 44.7310},
        "شبوة": {"lat": 14.5310, "lng": 47.0130},
        "المهرة": {"lat": 16.5160, "lng": 52.2700},
        "ذمار": {"lat": 14.5426, "lng": 44.4014},
        "عمران": {"lat": 15.6600, "lng": 43.9440},
        "حجة": {"lat": 15.6930, "lng": 43.6030},
        "صعدة": {"lat": 16.9400, "lng": 43.7600},
        "الجوف": {"lat": 16.2000, "lng": 45.5000},
        "البيضاء": {"lat": 14.1670, "lng": 45.5720},
        "ريمة": {"lat": 14.4280, "lng": 43.6510},
        "المحويت": {"lat": 15.4710, "lng": 43.5430},
        "سقطرى": {"lat": 12.6340, "lng": 53.9058},
    }
    projects = db.query(Project).all()
    locations = {}
    for p in projects:
        gov = p.governorate or "غير محدد"
        if gov not in locations:
            coords = YEMEN_GOVERNORATES.get(gov, {"lat": 15.0, "lng": 44.0})
            locations[gov] = {
                "governorate": gov,
                "lat": coords["lat"],
                "lng": coords["lng"],
                "projects": 0,
                "beneficiaries": 0,
                "budget": 0,
                "project_names": [],
            }
        locations[gov]["projects"] += 1
        locations[gov]["budget"] += p.budget or 0
        locations[gov]["project_names"].append(p.name)
        bcount = db.query(func.count(func.distinct(DistributionItem.beneficiary_id))).join(
            Distribution, DistributionItem.distribution_id == Distribution.id
        ).filter(Distribution.project_id == p.id).scalar() or 0
        locations[gov]["beneficiaries"] += bcount

    return {
        "locations": list(locations.values()),
        "governorate_coords": YEMEN_GOVERNORATES,
    }
