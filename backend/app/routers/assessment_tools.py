from fastapi import APIRouter, Depends
from typing import Optional
from app.models import User
from app.auth import get_current_user

router = APIRouter(prefix="/assessment-tools", tags=["أدوات التقييم"])


ASSESSMENT_TEMPLATES = {
    "pdm": {
        "name": "مراقبة ما بعد التوزيع (PDM)",
        "description": "استبيان لتقييم فعالية التوزيعات ورضا المستفيدين",
        "sections": [
            {
                "title": "معلومات عامة",
                "questions": [
                    {"q": "هل استلمت المساعدة المحددة في قائمة التوزيع؟", "type": "yes_no"},
                    {"q": "ما نوع المساعدة التي استلمتها؟", "type": "select", "options": ["غذائية", "نقدية", "أدوات نظافة", "مأوى", "أخرى"]},
                    {"q": "هل الكمية كافية لتلبية احتياجاتك؟", "type": "scale_1_5"},
                ]
            },
            {
                "title": "جودة المساعدة",
                "questions": [
                    {"q": "كيف تقيم جودة المساعدة المقدمة؟", "type": "scale_1_5"},
                    {"q": "هل كانت المساعدة مناسبة لاحتياجاتك الفعلية؟", "type": "yes_no"},
                    {"q": "هل واجهت أي مشاكل في استلام المساعدة؟", "type": "text"},
                ]
            },
            {
                "title": "الحماية والمساءلة",
                "questions": [
                    {"q": "هل تشعر بالأمان أثناء عملية التوزيع؟", "type": "yes_no"},
                    {"q": "هل تعرف كيفية تقديم شكوى؟", "type": "yes_no"},
                    {"q": "هل شاركت المساعدة مع أحد خارج أسرتك؟", "type": "yes_no"},
                    {"q": "هل بعت أي جزء من المساعدة؟", "type": "yes_no"},
                    {"q": "ما مستوى رضاك العام عن المساعدة؟", "type": "scale_1_5"},
                ]
            },
        ]
    },
    "baseline": {
        "name": "مسح خط الأساس (Baseline)",
        "description": "مسح شامل لجمع البيانات الأساسية قبل بدء المشروع",
        "sections": [
            {
                "title": "البيانات الديموغرافية",
                "questions": [
                    {"q": "عدد أفراد الأسرة", "type": "number"},
                    {"q": "عدد الأطفال تحت 5 سنوات", "type": "number"},
                    {"q": "الجنس رب/ربة الأسرة", "type": "select", "options": ["ذكر", "أنثى"]},
                    {"q": "مصدر الدخل الرئيسي", "type": "text"},
                ]
            },
            {
                "title": "الأمن الغذائي",
                "questions": [
                    {"q": "عدد الوجبات في اليوم", "type": "number"},
                    {"q": "مجموعات الأغذية المستهلكة في آخر 7 أيام", "type": "multi_select",
                     "options": ["حبوب", "بقوليات", "خضروات", "فواكه", "لحوم", "حليب", "سكريات", "زيوت"]},
                    {"q": "هل اضطررت لتقليل الوجبات خلال الشهر الماضي؟", "type": "yes_no"},
                ]
            },
            {
                "title": "WASH",
                "questions": [
                    {"q": "مصدر المياه الرئيسي", "type": "select", "options": ["شبكة عامة", "بئر", "صهريج", "نهر", "أخرى"]},
                    {"q": "نوع المرحاض", "type": "select", "options": ["مرحاض مع تصريف", "حفرة", "لا يوجد", "أخرى"]},
                    {"q": "هل تغسل يديك بالصابون بانتظام؟", "type": "yes_no"},
                ]
            },
        ]
    },
    "endline": {
        "name": "مسح خط النهاية (Endline)",
        "description": "مسح لمقارنة النتائج بعد المشروع مع خط الأساس",
        "sections": [
            {
                "title": "تغييرات في الوضع",
                "questions": [
                    {"q": "هل تحسن وضعك الغذائي مقارنة ببداية المشروع؟", "type": "scale_1_5"},
                    {"q": "هل تحسنت مصادر دخلك؟", "type": "yes_no"},
                    {"q": "عدد الوجبات في اليوم حالياً", "type": "number"},
                ]
            },
            {
                "title": "تقييم الأثر",
                "questions": [
                    {"q": "ما أهم تغيير إيجابي لاحظته؟", "type": "text"},
                    {"q": "ما أهم تحدٍ لا يزال قائماً؟", "type": "text"},
                    {"q": "هل تعتقد أن المشروع حقق أهدافه؟", "type": "scale_1_5"},
                ]
            },
        ]
    },
    "kii": {
        "name": "مقابلة مع مخبر رئيسي (KII)",
        "description": "دليل مقابلة شبه منظمة مع أصحاب المصلحة الرئيسيين",
        "sections": [
            {
                "title": "معلومات المقابلة",
                "questions": [
                    {"q": "اسم الشخص (اختياري)", "type": "text"},
                    {"q": "المنصب/الدور", "type": "text"},
                    {"q": "المنظمة/الجهة", "type": "text"},
                ]
            },
            {
                "title": "أسئلة المقابلة",
                "questions": [
                    {"q": "كيف تقيم فعالية المشروع في تحقيق أهدافه؟", "type": "text"},
                    {"q": "ما هي أبرز الإنجازات التي تحققت؟", "type": "text"},
                    {"q": "ما هي التحديات الرئيسية التي واجهها المشروع؟", "type": "text"},
                    {"q": "ما هي توصياتك للتحسين؟", "type": "text"},
                    {"q": "هل هناك آثار غير متوقعة (إيجابية أو سلبية)؟", "type": "text"},
                ]
            },
        ]
    },
    "fgd": {
        "name": "نقاش مجموعة بؤرية (FGD)",
        "description": "دليل لإجراء نقاشات مجموعات بؤرية مع المستفيدين",
        "sections": [
            {
                "title": "معلومات الجلسة",
                "questions": [
                    {"q": "عدد المشاركين", "type": "number"},
                    {"q": "الفئة العمرية", "type": "text"},
                    {"q": "توزيع الجنس", "type": "text"},
                    {"q": "الموقع", "type": "text"},
                ]
            },
            {
                "title": "محاور النقاش",
                "questions": [
                    {"q": "ما هي احتياجاتكم الأساسية حالياً؟", "type": "text"},
                    {"q": "كيف تقيمون الخدمات المقدمة من المنظمة؟", "type": "text"},
                    {"q": "هل تشعرون بأن صوتكم مسموع؟", "type": "text"},
                    {"q": "ما التغييرات التي تقترحونها؟", "type": "text"},
                    {"q": "هل هناك فئات محرومة من الخدمات؟", "type": "text"},
                    {"q": "ما هي مخاوفكم المتعلقة بالحماية؟", "type": "text"},
                ]
            },
        ]
    },
    "monitoring_checklist": {
        "name": "قائمة مراقبة ميدانية",
        "description": "قائمة تحقق شاملة للزيارات الميدانية الروتينية",
        "sections": [
            {
                "title": "تنفيذ الأنشطة",
                "questions": [
                    {"q": "هل الأنشطة تسير وفقاً للجدول الزمني؟", "type": "yes_no"},
                    {"q": "هل الموارد متوفرة بالقدر الكافي؟", "type": "yes_no"},
                    {"q": "نسبة إنجاز الأنشطة المخططة", "type": "number"},
                ]
            },
            {
                "title": "جودة الخدمة",
                "questions": [
                    {"q": "هل معايير الجودة مطبقة؟", "type": "yes_no"},
                    {"q": "هل الموظفون مؤهلون ومدربون؟", "type": "yes_no"},
                    {"q": "هل هناك آلية شكاوى فعالة؟", "type": "yes_no"},
                ]
            },
        ]
    },
    "distribution_monitoring": {
        "name": "مراقبة التوزيعات",
        "description": "نموذج مراقبة عملية التوزيع في الموقع",
        "sections": [
            {
                "title": "التنظيم",
                "questions": [
                    {"q": "هل قوائم المستفيدين محدثة ودقيقة؟", "type": "yes_no"},
                    {"q": "هل عملية التسجيل منظمة؟", "type": "yes_no"},
                    {"q": "هل يتم التحقق من هوية المستفيدين؟", "type": "yes_no"},
                ]
            },
            {
                "title": "الحماية",
                "questions": [
                    {"q": "هل الموقع آمن ومناسب؟", "type": "yes_no"},
                    {"q": "هل هناك أولوية لكبار السن وذوي الإعاقة؟", "type": "yes_no"},
                    {"q": "هل يوجد مكان مظلل ومياه شرب؟", "type": "yes_no"},
                    {"q": "هل آلية الشكاوى متاحة في الموقع؟", "type": "yes_no"},
                ]
            },
        ]
    },
    "site_verification": {
        "name": "التحقق من المواقع",
        "description": "نموذج للتحقق من المواقع والمرافق",
        "sections": [
            {
                "title": "المعلومات الأساسية",
                "questions": [
                    {"q": "هل الموقع مطابق للإحداثيات المسجلة؟", "type": "yes_no"},
                    {"q": "هل البنية التحتية سليمة؟", "type": "yes_no"},
                    {"q": "هل الخدمات متوفرة وتعمل؟", "type": "yes_no"},
                ]
            },
            {
                "title": "التقييم",
                "questions": [
                    {"q": "حالة المبنى/المرفق", "type": "scale_1_5"},
                    {"q": "إمكانية الوصول للفئات المستضعفة", "type": "scale_1_5"},
                    {"q": "ملاحظات إضافية", "type": "text"},
                ]
            },
        ]
    },
    "beneficiary_satisfaction": {
        "name": "استبيان رضا المستفيدين",
        "description": "قياس مستوى رضا المستفيدين عن الخدمات المقدمة",
        "sections": [
            {
                "title": "تقييم الخدمة",
                "questions": [
                    {"q": "مستوى الرضا عن جودة الخدمة", "type": "scale_1_5"},
                    {"q": "مستوى الرضا عن سهولة الوصول", "type": "scale_1_5"},
                    {"q": "مستوى الرضا عن معاملة الموظفين", "type": "scale_1_5"},
                    {"q": "مستوى الرضا عن توقيت الخدمة", "type": "scale_1_5"},
                    {"q": "هل تنصح آخرين بهذه الخدمة؟", "type": "yes_no"},
                    {"q": "اقتراحات للتحسين", "type": "text"},
                ]
            },
        ]
    },
}


@router.get("/templates")
def get_templates(
    template_type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
):
    if template_type:
        if template_type in ASSESSMENT_TEMPLATES:
            return {template_type: ASSESSMENT_TEMPLATES[template_type]}
        return {"error": "النموذج غير موجود"}
    return ASSESSMENT_TEMPLATES


@router.get("/templates/list")
def list_template_names(current_user: User = Depends(get_current_user)):
    return [
        {"key": k, "name": v["name"], "description": v["description"]}
        for k, v in ASSESSMENT_TEMPLATES.items()
    ]
