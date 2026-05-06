from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import (
    Activity,
    AuditLog,
    Beneficiary,
    CHSAssessment,
    Complaint,
    DataCollectionForm,
    DataQualityAssessment,
    DataQualityFinding,
    Document,
    FieldVisit,
    FormSubmission,
    Indicator,
    IndicatorReference,
    IPTTEntry,
    LessonLearned,
    LogFrame,
    MEALPlan,
    NeedsAssessment,
    OperatingAuditEvent,
    Project,
    Recommendation,
    Risk,
    SectorIndicator,
    User,
    WorkflowApproval,
)

router = APIRouter(prefix="/api/strategic-review", tags=["Strategic Review"])


def _count(db: Session, model) -> int:
    return db.query(model).count()


def _status(score: int) -> str:
    if score >= 85:
        return "complete"
    if score >= 55:
        return "implemented"
    if score >= 25:
        return "partial"
    return "planned"


def _item(number, title, score, evidence, gaps, route):
    return {
        "number": number,
        "title": title,
        "score": score,
        "status": _status(score),
        "evidence": evidence,
        "gaps": gaps,
        "route": route,
    }


@router.get("/")
def strategic_review(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    counts = {
        "projects": _count(db, Project),
        "activities": _count(db, Activity),
        "indicators": _count(db, Indicator),
        "indicator_references": _count(db, IndicatorReference),
        "beneficiaries": _count(db, Beneficiary),
        "complaints": _count(db, Complaint),
        "risks": _count(db, Risk),
        "lessons": _count(db, LessonLearned),
        "recommendations": _count(db, Recommendation),
        "logframes": _count(db, LogFrame),
        "iptt": _count(db, IPTTEntry),
        "forms": _count(db, DataCollectionForm),
        "submissions": _count(db, FormSubmission),
        "dqa": _count(db, DataQualityAssessment),
        "dq_findings": _count(db, DataQualityFinding),
        "field_visits": _count(db, FieldVisit),
        "needs_assessments": _count(db, NeedsAssessment),
        "chs": _count(db, CHSAssessment),
        "documents": _count(db, Document),
        "audit": _count(db, AuditLog) + _count(db, OperatingAuditEvent),
        "sector_indicators": _count(db, SectorIndicator),
        "meal_plans": _count(db, MEALPlan),
        "approvals": _count(db, WorkflowApproval),
    }

    items = [
        _item(1, "المقدمة والسياق", 90, ["تم اعتماد هوية HIAOS وخارطة طريق داخل docs", "القائمة منظمة حسب الرؤية"], ["تحويل الرؤية إلى صفحة تعريفية عامة للمانحين"], "/watchtower"),
        _item(2, "Gap Analysis – Deep Layer", 68, ["Watchtower", "محركات جودة وموافقات وتدقيق", f"{counts['dq_findings']} ملاحظات جودة"], ["توسيع التحليل السببي الآلي"], "/watchtower"),
        _item(3, "System Philosophy", 65, ["برج مراقبة تنفيذي", "تنظيم النظام كطبقات تشغيل"], ["إضافة حلقات تصحيح تلقائية حقيقية"], "/watchtower"),
        _item(4, "الهيكل المؤسسي والصلاحيات", 42, ["أدوار مستخدمين أساسية", "JWT"], ["RBAC دقيق", "ABAC حسب المشروع والموقع والحساسية"], "/audit"),
        _item(5, "Data Model – Core Design", 72, [f"{counts['projects']} مشاريع", f"{counts['activities']} أنشطة", f"{counts['indicators']} مؤشرات", f"{counts['beneficiaries']} مستفيدين"], ["Household وPartner ككيانات مستقلة", "Graph Layer"], "/projects"),
        _item(6, "Core Engines", 60, ["محرك مؤشرات", "محرك جودة", "محرك مساءلة", "تعلم وتوصيات"], ["Forecasting", "Behavioral detection", "NLP learning"], "/monitoring"),
        _item(7, "التحليل المتقدم", 55, ["Executive dashboard", "Analytics", "AI insights"], ["Cohort analysis", "GIS heatmaps", "Sentiment analysis"], "/analytics"),
        _item(8, "إدارة التقييمات", 58, [f"{counts['needs_assessments']} تقييم احتياج", "Evaluation tools", "Assessment tools"], ["Attribution/Contribution analysis"], "/evaluation"),
        _item(9, "Early Warning System", 62, ["Watchtower يحسب مخاطر تشغيلية", f"{counts['risks']} مخاطر"], ["تنبيهات تلقائية وقواعد escalation أعمق"], "/watchtower"),
        _item(10, "نظام CFM المتقدم", 58, [f"{counts['complaints']} شكاوى", "حساسية وتصعيد وردود"], ["WhatsApp/SMS/Hotline connectors", "AI classifier"], "/accountability"),
        _item(11, "الامتثال والحوكمة", 60, [f"{counts['chs']} تقييم CHS", f"{counts['audit']} أحداث تدقيق"], ["Data ownership lifecycle", "Evidence workflows"], "/compliance"),
        _item(12, "الأمن السيبراني", 32, ["JWT", "CORS", "Audit trail"], ["MFA", "Zero Trust", "IDS", "تشفير at-rest"], "/audit"),
        _item(13, "Offline Architecture", 38, ["Offline page", "KoBo connector page"], ["Local DB mobile", "Sync engine", "Conflict resolver"], "/offline"),
        _item(14, "الذكاء الاصطناعي", 40, ["AI Insights", "Decision Support", "AI assistant"], ["نماذج فعلية للـ NLP والتنبؤ والشذوذ"], "/ai-insights"),
        _item(15, "Marketplace Ecosystem", 35, ["Sector indicators", "Assessment templates pages"], ["Marketplace مستقل للقوالب والنماذج"], "/sector-indicators"),
        _item(16, "الأداء والتوسع", 25, ["FastAPI monolith يعمل محليا", "Build مستقر"], ["Microservices", "Caching", "Load balancing", "Kubernetes"], "/integrations"),
        _item(17, "Integrations", 48, ["KoBo", "Integrations", "Scheduled reports"], ["ActivityInfo", "Power BI", "ERP", "SMS gateways APIs"], "/integrations"),
        _item(18, "مؤشرات أداء النظام نفسه", 67, ["Operating score", "Data quality findings", "Complaint/risk counters"], ["Reporting time", "Accuracy trend", "Resolution rate trends"], "/watchtower"),
        _item(19, "Roadmap", 85, ["وثيقة HIAOS roadmap موجودة", "مراحل MVP/AI/Scaling محددة"], ["ربط roadmap بلوحة تنفيذ زمنية"], "/documents"),
        _item(20, "نموذج الأعمال", 20, ["غير تشغيلي داخل المنتج"], ["SaaS plans", "Enterprise licensing", "NGO packages"], "/documents"),
        _item(21, "المخاطر والتحليل", 62, [f"{counts['risks']} مخاطر", "Risk management", "Watchtower"], ["مصفوفة احتمال/أثر ديناميكية وتوصيات تلقائية"], "/risks"),
        _item(22, "الخاتمة والقيمة النهائية", 82, ["هوية HIAOS", "تحويل الشكاوى والمؤشرات والجودة إلى قرار"], ["صفحة عرض تنفيذية للمانحين"], "/watchtower"),
    ]

    average = round(sum(item["score"] for item in items) / len(items), 1)
    by_status = {}
    for item in items:
        by_status[item["status"]] = by_status.get(item["status"], 0) + 1

    return {
        "summary": {
            "overall_score": average,
            "total_items": len(items),
            "by_status": by_status,
            "evidence_counts": counts,
        },
        "items": items,
    }
