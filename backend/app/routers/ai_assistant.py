"""Real OpenAI-powered AI assistant for HIAOS."""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import datetime, timezone, timedelta
from app.database import get_db
from app.models import (
    User, Project, Indicator, Measurement, Complaint, ComplaintStatus,
    ComplaintCategory, FieldVisit, Recommendation, RecommendationStatus,
    Risk, RiskStatus, LessonLearned, Distribution, IPTTEntry,
    ComplianceAssessment, ProjectStatus,
)
from app.auth import get_current_user
from app.config import settings
import logging

router = APIRouter(prefix="/ai", tags=["AI Assistant"])
logger = logging.getLogger(__name__)


def _get_openai_client():
    if not settings.OPENAI_API_KEY:
        return None
    try:
        from openai import OpenAI
        return OpenAI(api_key=settings.OPENAI_API_KEY)
    except ImportError:
        logger.warning("openai package not installed")
        return None


def _ai_complete(system: str, user: str, max_tokens: int = 1024) -> str:
    """Call OpenAI and return the response text, or fall back gracefully."""
    client = _get_openai_client()
    if not client:
        return "⚠️ AI غير متاح — يرجى تعيين OPENAI_API_KEY في ملف .env"
    try:
        response = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            max_tokens=max_tokens,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
        )
        return response.choices[0].message.content
    except Exception as e:
        logger.error(f"OpenAI call failed: {e}")
        return f"عذراً، فشل الاتصال بمحرك الذكاء الاصطناعي: {str(e)[:100]}"


