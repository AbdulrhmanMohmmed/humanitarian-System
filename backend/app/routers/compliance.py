from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import date
from app.database import get_db
from app.models import ComplianceAssessment, ComplianceArea, ComplianceStatus, User
from app.auth import get_current_user

router = APIRouter(prefix="/api/compliance", tags=["الامتثال والجودة"])


COMPLIANCE_STANDARDS = {
    "chs": {
        "name": "المعيار الإنساني الأساسي (CHS)",
        "requirements": [
            {"code": "CHS-1", "standard": "CHS 1", "requirement": "الاستجابة الإنسانية مناسبة وملائمة"},
            {"code": "CHS-2", "standard": "CHS 2", "requirement": "الاستجابة فعالة وفي الوقت المناسب"},
            {"code": "CHS-3", "standard": "CHS 3", "requirement": "الاستجابة تعزز القدرات المحلية"},
            {"code": "CHS-4", "standard": "CHS 4", "requirement": "الاستجابة مبنية على التواصل والمشاركة"},
            {"code": "CHS-5", "standard": "CHS 5", "requirement": "الشكاوى يتم الترحيب بها ومعالجتها"},
            {"code": "CHS-6", "standard": "CHS 6", "requirement": "الاستجابة منسقة ومتكاملة"},
            {"code": "CHS-7", "standard": "CHS 7", "requirement": "الجهات الفاعلة تتعلم وتتحسن باستمرار"},
            {"code": "CHS-8", "standard": "CHS 8", "requirement": "الموظفون مدعومون ومؤهلون"},
            {"code": "CHS-9", "standard": "CHS 9", "requirement": "الموارد تدار بكفاءة وأخلاقية"},
        ],
    },
    "aap": {
        "name": "المساءلة أمام السكان المتضررين (AAP)",
        "requirements": [
            {"code": "AAP-1", "standard": "القيادة", "requirement": "الالتزام المؤسسي بالمساءلة على مستوى القيادة"},
            {"code": "AAP-2", "standard": "الشفافية", "requirement": "مشاركة المعلومات بشكل استباقي مع المتضررين"},
            {"code": "AAP-3", "standard": "التغذية الراجعة", "requirement": "آليات فعالة لاستقبال ومعالجة الشكاوى"},
            {"code": "AAP-4", "standard": "المشاركة", "requirement": "إشراك المجتمع في تصميم وتنفيذ البرامج"},
            {"code": "AAP-5", "standard": "التصميم", "requirement": "البرامج مصممة بناءً على احتياجات المتضررين"},
        ],
    },
    "psea": {
        "name": "الحماية من الاستغلال والانتهاك الجنسي (PSEA)",
        "requirements": [
            {"code": "PSEA-1", "standard": "السياسات", "requirement": "وجود سياسة PSEA واضحة ومعتمدة"},
            {"code": "PSEA-2", "standard": "التدريب", "requirement": "تدريب جميع الموظفين على PSEA"},
            {"code": "PSEA-3", "standard": "الإبلاغ", "requirement": "آلية إبلاغ آمنة وسرية"},
            {"code": "PSEA-4", "standard": "التحقيق", "requirement": "إجراءات تحقيق واستجابة واضحة"},
            {"code": "PSEA-5", "standard": "المساءلة", "requirement": "تطبيق عواقب على المنتهكين"},
            {"code": "PSEA-6", "standard": "دعم الضحايا", "requirement": "توفير دعم ومساعدة للضحايا"},
        ],
    },
    "do_no_harm": {
        "name": "لا ضرر (Do No Harm)",
        "requirements": [
            {"code": "DNH-1", "standard": "تحليل النزاع", "requirement": "إجراء تحليل سياق ونزاع منتظم"},
            {"code": "DNH-2", "standard": "التأثير", "requirement": "تقييم تأثير البرامج على ديناميكيات النزاع"},
            {"code": "DNH-3", "standard": "التكيف", "requirement": "تعديل البرامج لتجنب الآثار السلبية"},
        ],
    },
    "data_protection": {
        "name": "حماية البيانات",
        "requirements": [
            {"code": "DP-1", "standard": "الموافقة", "requirement": "الحصول على موافقة مستنيرة لجمع البيانات"},
            {"code": "DP-2", "standard": "التخزين", "requirement": "تخزين البيانات بشكل آمن ومشفر"},
            {"code": "DP-3", "standard": "الوصول", "requirement": "تقييد الوصول للبيانات حسب الحاجة"},
            {"code": "DP-4", "standard": "المشاركة", "requirement": "بروتوكول واضح لمشاركة البيانات"},
            {"code": "DP-5", "standard": "الحذف", "requirement": "سياسة احتفاظ وحذف البيانات"},
        ],
    },
    "donor_compliance": {
        "name": "امتثال المانحين",
        "requirements": [
            {"code": "DC-1", "standard": "التقارير", "requirement": "تقديم التقارير في المواعيد المحددة"},
            {"code": "DC-2", "standard": "المالية", "requirement": "الالتزام بالميزانية المعتمدة"},
            {"code": "DC-3", "standard": "المشتريات", "requirement": "اتباع إجراءات المشتريات المطلوبة"},
            {"code": "DC-4", "standard": "الرصد", "requirement": "نظام متابعة وتقييم فعال"},
            {"code": "DC-5", "standard": "التدقيق", "requirement": "إجراء تدقيق مالي وبرامجي"},
        ],
    },
}


