from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from datetime import datetime
import random
import string
from app.database import get_db
from app.models import SafeguardingReport, CHSAssessment, User
from app.schemas import (
    SafeguardingCreate, SafeguardingOut,
    CHSAssessmentCreate, CHSAssessmentOut
)
from app.auth import get_current_user

router = APIRouter(prefix="/safeguarding", tags=["الحماية والامتثال"])

CHS_LABELS = {
    "chs1": "الاستجابة المناسبة وذات الصلة",
    "chs2": "الفعالية وحسن التوقيت",
    "chs3": "تعزيز القدرات المحلية",
    "chs4": "التواصل والمشاركة والشفافية",
    "chs5": "معالجة الشكاوى والملاحظات",
    "chs6": "التنسيق والتكامل",
    "chs7": "التعلم والتحسين المستمر",
    "chs8": "الموظفون الأكفاء والمُدارون بشكل جيد",
    "chs9": "إدارة الموارد بمسؤولية",
}


def _gen_sg_ref():
    return f"SG-{datetime.utcnow().strftime('%Y%m')}-{''.join(random.choices(string.digits, k=6))}"


@router.get("/reports", response_model=List[SafeguardingOut])
def list_reports(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(SafeguardingReport)
    if status:
        query = query.filter(SafeguardingReport.status == status)
    return query.order_by(SafeguardingReport.created_at.desc()).all()


@router.post("/reports", response_model=SafeguardingOut)
def create_report(
    data: SafeguardingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    for attempt in range(5):
        report = SafeguardingReport(
            reference_number=_gen_sg_ref(),
            **data.model_dump(),
            reported_by=current_user.id,
        )
        db.add(report)
        try:
            db.commit()
            db.refresh(report)
            return report
        except IntegrityError:
            db.rollback()
    raise HTTPException(status_code=400, detail="فشل في إنشاء البلاغ بسبب خطأ في البيانات")


@router.put("/reports/{report_id}/status")
def update_report_status(
    report_id: int,
    status: str,
    action_taken: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    report = db.query(SafeguardingReport).filter(SafeguardingReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="البلاغ غير موجود")
    report.status = status
    if action_taken:
        report.action_taken = action_taken
    db.commit()
    return {"detail": "تم تحديث الحالة"}


# -- CHS Compliance --

@router.get("/chs", response_model=List[CHSAssessmentOut])
def list_chs(
    project_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(CHSAssessment)
    if project_id:
        query = query.filter(CHSAssessment.project_id == project_id)
    return query.order_by(CHSAssessment.created_at.desc()).all()


@router.post("/chs", response_model=CHSAssessmentOut)
def create_chs(
    data: CHSAssessmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    assessment = CHSAssessment(**data.model_dump(), assessed_by=current_user.id)
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    return assessment


@router.get("/chs/summary")
def chs_summary(
    project_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(CHSAssessment)
    if project_id:
        query = query.filter(CHSAssessment.project_id == project_id)
    assessments = query.all()
    summary = {}
    for a in assessments:
        key = a.commitment.value
        if key not in summary or a.assessment_date > summary[key]["date"]:
            summary[key] = {
                "commitment": key,
                "label": CHS_LABELS.get(key, key),
                "score": a.score,
                "date": a.assessment_date,
                "gaps": a.gaps,
                "action_plan": a.action_plan,
            }
    return {
        "commitments": list(summary.values()),
        "average_score": round(sum(s["score"] for s in summary.values()) / len(summary), 1) if summary else 0,
        "labels": CHS_LABELS,
    }
