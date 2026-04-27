from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import NeedsAssessment, User
from app.schemas import NeedsAssessmentCreate, NeedsAssessmentOut
from app.auth import get_current_user

router = APIRouter(prefix="/api/needs-assessment", tags=["تقييم الاحتياجات"])

SECTOR_TEMPLATES = {
    "WASH": {
        "name": "المياه والصرف الصحي والنظافة",
        "indicators": ["مصادر المياه", "جودة المياه", "المراحيض", "النظافة", "إدارة النفايات"],
        "questions": ["ما المصدر الرئيسي للمياه؟", "هل المياه كافية؟", "هل توجد مراحيض كافية؟", "هل تتوفر مواد النظافة؟"],
    },
    "FSL": {
        "name": "الأمن الغذائي وسبل العيش",
        "indicators": ["مصادر الغذاء", "التنوع الغذائي", "الدخل", "الأصول", "استراتيجيات التأقلم"],
        "questions": ["كم وجبة يتناول أفراد الأسرة يومياً؟", "ما مصادر الدخل الرئيسية؟", "هل يوجد مخزون غذائي؟"],
    },
    "Protection": {
        "name": "الحماية",
        "indicators": ["حركة النزوح", "الوثائق", "العنف", "الأطفال غير المصحوبين", "الحالة القانونية"],
        "questions": ["هل تشعر بالأمان في مكان إقامتك؟", "هل لديك وثائق هوية؟", "هل يوجد أطفال غير مصحوبين؟"],
    },
    "Health": {
        "name": "الصحة",
        "indicators": ["الوصول للخدمات", "الأمراض الشائعة", "التطعيمات", "صحة الأم والطفل", "الصحة النفسية"],
        "questions": ["ما أقرب مرفق صحي؟", "هل الأطفال محصنون؟", "هل يوجد حالات أمراض مزمنة؟"],
    },
    "Education": {
        "name": "التعليم",
        "indicators": ["الالتحاق", "الحضور", "المعلمون", "المرافق", "مواد التعلم"],
        "questions": ["هل الأطفال ملتحقون بالمدارس؟", "ما أسباب عدم الالتحاق؟", "ما حالة المدارس؟"],
    },
    "Shelter": {
        "name": "المأوى",
        "indicators": ["نوع المأوى", "الحالة", "الحيازة", "المساحة", "المرافق"],
        "questions": ["ما نوع المأوى؟", "هل المأوى آمن؟", "هل يوجد مشاكل في السكن؟"],
    },
}


@router.get("/", response_model=List[NeedsAssessmentOut])
def list_assessments(
    project_id: Optional[int] = None,
    sector: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(NeedsAssessment)
    if project_id:
        query = query.filter(NeedsAssessment.project_id == project_id)
    if sector:
        query = query.filter(NeedsAssessment.sector == sector)
    return query.order_by(NeedsAssessment.created_at.desc()).all()


@router.post("/", response_model=NeedsAssessmentOut)
def create_assessment(
    data: NeedsAssessmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    assessment = NeedsAssessment(**data.model_dump(), created_by=current_user.id)
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    return assessment


@router.delete("/{assessment_id}")
def delete_assessment(
    assessment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    a = db.query(NeedsAssessment).filter(NeedsAssessment.id == assessment_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="التقييم غير موجود")
    db.delete(a)
    db.commit()
    return {"detail": "تم حذف التقييم"}


@router.get("/templates")
def get_templates(current_user: User = Depends(get_current_user)):
    return SECTOR_TEMPLATES


@router.get("/templates/{sector}")
def get_template(sector: str, current_user: User = Depends(get_current_user)):
    template = SECTOR_TEMPLATES.get(sector)
    if not template:
        raise HTTPException(status_code=404, detail="القالب غير موجود")
    return template