# ── Helper functions ──────────────────────────────────────────────────────────

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
        "low_achievement": ["مراجعة خطة العمل وتعديل الجدول الزمني", "زيادة الموارد المخصصة للنشاط", "تكثيف المتابعة الميدانية", "عقد اجتماع تنسيقي مع الشركاء المنفذين"],
        "high_complaints": ["تحليل أسباب الشكاوى المتكررة", "تحسين آلية التواصل مع المستفيدين", "مراجعة معايير الاستهداف", "تعزيز آلية المساءلة وCFM"],
        "overdue_recommendations": ["متابعة مع المسؤولين عن تنفيذ التوصيات", "تصعيد التوصيات المتأخرة للإدارة العليا", "إعادة تقييم أولويات التوصيات", "تخصيص موارد إضافية للتنفيذ"],
        "high_risk": ["تفعيل خطة الطوارئ", "إبلاغ المانحين بتحديث المخاطر", "مراجعة إجراءات التخفيف الحالية", "تقييم تأثير المخاطر على الأهداف"],
        "compliance_gap": ["إجراء تقييم ذاتي للامتثال", "تطوير خطة عمل تصحيحية", "تدريب الموظفين على المعايير", "توثيق الأدلة والممارسات"],
    }
    return actions.get(issue_type, ["مراجعة الوضع الحالي واتخاذ إجراءات مناسبة"])


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/chat")
def ai_chat(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Main conversational AI endpoint powered by GPT-4o."""
    question = payload.get("question", "").strip()
    context_data = payload.get("context", "")
    if not question:
        raise HTTPException(status_code=400, detail="السؤال مطلوب")

    system_prompt = (
        "أنت مساعد ذكاء اصطناعي متخصص في الأعمال الإنسانية ونظام MEAL "
        "(المتابعة والتقييم والمساءلة والتعلم). "
        "تساعد فرق المنظمات الإنسانية في اليمن وبلدان أخرى على تحليل بيانات المشاريع، "
        "تفسير مؤشرات الأداء، تحديد المخاطر، وتقديم توصيات قابلة للتنفيذ. "
        "استخدم اللغة العربية بشكل افتراضي، وكن دقيقاً ومختصراً."
    )
    user_prompt = f"{question}"
    if context_data:
        user_prompt += f"\n\nبيانات السياق:\n{context_data}"

    result = _ai_complete(system_prompt, user_prompt, max_tokens=settings.OPENAI_MAX_TOKENS)
    return {
        "question": question,
        "answer": result,
        "model": settings.OPENAI_MODEL,
        "ai_enabled": settings.AI_ENABLED,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/auto-report/{project_id}")
def generate_auto_report(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """AI-generated monthly MEAL report with OpenAI narrative summary."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="المشروع غير موجود")

    now = datetime.now(timezone.utc)
    month_ago = now - timedelta(days=30)

    indicators = db.query(Indicator).filter(Indicator.project_id == project_id).all()
    indicator_analysis = []
    for ind in indicators:
        measurements = db.query(Measurement).filter(Measurement.indicator_id == ind.id).order_by(Measurement.date).all()
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

    resolved_times = [
        (c.resolution_date - c.created_at).days
        for c in complaints
        if c.status == ComplaintStatus.RESOLVED and c.resolution_date and c.created_at
    ]
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
        "auto_recommendations": _generate_corrective_actions("high_risk", {}) if any(r.impact and r.impact.value in ("major", "severe") for r in risks) else [],
    }

    scores = []
    if indicator_analysis:
        scores.append(min(sum(i["achievement_pct"] for i in indicator_analysis) / len(indicator_analysis), 100))
    if complaint_analysis["total"] > 0:
        scores.append(complaint_analysis["resolved"] / complaint_analysis["total"] * 100)
    if rec_analysis["total"] > 0:
        scores.append(rec_analysis["implementation_rate"])
    overall_score = round(sum(scores) / len(scores), 1) if scores else 0

    # AI narrative summary
    summary_prompt = (
        f"المشروع: {project.name}\n"
        f"الدرجة الإجمالية: {overall_score}/100\n"
        f"المؤشرات: {len(indicator_analysis)} مؤشر، منها {sum(1 for i in indicator_analysis if i['status'] == 'off_track')} خارج المسار\n"
        f"الشكاوى: {complaint_analysis['total']} خلال الشهر الماضي\n"
        f"التوصيات المتأخرة: {rec_analysis['overdue']}\n"
        f"المخاطر العالية: {risk_analysis['high_risks']}\n\n"
        "اكتب ملخصاً تنفيذياً مختصراً (3-4 جمل) لهذا التقرير الشهري باللغة العربية."
    )
    ai_narrative = _ai_complete(
        "أنت محلل بيانات إنسانية متخصص. قدّم ملخصات موجزة ودقيقة.",
        summary_prompt,
        max_tokens=300,
    )

    return {
        "report_type": "AI-Generated Monthly MEAL Report",
        "project": {"id": project.id, "name": project.name, "status": project.status.value if project.status else None},
        "period": {"from": month_ago.strftime("%Y-%m-%d"), "to": now.strftime("%Y-%m-%d")},
        "overall_score": overall_score,
        "overall_status": "good" if overall_score >= 80 else "needs_attention" if overall_score >= 60 else "critical",
        "ai_narrative": ai_narrative,
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
    since = datetime.now(timezone.utc) - timedelta(days=days)
    complaints = db.query(Complaint).filter(Complaint.created_at >= since).all()

    by_category, by_channel, by_governorate, by_week = {}, {}, {}, {}
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

    weekly_counts = sorted(by_week.items())
    trend = "stable"
    if len(weekly_counts) >= 2:
        recent = [v for _, v in weekly_counts[-2:]]
        if recent[-1] > recent[0] * 1.5:
            trend = "increasing"
        elif recent[-1] < recent[0] * 0.5:
            trend = "decreasing"

    patterns = []
    if by_category:
        top_cat = max(by_category, key=by_category.get)
        patterns.append(f"أكثر فئة شكاوى: {top_cat} ({by_category[top_cat]} شكوى)")
    if by_governorate:
        top_gov = max(by_governorate, key=by_governorate.get)
        patterns.append(f"أكثر محافظة شكاوى: {top_gov} ({by_governorate[top_gov]} شكوى)")
    if sensitivity_dist.get("critical", 0) > 0:
        patterns.append(f"يوجد {sensitivity_dist['critical']} شكوى حرجة تحتاج اهتمام فوري")

    # AI recommendations
    ai_recs = []
    if complaints and settings.AI_ENABLED:
        ai_prompt = (
            f"بيانات الشكاوى ({days} يوماً):\n"
            f"- الإجمالي: {len(complaints)}\n"
            f"- الاتجاه: {trend}\n"
            f"- أكثر الفئات: {dict(list(sorted(by_category.items(), key=lambda x: -x[1])[:3]))}\n"
            f"- الشكاوى الحرجة: {sensitivity_dist.get('critical', 0)}\n\n"
            "قدّم 3 توصيات قابلة للتنفيذ لتحسين آلية CFM."
        )
        ai_text = _ai_complete("أنت خبير في المساءلة ومشاركة المجتمع.", ai_prompt, max_tokens=400)
        ai_recs = [line.strip() for line in ai_text.split("\n") if line.strip() and len(line.strip()) > 10][:5]

    return {
        "period_days": days, "total_complaints": len(complaints),
        "by_category": by_category, "by_channel": by_channel,
        "by_governorate": by_governorate, "by_week": by_week,
        "sensitivity_distribution": sensitivity_dist,
        "patterns": patterns, "trend": trend,
        "auto_recommendations": ai_recs,
    }


@router.get("/risk-detection/{project_id}")
def detect_risks(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="المشروع غير موجود")

    detected_risks = []
    if project.end_date and project.end_date < datetime.now(timezone.utc).date():
        detected_risks.append({"type": "timeline", "severity": "high", "description": "المشروع تجاوز تاريخ الانتهاء المخطط", "recommendation": "مراجعة الجدول الزمني مع المانح وطلب تمديد إذا لزم الأمر"})

    if project.budget and project.spent:
        burn_rate = project.spent / project.budget * 100
        if burn_rate > 90:
            detected_risks.append({"type": "budget", "severity": "high", "description": f"نسبة الصرف {burn_rate:.0f}% - الميزانية شبه منتهية", "recommendation": "مراجعة خطة الصرف وإعادة تخصيص الموارد"})
        elif burn_rate < 30 and project.status == ProjectStatus.ACTIVE:
            detected_risks.append({"type": "budget", "severity": "medium", "description": f"نسبة الصرف منخفضة {burn_rate:.0f}% - قد يشير لتأخر التنفيذ", "recommendation": "تسريع تنفيذ الأنشطة"})

    indicators = db.query(Indicator).filter(Indicator.project_id == project_id).all()
    low_performing = [i for i in indicators if i.target_value and i.actual_value and (i.actual_value / i.target_value * 100) < 50]
    if len(low_performing) > len(indicators) * 0.5 and indicators:
        detected_risks.append({"type": "performance", "severity": "high", "description": f"{len(low_performing)} من {len(indicators)} مؤشرات أقل من 50% إنجاز", "recommendation": "مراجعة شاملة لخطة العمل"})

    overdue_recs = db.query(Recommendation).filter(
        Recommendation.project_id == project_id,
        Recommendation.deadline < datetime.now(timezone.utc).date(),
        Recommendation.status.notin_([RecommendationStatus.COMPLETED, RecommendationStatus.CANCELLED]),
    ).count()
    if overdue_recs > 3:
        detected_risks.append({"type": "compliance", "severity": "medium", "description": f"{overdue_recs} توصية متأخرة", "recommendation": "تخصيص موارد لتنفيذ التوصيات المتأخرة فوراً"})

    risk_score = sum(3 if r["severity"] == "high" else 2 if r["severity"] == "medium" else 1 for r in detected_risks)
    return {
        "project": {"id": project.id, "name": project.name},
        "risk_score": risk_score,
        "risk_level": "critical" if risk_score >= 9 else "high" if risk_score >= 6 else "medium" if risk_score >= 3 else "low",
        "detected_risks": detected_risks,
        "total_risks": len(detected_risks),
        "analyzed_at": datetime.now(timezone.utc).isoformat(),
    }


@router.post("/extract-proposal")
async def extract_proposal_data(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Extract MEAL Logframe data from uploaded proposal using OpenAI."""
    content = await file.read()
    file_text = ""

    try:
        if file.filename and file.filename.endswith(".txt"):
            file_text = content.decode("utf-8", errors="ignore")
        elif file.filename and file.filename.endswith(".docx"):
            from docx import Document
            import io
            doc = Document(io.BytesIO(content))
            file_text = "\n".join([p.text for p in doc.paragraphs if p.text.strip()])
        else:
            file_text = content.decode("utf-8", errors="ignore")[:3000]
    except Exception:
        file_text = ""

    if file_text and settings.AI_ENABLED:
        system = (
            "أنت خبير في استخراج بيانات المشاريع الإنسانية. "
            "استخرج من النص: اسم المشروع، المانح، الميزانية، المؤشرات، والأنشطة. "
            "أجب بتنسيق JSON فقط."
        )
        user_prompt = f"استخرج بيانات المشروع من هذا النص:\n\n{file_text[:2000]}"
        ai_result = _ai_complete(system, user_prompt, max_tokens=1000)

        try:
            import json
            extracted = json.loads(ai_result)
            extracted["filename"] = file.filename
            extracted["ai_extracted"] = True
            return extracted
        except Exception:
            pass

    # Fallback structured response
    return {
        "project_name": "يرجى مراجعة الملف المرفوع",
        "donor": "غير محدد",
        "budget": "غير محدد",
        "indicators": [],
        "activities": [],
        "filename": file.filename,
        "ai_extracted": False,
        "note": "لم يتمكن النظام من استخراج البيانات تلقائياً. يرجى التحقق من OPENAI_API_KEY أو تنسيق الملف.",
    }


@router.post("/process")
def process_ai_task(
    payload: dict,
    current_user: User = Depends(get_current_user),
):
    """General-purpose AI task processor."""
    task = payload.get("task", "general")
    context = payload.get("context", "")
    language = payload.get("language", "ar")

    task_prompts = {
        "summarize": "لخّص النص التالي في 3-5 نقاط رئيسية:",
        "risk_analysis": "حلّل المخاطر المحتملة في السياق التالي وقدّم توصيات:",
        "translate": "ترجم النص التالي إلى الإنجليزية:",
        "recommend": "قدّم توصيات عملية وقابلة للتنفيذ بناءً على:",
        "narrative": "اكتب تقريراً سردياً احترافياً بناءً على البيانات التالية:",
    }

    system_msg = "أنت مساعد ذكاء اصطناعي متخصص في العمل الإنساني ونظام MEAL."
    user_msg = f"{task_prompts.get(task, 'حلّل وأجب على:')}\n\n{context}"

    result = _ai_complete(system_msg, user_msg, max_tokens=settings.OPENAI_MAX_TOKENS)
    return {
        "task": task,
        "result": result,
        "ai_enabled": settings.AI_ENABLED,
        "model": settings.OPENAI_MODEL if settings.AI_ENABLED else "fallback",
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }
