from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import SectorIndicator, User
from app.auth import get_current_user

router = APIRouter(prefix="/api/sector-indicators", tags=["المؤشرات القطاعية"])


STANDARD_INDICATORS = {
    "protection": {
        "name": "الحماية",
        "indicators": [
            {"code": "PROT-1", "name": "عدد حالات الحماية المحالة", "unit": "حالة", "frequency": "شهري"},
            {"code": "PROT-2", "name": "عدد الناجيات من العنف القائم على النوع (GBV) اللاتي تلقين خدمات", "unit": "شخص", "frequency": "شهري"},
            {"code": "PROT-3", "name": "عدد الأطفال المستفيدين من خدمات حماية الطفل", "unit": "طفل", "frequency": "شهري"},
            {"code": "PROT-4", "name": "عدد حالات المساعدة القانونية", "unit": "حالة", "frequency": "شهري"},
            {"code": "PROT-5", "name": "عدد المستفيدين من المساعدات النقدية للحماية", "unit": "شخص", "frequency": "ربع سنوي"},
            {"code": "PROT-6", "name": "نسبة الإحالات الآمنة المكتملة", "unit": "%", "frequency": "شهري"},
            {"code": "PROT-7", "name": "درجة مصفوفة المخاطر", "unit": "درجة", "frequency": "ربع سنوي"},
        ],
    },
    "fsac": {
        "name": "الأمن الغذائي وسبل العيش (FSAC)",
        "indicators": [
            {"code": "FCS", "name": "درجة استهلاك الغذاء (Food Consumption Score)", "unit": "درجة", "frequency": "ربع سنوي",
             "calculation": "مجموع أوزان مجموعات الأغذية × أيام الاستهلاك (0-112)"},
            {"code": "rCSI", "name": "مؤشر استراتيجيات التكيف المختصر (reduced Coping Strategy Index)", "unit": "درجة", "frequency": "شهري",
             "calculation": "مجموع (تكرار × وزن) لـ 5 استراتيجيات تكيف"},
            {"code": "LCSI", "name": "مؤشر استراتيجيات سبل العيش (Livelihood CSI)", "unit": "درجة", "frequency": "ربع سنوي",
             "calculation": "تصنيف بناءً على استراتيجيات الإجهاد والأزمة والطوارئ"},
            {"code": "HDDS", "name": "درجة تنوع النظام الغذائي (HDDS)", "unit": "درجة", "frequency": "ربع سنوي",
             "calculation": "عدد مجموعات الأغذية المستهلكة في 24 ساعة (0-12)"},
            {"code": "HHS", "name": "مقياس الجوع في الأسرة (Household Hunger Scale)", "unit": "درجة", "frequency": "ربع سنوي",
             "calculation": "مجموع إجابات 3 أسئلة عن الجوع (0-6)"},
            {"code": "FSAC-6", "name": "عدد المستفيدين من التوزيعات الغذائية", "unit": "أسرة", "frequency": "شهري"},
            {"code": "FSAC-7", "name": "نسبة رضا المستفيدين بعد التوزيع (PDM)", "unit": "%", "frequency": "ربع سنوي"},
            {"code": "FSAC-8", "name": "رصد الأسعار في السوق", "unit": "YER", "frequency": "أسبوعي"},
            {"code": "FSAC-9", "name": "عدد المستفيدين من برامج سبل العيش", "unit": "شخص", "frequency": "ربع سنوي"},
        ],
    },
    "education": {
        "name": "التعليم",
        "indicators": [
            {"code": "EDU-1", "name": "عدد الطلاب المسجلين", "unit": "طالب", "frequency": "فصل دراسي"},
            {"code": "EDU-2", "name": "نسبة الحضور", "unit": "%", "frequency": "شهري"},
            {"code": "EDU-3", "name": "نسبة التسرب", "unit": "%", "frequency": "فصل دراسي"},
            {"code": "EDU-4", "name": "عدد المواد التعليمية الموزعة", "unit": "مادة", "frequency": "فصل دراسي"},
            {"code": "EDU-5", "name": "عدد المعلمين المدربين", "unit": "معلم", "frequency": "سنوي"},
            {"code": "EDU-6", "name": "عدد المدارس المعاد تأهيلها", "unit": "مدرسة", "frequency": "سنوي"},
            {"code": "EDU-7", "name": "نسبة رضا الأطفال عن التعليم", "unit": "%", "frequency": "فصل دراسي"},
        ],
    },
    "health": {
        "name": "الصحة والتغذية",
        "indicators": [
            {"code": "HLT-1", "name": "عدد المرافق الصحية المدعومة", "unit": "مرفق", "frequency": "ربع سنوي"},
            {"code": "HLT-2", "name": "عدد الاستشارات الصحية", "unit": "استشارة", "frequency": "شهري"},
            {"code": "HLT-3", "name": "عدد الإحالات الطبية", "unit": "إحالة", "frequency": "شهري"},
            {"code": "HLT-4", "name": "عدد حالات فحص سوء التغذية", "unit": "حالة", "frequency": "شهري"},
            {"code": "HLT-5", "name": "نسبة توفر الأدوية الأساسية", "unit": "%", "frequency": "شهري"},
            {"code": "HLT-6", "name": "عدد ملاحظات المرضى", "unit": "ملاحظة", "frequency": "ربع سنوي"},
        ],
    },
    "wash": {
        "name": "المياه والصرف الصحي والنظافة (WASH)",
        "indicators": [
            {"code": "WASH-1", "name": "عدد نقاط المياه المراقبة", "unit": "نقطة", "frequency": "شهري"},
            {"code": "WASH-2", "name": "نسبة المراحيض العاملة", "unit": "%", "frequency": "شهري"},
            {"code": "WASH-3", "name": "عدد أدوات النظافة الموزعة", "unit": "حقيبة", "frequency": "ربع سنوي"},
            {"code": "WASH-4", "name": "جودة المياه (E.coli/100ml)", "unit": "CFU/100ml", "frequency": "شهري"},
            {"code": "WASH-5", "name": "نسبة رضا المجتمع عن خدمات WASH", "unit": "%", "frequency": "ربع سنوي"},
            {"code": "WASH-6", "name": "مؤشرات سلوك النظافة", "unit": "%", "frequency": "ربع سنوي"},
        ],
    },
    "mpca": {
        "name": "المساعدات النقدية متعددة الأغراض (MPCA)",
        "indicators": [
            {"code": "MPCA-1", "name": "عدد المستفيدين الذين تم التحقق منهم", "unit": "مستفيد", "frequency": "شهري"},
            {"code": "MPCA-2", "name": "عدد التحويلات المنفذة", "unit": "تحويلة", "frequency": "شهري"},
            {"code": "MPCA-3", "name": "مراقبة ما بعد التوزيع (PDM)", "unit": "%", "frequency": "ربع سنوي"},
            {"code": "MPCA-4", "name": "تحليل أنماط الإنفاق", "unit": "%", "frequency": "ربع سنوي"},
            {"code": "MPCA-5", "name": "مخاطر الحماية المرتبطة بالمساعدات النقدية", "unit": "حالة", "frequency": "ربع سنوي"},
            {"code": "MPCA-6", "name": "عدد الشكاوى المتعلقة بالمساعدات النقدية", "unit": "شكوى", "frequency": "شهري"},
        ],
    },
}


