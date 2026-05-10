"""CHS 2024 compliance tracker endpoints."""

from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.middleware.error_handler import NotFoundError
from app.models import User
from app.models.chs import CHSAssessmentItem, CHSCommitment

router = APIRouter(prefix="/chs", tags=["CHS Compliance"])

CHS_COMMITMENTS = [
    (1, "Communities and people affected by crisis receive assistance appropriate and relevant to their needs.",
     "تتلقى المجتمعات والأشخاص المتأثرون بالأزمات مساعدات مناسبة وذات صلة باحتياجاتهم."),
    (2, "Communities and people affected by crisis have access to the humanitarian assistance they need at the right time.",
     "يحصل المتأثرون على المساعدات الإنسانية التي يحتاجونها في الوقت المناسب."),
    (3, "Communities and people affected by crisis are not negatively affected and are more prepared, resilient and less at-risk as a result of humanitarian action.",
     "لا يتأثر المتأثرون سلباً وتزداد قدرتهم على الصمود نتيجة العمل الإنساني."),
    (4, "Communities and people affected by crisis know their rights and entitlements, have access to information and participate in decisions that affect them.",
     "يعرف المتأثرون حقوقهم ويشاركون في القرارات التي تؤثر عليهم."),
    (5, "Communities and people affected by crisis have access to safe and responsive mechanisms to handle complaints.",
     "يحصل المتأثرون على آليات آمنة وسريعة الاستجابة للتعامل مع الشكاوى."),
    (6, "Communities and people affected by crisis receive coordinated, complementary assistance.",
     "يتلقى المتأثرون مساعدات منسقة ومتكاملة."),
    (7, "Communities and people affected by crisis can expect delivery of improved assistance as organisations learn from experience and reflection.",
     "يتوقع المتأثرون تحسن المساعدات مع تعلم المنظمات من التجربة."),
    (8, "Communities and people affected by crisis receive the assistance they require from competent and well-managed staff and volunteers.",
     "يتلقى المتأثرون المساعدات من موظفين أكفاء ومُدارين بشكل جيد."),
    (9, "Communities and people affected by crisis can expect that the organisations assisting them are managing resources effectively, efficiently and ethically.",
     "يتوقع المتأثرون أن المنظمات تدير الموارد بفعالية وكفاءة وأخلاقية."),
]


@router.post("/seed-commitments")
def seed_chs_commitments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Initialize the 9 CHS commitments in the database."""
    existing = db.query(CHSCommitment).count()
    if existing >= 9:
        return {"message": "CHS commitments already seeded", "count": existing}
    for num, title_en, title_ar in CHS_COMMITMENTS:
        c = CHSCommitment(number=num, title_en=title_en, title_ar=title_ar)
        db.add(c)
    db.commit()
    return {"message": "9 CHS commitments seeded successfully"}


@router.get("/commitments")
def list_commitments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(CHSCommitment).order_by(CHSCommitment.number).all()


class AssessmentInput(BaseModel):
    commitment_id: int
    assessment_period: str
    score: float
    evidence: Optional[str] = None
    notes: Optional[str] = None


@router.post("/assess")
def assess_commitment(
    body: AssessmentInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    commitment = db.query(CHSCommitment).filter(CHSCommitment.id == body.commitment_id).first()
    if not commitment:
        raise NotFoundError("CHSCommitment", body.commitment_id)
    item = CHSAssessmentItem(
        commitment_id=body.commitment_id,
        assessment_period=body.assessment_period,
        score=body.score,
        evidence=body.evidence,
        notes=body.notes,
        assessor_id=current_user.id,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("/dashboard")
def chs_dashboard(
    period: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return overall CHS compliance dashboard with scores per commitment."""
    commitments = db.query(CHSCommitment).order_by(CHSCommitment.number).all()
    result = []
    for c in commitments:
        query = db.query(CHSAssessmentItem).filter(CHSAssessmentItem.commitment_id == c.id)
        if period:
            query = query.filter(CHSAssessmentItem.assessment_period == period)
        latest = query.order_by(CHSAssessmentItem.created_at.desc()).first()
        result.append({
            "commitment_number": c.number,
            "title_en": c.title_en,
            "title_ar": c.title_ar,
            "score": latest.score if latest else 0,
            "max_score": latest.max_score if latest else 5,
            "evidence": latest.evidence if latest else None,
            "last_assessed": latest.created_at.isoformat() if latest else None,
        })
    total_score = sum(r["score"] for r in result)
    max_total = sum(r["max_score"] for r in result)
    return {
        "commitments": result,
        "total_score": total_score,
        "max_total": max_total,
        "compliance_percentage": round(total_score / max_total * 100, 1) if max_total else 0,
    }
