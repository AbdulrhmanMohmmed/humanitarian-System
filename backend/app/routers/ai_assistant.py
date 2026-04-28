from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import datetime, timedelta
from app.database import get_db
from app.models import (
    User, Project, Indicator, Measurement, Complaint, ComplaintStatus,
    ComplaintCategory, FieldVisit, Recommendation, RecommendationStatus,
    Risk, RiskStatus, LessonLearned, Distribution, IPTTEntry,
    ComplianceAssessment, ProjectStatus
)
from app.auth import get_current_user

router = APIRouter(prefix="/api/ai", tags=["AI Assistant"])


def _analyze_indicator_trend(values):
    if len(values) < 2:
        return "insufficient_data"
    recent = values[-3:] if len(values) >= 3 else values
    if all(recent[i] <= recent[i + 1] for i in range(len(recent) - 1)):
        return "improving"
    if all(recent[i] >= recent[i + 1] for i in range(len(recent) - 1)):
        return "declining"
    return "fluctuating"


def _generate_corrective_actions(issue_type, context):
    actions = {
        "low_achievement": [
            "مراجعة خطة العمل وتعديل الجدول الزمني",
            "زيادة الموارد المخصصة للنشاط",
            "تكثيف المتابعة الميدانية",
            "عقد اجتماع تنسيقي مع الشركاء المنفذين",
        ],
        "high_complaints": [
            "تحليل أسباب الشكاوى المتكررة",
            "تحسين آلية التواصل مع المستفيدين",
            "مراجعة معايير الاستهداف",
            "تعزيز آلية المساءلة وCFM",
        ],
        "overdue_recommendations": [
            "متابعة مع المسؤولين عن تنفيذ التوصيات",
            "تصعيد التوصيات المتأخرة للإدارة العليا",
            "إعادة تقييم أولويات التوصيات",
            "تخصيص موارد إضافية للتنفيذ",
        ],
        "high_risk": [
            "تفعيل خطة الطوارئ",
            "إبلاغ المانحين بتحديث المخاطر",
            "مراجعة إجراءات التخفيف الحالية",
            "تقييم تأثير المخاطر على الأهداف",
        ],
        "compliance_gap": [
            "إجراء تقييم ذاتي للامتثال",
            "تطوير خطة عمل تصحيحية",
            "تدريب الموظفين على المعايير",
            "توثيق الأدلة والممارسات",
        ],
    }
    return actions.get(issue_type, ["مراجعة الوضع الحالي واتخاذ إجراءات مناسبة"])


