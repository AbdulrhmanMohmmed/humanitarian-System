from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from app.database import get_db
from app.models import FieldVisit, FieldVisitStatus, User
from app.auth import get_current_user

router = APIRouter(prefix="/api/field-visits", tags=["الزيارات الميدانية"])


@router.get("/")
def list_visits(
    project_id: Optional[int] = None,
    status: Optional[str] = None,
    governorate: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(FieldVisit)
    if project_id:
        query = query.filter(FieldVisit.project_id == project_id)
    if status:
        query = query.filter(FieldVisit.status == status)
    if governorate:
        query = query.filter(FieldVisit.governorate == governorate)
    visits = query.order_by(FieldVisit.visit_date.desc()).all()
    return [
        {
            "id": v.id, "title": v.title, "project_id": v.project_id,
            "visit_date": v.visit_date.isoformat() if v.visit_date else None,
            "location": v.location, "governorate": v.governorate, "district": v.district,
            "gps_lat": v.gps_lat, "gps_lng": v.gps_lng,
            "team_members": v.team_members, "objectives": v.objectives,
            "checklist": v.checklist, "observations": v.observations,
            "findings": v.findings, "recommendations": v.recommendations,
            "corrective_actions": v.corrective_actions, "photos": v.photos,
            "status": v.status.value if v.status else None,
            "visit_type": v.visit_type,
            "follow_up_date": v.follow_up_date.isoformat() if v.follow_up_date else None,
            "created_at": v.created_at.isoformat() if v.created_at else None,
        }
        for v in visits
    ]


@router.post("/")
def create_visit(
    title: str,
    visit_date: str,
    project_id: Optional[int] = None,
    location: Optional[str] = None,
    governorate: Optional[str] = None,
    district: Optional[str] = None,
    gps_lat: Optional[float] = None,
    gps_lng: Optional[float] = None,
    team_members: Optional[str] = None,
    objectives: Optional[str] = None,
    visit_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    visit = FieldVisit(
        title=title, project_id=project_id,
        visit_date=date.fromisoformat(visit_date),
        location=location, governorate=governorate, district=district,
        gps_lat=gps_lat, gps_lng=gps_lng,
        team_members=team_members, objectives=objectives,
        visit_type=visit_type, created_by=current_user.id,
    )
    db.add(visit)
    db.commit()
    db.refresh(visit)
    return {"id": visit.id, "message": "تم إنشاء الزيارة بنجاح"}


@router.put("/{visit_id}")
def update_visit(
    visit_id: int,
    observations: Optional[str] = None,
    findings: Optional[str] = None,
    recommendations: Optional[str] = None,
    corrective_actions: Optional[str] = None,
    checklist: Optional[str] = None,
    status: Optional[str] = None,
    follow_up_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    visit = db.query(FieldVisit).filter(FieldVisit.id == visit_id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="الزيارة غير موجودة")
    if observations is not None:
        visit.observations = observations
    if findings is not None:
        visit.findings = findings
    if recommendations is not None:
        visit.recommendations = recommendations
    if corrective_actions is not None:
        visit.corrective_actions = corrective_actions
    if checklist is not None:
        visit.checklist = checklist
    if status is not None:
        visit.status = FieldVisitStatus(status)
    if follow_up_date is not None:
        visit.follow_up_date = date.fromisoformat(follow_up_date)
    db.commit()
    return {"message": "تم تحديث الزيارة"}


@router.delete("/{visit_id}")
def delete_visit(
    visit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    visit = db.query(FieldVisit).filter(FieldVisit.id == visit_id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="الزيارة غير موجودة")
    db.delete(visit)
    db.commit()
    return {"message": "تم حذف الزيارة"}


@router.get("/checklists")
def get_visit_checklists(current_user: User = Depends(get_current_user)):
    return {
        "monitoring": {
            "name": "قائمة مراقبة عامة",
            "items": [
                "هل الأنشطة تتم وفقاً للخطة؟",
                "هل المستفيدون يتلقون الخدمات المتوقعة؟",
                "هل جودة الخدمات مقبولة؟",
                "هل هناك شكاوى أو ملاحظات؟",
                "هل آلية الشكاوى معروفة ومتاحة؟",
                "هل يتم توثيق البيانات بشكل صحيح؟",
                "هل هناك مخاطر حماية ملاحظة؟",
                "هل معايير الجودة مطبقة؟",
            ],
        },
        "distribution": {
            "name": "مراقبة التوزيعات",
            "items": [
                "هل القوائم محدثة ودقيقة؟",
                "هل المواد متوفرة بالكمية الكافية؟",
                "هل عملية التسجيل منظمة؟",
                "هل يتم التحقق من هوية المستفيدين؟",
                "هل المواد تصل للمستفيد الصحيح؟",
                "هل هناك آلية شكاوى في الموقع؟",
                "هل هناك اعتبارات حماية مطبقة؟",
            ],
        },
        "site_verification": {
            "name": "التحقق من المواقع",
            "items": [
                "هل الموقع مطابق للمعلومات المسجلة؟",
                "هل البنية التحتية سليمة؟",
                "هل الخدمات متوفرة ومتاحة؟",
                "هل إجراءات السلامة مطبقة؟",
                "هل الموقع مناسب للمجموعات المستضعفة؟",
            ],
        },
        "pdm": {
            "name": "مراقبة ما بعد التوزيع (PDM)",
            "items": [
                "هل استلمت المساعدة المحددة؟",
                "هل المساعدة مناسبة لاحتياجاتك؟",
                "هل تشعر بالرضا عن الخدمة؟",
                "هل واجهت أي مشاكل في الاستلام؟",
                "هل تعرف كيفية تقديم شكوى؟",
                "هل شاركت المساعدة مع أحد؟",
            ],
        },
    }