@router.get("/standards")
def get_standards(current_user: User = Depends(get_current_user)):
    return COMPLIANCE_STANDARDS


@router.get("/")
def list_assessments(
    project_id: Optional[int] = None,
    area: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(ComplianceAssessment)
    if project_id:
        query = query.filter(ComplianceAssessment.project_id == project_id)
    if area:
        query = query.filter(ComplianceAssessment.area == area)
    items = query.order_by(ComplianceAssessment.created_at.desc()).all()
    return [
        {
            "id": a.id, "project_id": a.project_id,
            "area": a.area.value if a.area else None,
            "standard": a.standard, "requirement": a.requirement,
            "status": a.status.value if a.status else None,
            "score": a.score, "evidence": a.evidence, "gaps": a.gaps,
            "action_plan": a.action_plan, "responsible_person": a.responsible_person,
            "deadline": a.deadline.isoformat() if a.deadline else None,
            "assessment_date": a.assessment_date.isoformat() if a.assessment_date else None,
        }
        for a in items
    ]


@router.post("/assess")
def create_assessment(
    project_id: int,
    area: str,
    standard: str,
    requirement: str,
    status: str = "not_assessed",
    score: int = 0,
    evidence: Optional[str] = None,
    gaps: Optional[str] = None,
    action_plan: Optional[str] = None,
    responsible_person: Optional[str] = None,
    deadline: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    assessment = ComplianceAssessment(
        project_id=project_id,
        area=ComplianceArea(area),
        standard=standard, requirement=requirement,
        status=ComplianceStatus(status), score=score,
        evidence=evidence, gaps=gaps, action_plan=action_plan,
        responsible_person=responsible_person,
        deadline=date.fromisoformat(deadline) if deadline else None,
        assessed_by=current_user.id,
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    return {"id": assessment.id, "message": "تم إنشاء التقييم"}


@router.put("/{assessment_id}")
def update_assessment(
    assessment_id: int,
    status: Optional[str] = None,
    score: Optional[int] = None,
    evidence: Optional[str] = None,
    gaps: Optional[str] = None,
    action_plan: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    a = db.query(ComplianceAssessment).filter(ComplianceAssessment.id == assessment_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="التقييم غير موجود")
    if status:
        a.status = ComplianceStatus(status)
    if score is not None:
        a.score = score
    if evidence:
        a.evidence = evidence
    if gaps:
        a.gaps = gaps
    if action_plan:
        a.action_plan = action_plan
    db.commit()
    return {"message": "تم تحديث التقييم"}


@router.get("/dashboard/{project_id}")
def compliance_dashboard(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    areas_summary = []
    for area in ComplianceArea:
        assessments = db.query(ComplianceAssessment).filter(
            ComplianceAssessment.project_id == project_id,
            ComplianceAssessment.area == area,
        ).all()
        if not assessments:
            areas_summary.append({"area": area.value, "assessed": 0, "score": 0, "status": "not_assessed"})
            continue
        total = len(assessments)
        compliant = sum(1 for a in assessments if a.status == ComplianceStatus.COMPLIANT)
        partial = sum(1 for a in assessments if a.status == ComplianceStatus.PARTIALLY_COMPLIANT)
        avg_score = sum(a.score for a in assessments) / total if total else 0
        overall = "compliant" if compliant == total else ("partially_compliant" if compliant + partial > 0 else "non_compliant")
        areas_summary.append({
            "area": area.value, "assessed": total,
            "compliant": compliant, "partial": partial,
            "non_compliant": total - compliant - partial,
            "avg_score": round(avg_score, 1), "status": overall,
        })
    return {"project_id": project_id, "areas": areas_summary}