@router.get("/auto-report/{project_id}")
def generate_auto_report(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """AI-generated monthly MEAL report with analysis and recommendations"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="المشروع غير موجود")

    now = datetime.utcnow()
    month_ago = now - timedelta(days=30)

    indicators = db.query(Indicator).filter(Indicator.project_id == project_id).all()
    indicator_analysis = []
    for ind in indicators:
        measurements = db.query(Measurement).filter(
            Measurement.indicator_id == ind.id
        ).order_by(Measurement.date).all()
        values = [m.value for m in measurements]
        achievement = (ind.actual_value / ind.target_value * 100) if ind.target_value else 0
        trend = _analyze_indicator_trend(values)
        status = "on_track" if achievement >= 80 else "at_risk" if achievement >= 50 else "off_track"
        indicator_analysis.append({
            "name": ind.name, "target": ind.target_value, "actual": ind.actual_value,
            "achievement_pct": round(achievement, 1), "trend": trend, "status": status,
            "corrective_actions": _generate_corrective_actions("low_achievement", {}) if status == "off_track" else [],
        })

    complaints = db.query(Complaint).filter(Complaint.project_id == project_id, Complaint.created_at >= month_ago).all()
    complaint_analysis = {
        "total": len(complaints),
        "resolved": sum(1 for c in complaints if c.status == ComplaintStatus.RESOLVED),
        "pending": sum(1 for c in complaints if c.status in (ComplaintStatus.RECEIVED, ComplaintStatus.UNDER_REVIEW)),
        "by_category": {},
        "avg_resolution_days": 0,
        "sentiment": "neutral",
        "auto_recommendations": [],
    }
    for c in complaints:
        cat = c.category.value if c.category else "other"
        complaint_analysis["by_category"][cat] = complaint_analysis["by_category"].get(cat, 0) + 1

    if complaint_analysis["total"] > 10:
        complaint_analysis["sentiment"] = "negative"
        complaint_analysis["auto_recommendations"] = _generate_corrective_actions("high_complaints", {})
    elif complaint_analysis["total"] > 5:
        complaint_analysis["sentiment"] = "mixed"

    resolved_times = []
    for c in complaints:
        if c.status == ComplaintStatus.RESOLVED and c.resolution_date and c.created_at:
            days = (c.resolution_date - c.created_at).days
            resolved_times.append(days)
    if resolved_times:
        complaint_analysis["avg_resolution_days"] = round(sum(resolved_times) / len(resolved_times), 1)

    recommendations = db.query(Recommendation).filter(Recommendation.project_id == project_id).all()
    overdue = [r for r in recommendations if r.status == RecommendationStatus.OVERDUE or
               (r.deadline and r.deadline < now.date() and r.status not in (RecommendationStatus.COMPLETED, RecommendationStatus.CANCELLED))]
    rec_analysis = {
        "total": len(recommendations),
        "completed": sum(1 for r in recommendations if r.status == RecommendationStatus.COMPLETED),
        "overdue": len(overdue),
        "implementation_rate": round(sum(1 for r in recommendations if r.status == RecommendationStatus.COMPLETED) / len(recommendations) * 100, 1) if recommendations else 0,
        "auto_recommendations": _generate_corrective_actions("overdue_recommendations", {}) if overdue else [],
    }

    risks = db.query(Risk).filter(Risk.project_id == project_id, Risk.status != RiskStatus.RESOLVED).all()
    risk_analysis = {
        "total_active": len(risks),
        "high_risks": sum(1 for r in risks if r.impact and r.impact.value in ("major", "severe")),
        "auto_recommendations": [],
    }
    if risk_analysis["high_risks"] > 0:
        risk_analysis["auto_recommendations"] = _generate_corrective_actions("high_risk", {})

    overall_score = 0
    scores = []
    if indicator_analysis:
        avg_achievement = sum(i["achievement_pct"] for i in indicator_analysis) / len(indicator_analysis)
        scores.append(min(avg_achievement, 100))
    if complaint_analysis["total"] > 0:
        resolution_rate = complaint_analysis["resolved"] / complaint_analysis["total"] * 100
        scores.append(resolution_rate)
    if rec_analysis["total"] > 0:
        scores.append(rec_analysis["implementation_rate"])
    overall_score = round(sum(scores) / len(scores), 1) if scores else 0

    return {
        "report_type": "AI-Generated Monthly MEAL Report",
        "project": {"id": project.id, "name": project.name, "status": project.status.value if project.status else None},
        "period": {"from": month_ago.strftime("%Y-%m-%d"), "to": now.strftime("%Y-%m-%d")},
        "overall_score": overall_score,
        "overall_status": "good" if overall_score >= 80 else "needs_attention" if overall_score >= 60 else "critical",
        "executive_summary": {
            "indicators_on_track": sum(1 for i in indicator_analysis if i["status"] == "on_track"),
            "indicators_at_risk": sum(1 for i in indicator_analysis if i["status"] == "at_risk"),
            "indicators_off_track": sum(1 for i in indicator_analysis if i["status"] == "off_track"),
            "complaints_received": complaint_analysis["total"],
            "complaints_resolved": complaint_analysis["resolved"],
            "recommendations_overdue": rec_analysis["overdue"],
            "active_risks": risk_analysis["total_active"],
        },
        "indicator_analysis": indicator_analysis,
        "complaint_analysis": complaint_analysis,
        "recommendation_analysis": rec_analysis,
        "risk_analysis": risk_analysis,
        "generated_at": now.isoformat(),
    }


@router.get("/analyze-complaints")
def analyze_complaints(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """AI analysis of complaints patterns and trends"""
    since = datetime.utcnow() - timedelta(days=days)
    complaints = db.query(Complaint).filter(Complaint.created_at >= since).all()

    by_category = {}
    by_channel = {}
    by_governorate = {}
    by_week = {}
    sensitivity_dist = {"low": 0, "medium": 0, "high": 0, "critical": 0}

    for c in complaints:
        cat = c.category.value if c.category else "other"
        by_category[cat] = by_category.get(cat, 0) + 1
        ch = c.channel.value if c.channel else "other"
        by_channel[ch] = by_channel.get(ch, 0) + 1
        gov = c.complainant_location or "غير محدد"
        by_governorate[gov] = by_governorate.get(gov, 0) + 1
        if c.created_at:
            week = c.created_at.strftime("%Y-W%W")
            by_week[week] = by_week.get(week, 0) + 1
        if c.sensitivity_level:
            sensitivity_dist[c.sensitivity_level.value] = sensitivity_dist.get(c.sensitivity_level.value, 0) + 1

    top_category = max(by_category, key=by_category.get) if by_category else None
    top_governorate = max(by_governorate, key=by_governorate.get) if by_governorate else None

    patterns = []
    if top_category:
        patterns.append(f"أكثر فئة شكاوى: {top_category} ({by_category[top_category]} شكوى)")
    if top_governorate:
        patterns.append(f"أكثر محافظة شكاوى: {top_governorate} ({by_governorate[top_governorate]} شكوى)")
    if sensitivity_dist.get("critical", 0) > 0:
        patterns.append(f"يوجد {sensitivity_dist['critical']} شكوى حرجة تحتاج اهتمام فوري")

    weekly_counts = sorted(by_week.items())
    trend = "stable"
    if len(weekly_counts) >= 2:
        recent = [v for _, v in weekly_counts[-2:]]
        if recent[-1] > recent[0] * 1.5:
            trend = "increasing"
        elif recent[-1] < recent[0] * 0.5:
            trend = "decreasing"

    recommendations = []
    if by_category.get("targeting", 0) > 3:
        recommendations.append("مراجعة معايير الاستهداف - عدد كبير من شكاوى الاستهداف")
    if by_category.get("staff_behavior", 0) > 2:
        recommendations.append("تنظيم تدريبات على السلوك المهني للموظفين")
    if sensitivity_dist.get("critical", 0) > 0:
        recommendations.append("تصعيد الشكاوى الحرجة فوراً للإدارة العليا")
    if trend == "increasing":
        recommendations.append("الشكاوى في تزايد - يجب تحليل الأسباب الجذرية")

    return {
        "period_days": days,
        "total_complaints": len(complaints),
        "by_category": by_category,
        "by_channel": by_channel,
        "by_governorate": by_governorate,
        "by_week": by_week,
        "sensitivity_distribution": sensitivity_dist,
        "patterns": patterns,
        "trend": trend,
        "auto_recommendations": recommendations,
    }


@router.get("/risk-detection/{project_id}")
def detect_risks(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """AI-powered implementation risk detection"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="المشروع غير موجود")

    detected_risks = []

    if project.end_date and project.end_date < datetime.utcnow().date():
        detected_risks.append({
            "type": "timeline", "severity": "high",
            "description": "المشروع تجاوز تاريخ الانتهاء المخطط",
            "recommendation": "مراجعة الجدول الزمني مع المانح وطلب تمديد إذا لزم الأمر",
        })

    if project.budget and project.spent:
        burn_rate = project.spent / project.budget * 100
        if burn_rate > 90:
            detected_risks.append({
                "type": "budget", "severity": "high",
                "description": f"نسبة الصرف {burn_rate:.0f}% - الميزانية شبه منتهية",
                "recommendation": "مراجعة خطة الصرف وإعادة تخصيص الموارد",
            })
        elif burn_rate < 30 and project.status == ProjectStatus.ACTIVE:
            detected_risks.append({
                "type": "budget", "severity": "medium",
                "description": f"نسبة الصرف منخفضة {burn_rate:.0f}% - قد يشير لتأخر التنفيذ",
                "recommendation": "تسريع تنفيذ الأنشطة وتقييم معوقات الصرف",
            })

    indicators = db.query(Indicator).filter(Indicator.project_id == project_id).all()
    low_performing = [i for i in indicators if i.target_value and i.actual_value and
                      (i.actual_value / i.target_value * 100) < 50]
    if len(low_performing) > len(indicators) * 0.5 and indicators:
        detected_risks.append({
            "type": "performance", "severity": "high",
            "description": f"{len(low_performing)} من {len(indicators)} مؤشرات أقل من 50% إنجاز",
            "recommendation": "مراجعة شاملة لخطة العمل وتحديد أسباب ضعف الأداء",
        })

    overdue_recs = db.query(Recommendation).filter(
        Recommendation.project_id == project_id,
        Recommendation.deadline < datetime.utcnow().date(),
        Recommendation.status.notin_([RecommendationStatus.COMPLETED, RecommendationStatus.CANCELLED]),
    ).count()
    if overdue_recs > 3:
        detected_risks.append({
            "type": "compliance", "severity": "medium",
            "description": f"{overdue_recs} توصية متأخرة عن موعد التنفيذ",
            "recommendation": "تخصيص موارد لتنفيذ التوصيات المتأخرة فوراً",
        })

    recent_complaints = db.query(Complaint).filter(
        Complaint.project_id == project_id,
        Complaint.created_at >= datetime.utcnow() - timedelta(days=30),
    ).count()
    if recent_complaints > 10:
        detected_risks.append({
            "type": "accountability", "severity": "medium",
            "description": f"{recent_complaints} شكوى في الشهر الأخير - معدل مرتفع",
            "recommendation": "تحليل أسباب الشكاوى وعقد جلسات استماع مع المجتمع",
        })

    risk_score = sum(3 if r["severity"] == "high" else 2 if r["severity"] == "medium" else 1 for r in detected_risks)
    return {
        "project": {"id": project.id, "name": project.name},
        "risk_score": risk_score,
        "risk_level": "critical" if risk_score >= 9 else "high" if risk_score >= 6 else "medium" if risk_score >= 3 else "low",
        "detected_risks": detected_risks,
        "total_risks": len(detected_risks),
        "analyzed_at": datetime.utcnow().isoformat(),
    }


@router.get("/summarize-evaluation/{project_id}")
def summarize_evaluation(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """AI summary of evaluation findings"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="المشروع غير موجود")

    field_visits = db.query(FieldVisit).filter(FieldVisit.project_id == project_id).all()
    lessons = db.query(LessonLearned).filter(LessonLearned.project_id == project_id).all()
    recommendations = db.query(Recommendation).filter(Recommendation.project_id == project_id).all()

    visit_findings = []
    for v in field_visits:
        if v.findings:
            visit_findings.append(v.findings)

    lesson_themes = {}
    for l in lessons:
        cat = l.category.value if l.category else "other"
        lesson_themes[cat] = lesson_themes.get(cat, 0) + 1

    rec_priorities = {"high": 0, "medium": 0, "low": 0}
    for r in recommendations:
        p = r.priority if r.priority else "medium"
        rec_priorities[p] = rec_priorities.get(p, 0) + 1

    key_findings = []
    if visit_findings:
        key_findings.append(f"تم توثيق {len(visit_findings)} ملاحظة من {len(field_visits)} زيارة ميدانية")
    if lessons:
        top_theme = max(lesson_themes, key=lesson_themes.get) if lesson_themes else None
        if top_theme:
            key_findings.append(f"أكثر مجال للدروس المستفادة: {top_theme} ({lesson_themes[top_theme]} درس)")
    if recommendations:
        completed = sum(1 for r in recommendations if r.status == RecommendationStatus.COMPLETED)
        key_findings.append(f"نسبة تنفيذ التوصيات: {completed}/{len(recommendations)} ({round(completed/len(recommendations)*100)}%)")

    return {
        "project": {"id": project.id, "name": project.name},
        "summary": {
            "total_field_visits": len(field_visits),
            "total_lessons": len(lessons),
            "total_recommendations": len(recommendations),
            "key_findings": key_findings,
            "lesson_themes": lesson_themes,
            "recommendation_priorities": rec_priorities,
        },
        "action_items": _generate_corrective_actions("low_achievement", {}) if not key_findings else [],
        "generated_at": datetime.utcnow().isoformat(),
    }


@router.get("/suggest-actions/{project_id}")
def suggest_corrective_actions(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """AI-suggested corrective actions based on current project state"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="المشروع غير موجود")

    suggestions = []

    indicators = db.query(Indicator).filter(Indicator.project_id == project_id).all()
    for ind in indicators:
        if ind.target_value and ind.actual_value:
            pct = ind.actual_value / ind.target_value * 100
            if pct < 30:
                suggestions.append({
                    "area": "indicators", "priority": "high",
                    "indicator": ind.name, "achievement": f"{pct:.0f}%",
                    "actions": [
                        f"مراجعة خطة تنفيذ مؤشر '{ind.name}' بشكل عاجل",
                        "تحديد العوائق والحلول البديلة",
                        "تقييم واقعية المستهدف وتعديله إذا لزم",
                    ],
                })
            elif pct < 60:
                suggestions.append({
                    "area": "indicators", "priority": "medium",
                    "indicator": ind.name, "achievement": f"{pct:.0f}%",
                    "actions": [
                        f"تكثيف الجهود لرفع إنجاز مؤشر '{ind.name}'",
                        "متابعة أسبوعية مع الفريق المسؤول",
                    ],
                })

    overdue = db.query(Recommendation).filter(
        Recommendation.project_id == project_id,
        Recommendation.deadline < datetime.utcnow().date(),
        Recommendation.status.notin_([RecommendationStatus.COMPLETED, RecommendationStatus.CANCELLED]),
    ).all()
    for r in overdue:
        suggestions.append({
            "area": "recommendations", "priority": "high",
            "title": r.title,
            "actions": [
                f"تنفيذ التوصية المتأخرة: {r.title}",
                f"المسؤول: {r.assigned_to or 'غير محدد'} - الموعد الأصلي: {r.deadline}",
                "تحديث الحالة أو طلب تمديد مع تبرير",
            ],
        })

    return {
        "project": {"id": project.id, "name": project.name},
        "total_suggestions": len(suggestions),
        "suggestions": suggestions,
        "generated_at": datetime.utcnow().isoformat(),
    }