@router.get("/templates")
def get_sector_templates(
    sector: Optional[str] = None,
    current_user: User = Depends(get_current_user),
):
    if sector:
        if sector in STANDARD_INDICATORS:
            return {sector: STANDARD_INDICATORS[sector]}
        raise HTTPException(status_code=404, detail="القطاع غير موجود")
    return STANDARD_INDICATORS


@router.get("/")
def list_sector_indicators(
    sector: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(SectorIndicator)
    if sector:
        query = query.filter(SectorIndicator.sector == sector)
    indicators = query.all()
    return [
        {
            "id": i.id, "sector": i.sector,
            "indicator_code": i.indicator_code, "indicator_name": i.indicator_name,
            "definition": i.definition, "calculation_method": i.calculation_method,
            "data_source": i.data_source, "frequency": i.frequency,
            "disaggregation": i.disaggregation, "target": i.target, "unit": i.unit,
        }
        for i in indicators
    ]


@router.post("/")
def create_sector_indicator(
    sector: str,
    indicator_code: str,
    indicator_name: str,
    definition: Optional[str] = None,
    calculation_method: Optional[str] = None,
    data_source: Optional[str] = None,
    frequency: Optional[str] = None,
    disaggregation: Optional[str] = None,
    target: Optional[float] = None,
    unit: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ind = SectorIndicator(
        sector=sector, indicator_code=indicator_code,
        indicator_name=indicator_name, definition=definition,
        calculation_method=calculation_method, data_source=data_source,
        frequency=frequency, disaggregation=disaggregation,
        target=target, unit=unit,
    )
    db.add(ind)
    db.commit()
    db.refresh(ind)
    return {"id": ind.id, "message": "تم إنشاء المؤشر القطاعي"}


@router.post("/initialize/{sector}")
def initialize_sector(
    sector: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if sector not in STANDARD_INDICATORS:
        raise HTTPException(status_code=404, detail="القطاع غير موجود")
    template = STANDARD_INDICATORS[sector]
    created = 0
    for ind in template["indicators"]:
        existing = db.query(SectorIndicator).filter(
            SectorIndicator.sector == sector,
            SectorIndicator.indicator_code == ind["code"],
        ).first()
        if not existing:
            db.add(SectorIndicator(
                sector=sector, indicator_code=ind["code"],
                indicator_name=ind["name"], unit=ind.get("unit"),
                frequency=ind.get("frequency"),
                calculation_method=ind.get("calculation"),
            ))
            created += 1
    db.commit()
    return {"message": f"تم إنشاء {created} مؤشر قطاعي لقطاع {template['name']}"}
