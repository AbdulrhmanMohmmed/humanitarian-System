"""Seed data for all humanitarian modules that currently have no data."""
from datetime import date, datetime, timedelta, timezone
import random
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models import Base
from app.models.new_modules import (
    ProtectionCase, ProtectionReferral, EmergencyResponse, RapidAssessment,
    Camp, CampService, NutritionScreening, WaterPoint, WaterQualityTest,
    School, LivelihoodProgram, EarlyWarningIndicator, EarlyWarningAlert,
)
from app.models.supply_chain import StockMovement, BatchLot, LastMileDelivery
from app.models.standards import SphereStandard, GrandBargainCommitment, DoNoHarmAnalysis, GenderMarker
from app.models.hr_advanced import PayrollRecord, PerformanceReview, Training, Timesheet, EmployeeContract
from app.models.accounting import Account, JournalEntry, JournalLine, BudgetLine

GOVERNORATES = ["صنعاء", "عدن", "تعز", "الحديدة", "إب", "حضرموت", "مأرب", "ذمار", "حجة", "البيضاء"]

def _now():
    return datetime.now(timezone.utc)


def seed_all_modules():
    db = SessionLocal()

    if db.query(ProtectionCase).count() > 0:
        print("Module data already seeded.")
        db.close()
        return

    print("Seeding humanitarian modules...")

    # ── Protection Cases ────────────────────────────────────────────────
    case_types = ["GBV", "child_protection", "trafficking", "detention", "general"]
    priorities = ["low", "medium", "high", "critical"]
    statuses_pc = ["open", "in_progress", "closed", "referred"]
    for i in range(15):
        db.add(ProtectionCase(
            case_number=f"PC-2024-{i+1:04d}",
            case_type=random.choice(case_types),
            priority=random.choice(priorities),
            status=random.choice(statuses_pc),
            description=random.choice(["نزوح قسري", "عنف أسري", "تجنيد أطفال", "احتجاز تعسفي", "تهديد أمني"]),
            beneficiary_id=random.randint(1, 50),
            assigned_to=random.randint(1, 5),
            intake_date=date.today() - timedelta(days=random.randint(1, 90)),
            is_confidential=True,
            created_at=_now() - timedelta(days=random.randint(1, 90)),
        ))
    db.commit()

    for i in range(8):
        db.add(ProtectionReferral(
            case_id=random.randint(1, 15),
            referred_to=random.choice(["UNHCR", "UNICEF", "منظمة الهجرة", "الصليب الأحمر", "مستشفى المنطقة"]),
            referral_reason=random.choice(["حاجة طبية عاجلة", "إعادة التوطين", "دعم قانوني", "رعاية نفسية"]),
            status=random.choice(["pending", "accepted", "completed"]),
            created_at=_now() - timedelta(days=random.randint(1, 60)),
        ))
    db.commit()

    # ── Emergency Responses ─────────────────────────────────────────────
    em_names = ["فيضانات حضرموت", "نزوح مأرب", "وباء الكوليرا - الحديدة",
                "زلزال ذمار", "نزاع مسلح - تعز", "أمطار موسمية - إب"]
    for i, name in enumerate(em_names):
        db.add(EmergencyResponse(
            name=name,
            emergency_type=random.choice(["natural_disaster", "conflict", "epidemic", "displacement"]),
            severity=random.choice(["minor", "moderate", "major", "catastrophic"]),
            status=random.choice(["active", "active", "monitoring", "closed"]),
            location=random.choice(GOVERNORATES),
            affected_population=random.randint(500, 50000),
            activation_date=date.today() - timedelta(days=random.randint(10, 120)),
            lead_coordinator_id=random.randint(1, 5),
            sitrep=f"تقرير الموقف: {name} — الاستجابة جارية",
            created_at=_now() - timedelta(days=random.randint(10, 120)),
        ))
    db.commit()

    sectors = ["shelter", "health", "food", "wash", "protection", "education"]
    for i in range(10):
        db.add(RapidAssessment(
            emergency_id=random.randint(1, 6),
            assessment_type=random.choice(["initial", "detailed", "sectoral"]),
            location=random.choice(GOVERNORATES),
            population_affected=random.randint(200, 10000),
            priority_needs=random.choice([
                "احتياجات عاجلة للمأوى والغذاء", "نقص حاد في الأدوية",
                "تلوث مصادر المياه", "تضرر 80% من المدارس", "نزوح أكثر من 5000 أسرة",
            ]),
            assessment_date=date.today() - timedelta(days=random.randint(1, 60)),
            assessor_id=random.randint(1, 5),
            created_at=_now() - timedelta(days=random.randint(1, 60)),
        ))
    db.commit()

    # ── Camps ────────────────────────────────────────────────────────────
    camp_names = [
        "مخيم الجوف", "مخيم السلام - مأرب", "مخيم الأمل - عدن",
        "مخيم النور - الحديدة", "مركز إيواء تعز", "مخيم الوحدة - إب",
        "مخيم الصمود - حجة", "مركز إيواء صنعاء",
    ]
    for name in camp_names:
        cap = random.randint(500, 5000)
        pop = int(cap * random.uniform(0.4, 0.95))
        db.add(Camp(
            name=name, location=random.choice(GOVERNORATES),
            status=random.choice(["active", "active", "active", "planned"]),
            capacity=cap, current_population=pop,
            latitude=15.0 + random.uniform(-2, 2),
            longitude=44.0 + random.uniform(-3, 3),
            camp_manager_id=random.randint(1, 5),
            created_at=_now() - timedelta(days=random.randint(30, 365)),
        ))
    db.commit()

    service_types = ["health", "education", "water", "food", "protection", "shelter"]
    for camp_id in range(1, 9):
        for stype in random.sample(service_types, k=random.randint(2, 5)):
            db.add(CampService(
                camp_id=camp_id, service_type=stype,
                provider=random.choice(["UNHCR", "UNICEF", "WFP", "WHO", "IOM", "منظمة محلية"]),
                status=random.choice(["active", "active", "planned"]),
                capacity=random.randint(100, 2000),
            ))
    db.commit()

    # ── Nutrition Screenings ─────────────────────────────────────────────
    for i in range(20):
        muac = random.choice([None, round(random.uniform(90, 145), 1)])
        zscore = random.choice([None, round(random.uniform(-4, 1), 2)])
        classification = "normal"
        if muac and muac < 115:
            classification = "sam"
        elif muac and muac < 125:
            classification = "mam"
        db.add(NutritionScreening(
            beneficiary_id=random.randint(1, 50),
            screening_date=date.today() - timedelta(days=random.randint(1, 90)),
            muac=muac,
            wfh_zscore=zscore,
            classification=classification,
            weight=round(random.uniform(5, 25), 1),
            height=round(random.uniform(60, 110), 1),
            referred=classification in ["sam", "mam"],
            treatment_program="OTP" if classification == "sam" else ("SFP" if classification == "mam" else None),
            screener_id=random.randint(1, 5),
            created_at=_now() - timedelta(days=random.randint(1, 90)),
        ))
    db.commit()

    # ── WASH — Water Points ──────────────────────────────────────────────
    wp_types = ["borehole", "well", "spring", "piped", "truck"]
    for i in range(12):
        db.add(WaterPoint(
            name=f"نقطة مياه {random.choice(GOVERNORATES)} - {i+1}",
            water_source_type=random.choice(wp_types),
            location=random.choice(GOVERNORATES),
            latitude=15.0 + random.uniform(-2, 2),
            longitude=44.0 + random.uniform(-3, 3),
            status=random.choice(["functional", "functional", "functional", "needs_repair", "non_functional"]),
            capacity_liters_per_day=random.randint(500, 10000),
            population_served=random.randint(200, 5000),
            water_quality_status=random.choice(["safe", "safe", "contaminated", "unknown"]),
            created_at=_now() - timedelta(days=random.randint(1, 180)),
        ))
    db.commit()

    for i in range(15):
        db.add(WaterQualityTest(
            water_point_id=random.randint(1, 12),
            test_date=date.today() - timedelta(days=random.randint(1, 60)),
            ph_level=round(random.uniform(6.0, 8.5), 1),
            turbidity=round(random.uniform(0, 10), 1),
            e_coli=round(random.uniform(0, 20), 0),
            residual_chlorine=round(random.uniform(0, 2.0), 2),
            result=random.choice(["pass", "pass", "pass", "fail"]),
            tester_id=random.randint(1, 5),
            created_at=_now() - timedelta(days=random.randint(1, 60)),
        ))
    db.commit()

    # ── Education — Schools ──────────────────────────────────────────────
    school_names = ["النور", "الأمل", "السلام", "المستقبل", "الحرية", "الوحدة", "العلم", "النجاح", "الإبداع", "المعرفة"]
    for i, sname in enumerate(school_names):
        gov = random.choice(GOVERNORATES)
        cap = random.randint(100, 800)
        db.add(School(
            name=f"مدرسة {sname} - {gov}",
            school_type=random.choice(["formal", "non_formal", "temporary_learning_space"]),
            location=gov,
            status=random.choice(["active", "active", "damaged", "active"]),
            capacity=cap,
            enrolled_students=int(cap * random.uniform(0.5, 0.95)),
            teachers_count=random.randint(5, 40),
            has_wash=random.choice([True, True, False]),
            has_protection=random.choice([True, False]),
            created_at=_now() - timedelta(days=random.randint(30, 365)),
        ))
    db.commit()

    # ── Livelihoods Programs ─────────────────────────────────────────────
    lp_names = [
        "برنامج النقد مقابل العمل", "تدريب مهني - خياطة", "دعم المشاريع الصغيرة",
        "تحسين الإنتاج الزراعي", "تربية الماشية", "صيد الأسماك - عدن",
        "تدريب حرفي - نجارة", "مشاريع تمكين المرأة",
    ]
    for name in lp_names:
        target = random.randint(50, 500)
        db.add(LivelihoodProgram(
            name=name,
            program_type=random.choice(["cash_for_work", "vocational_training", "micro_grants", "apprenticeship"]),
            project_id=random.randint(1, 8),
            status=random.choice(["active", "active", "completed", "active"]),
            target_beneficiaries=target,
            enrolled=int(target * random.uniform(0.5, 0.9)),
            graduated=int(target * random.uniform(0.1, 0.4)),
            budget=random.randint(20000, 200000),
            created_at=_now() - timedelta(days=random.randint(30, 180)),
        ))
    db.commit()

    # ── Early Warning Indicators ─────────────────────────────────────────
    ew_data = [
        ("أسعار الغذاء", "food_security", 100, 120, 150),
        ("نسبة سوء التغذية", "health", 15, 20, 30),
        ("معدل النزوح", "displacement", 500, 800, 1200),
        ("مستوى الأمطار", "climate", 50, 30, 20),
        ("مستوى المياه الجوفية", "climate", 60, 40, 25),
        ("أسعار الوقود", "food_security", 100, 130, 180),
        ("نسبة التحصين", "health", 70, 50, 35),
    ]
    for name, category, baseline, thresh_w, thresh_c in ew_data:
        current = round(baseline * random.uniform(0.7, 1.5), 1)
        status = "normal"
        if current >= thresh_c:
            status = "critical"
        elif current >= thresh_w:
            status = "warning"
        db.add(EarlyWarningIndicator(
            name=name, category=category,
            current_value=current,
            threshold_warning=thresh_w,
            threshold_critical=thresh_c,
            location=random.choice(GOVERNORATES),
            status=status,
            last_updated=_now() - timedelta(hours=random.randint(1, 72)),
            created_at=_now() - timedelta(days=random.randint(30, 180)),
        ))
    db.commit()

    alert_msgs = [
        "ارتفاع حاد في أسعار المواد الغذائية", "زيادة معدل النزوح",
        "انخفاض مستوى المياه الجوفية", "ارتفاع نسبة سوء التغذية", "نقص في اللقاحات",
    ]
    for i in range(5):
        db.add(EarlyWarningAlert(
            indicator_id=random.randint(1, 7),
            alert_level=random.choice(["warning", "critical", "warning"]),
            message=alert_msgs[i],
            recommended_actions=random.choice(["توزيع مواد إغاثية", "فتح مراكز إيواء", "توفير خدمات صحية"]),
            is_acknowledged=random.choice([True, False]),
            created_at=_now() - timedelta(days=random.randint(1, 30)),
        ))
    db.commit()

    # ── Supply Chain — Stock Movements ────────────────────────────────────
    items = ["أرز", "دقيق", "زيت", "سكر", "أدوية", "بطانيات", "خيام", "صابون"]
    for i in range(12):
        db.add(StockMovement(
            item_id=random.randint(1, 15),
            warehouse_id=random.randint(1, 5),
            movement_type=random.choice(["in", "out", "transfer"]),
            quantity=random.randint(50, 5000),
            unit=random.choice(["كيلو", "لتر", "وحدة", "قطعة"]),
            reference=f"SM-2024-{i+1:04d}",
            notes=f"حركة مخزون: {random.choice(items)}",
            performed_by=random.randint(1, 5),
            created_at=_now() - timedelta(days=random.randint(1, 60)),
        ))
    db.commit()

    for i in range(6):
        db.add(BatchLot(
            item_id=random.randint(1, 15),
            batch_number=f"BATCH-2024-{i+1:04d}",
            lot_number=f"LOT-{random.randint(100, 999)}",
            quantity=random.randint(100, 5000),
            unit=random.choice(["كيلو", "لتر", "علبة"]),
            manufacturing_date=date(2024, random.randint(1, 6), 1),
            expiry_date=date(2025, random.randint(6, 12), 28),
            supplier=random.choice(["مجموعة هائل سعيد", "شركة العربي", "المؤسسة الطبية"]),
            warehouse_id=random.randint(1, 5),
            status="active",
            created_at=_now() - timedelta(days=random.randint(30, 180)),
        ))
    db.commit()

    # ── Supply Chain — Last Mile Deliveries ─────────────────────────────
    destinations = ["مخيم الجوف", "مخيم مأرب", "مخيم عدن", "قرية الصمود", "مركز توزيع تعز",
                    "مخيم حجة", "مركز إيواء إب", "مخيم الحديدة"]
    for i in range(8):
        db.add(LastMileDelivery(
            distribution_id=random.randint(1, 10),
            driver_id=random.randint(1, 5),
            vehicle_id=random.randint(1, 3),
            origin_warehouse_id=random.randint(1, 5),
            destination=destinations[i],
            destination_lat=15.0 + random.uniform(-2, 2),
            destination_lng=44.0 + random.uniform(-3, 3),
            status=random.choice(["pending", "in_transit", "delivered", "delivered", "delivered"]),
            notes=f"تسليم رقم {i+1}",
            created_at=_now() - timedelta(days=random.randint(1, 30)),
        ))
    db.commit()

    # ── Standards ─────────────────────────────────────────────────────────
    sphere_data = [
        ("WASH", "1", "Water supply standard", "معيار إمداد المياه", "15 لتر/شخص/يوم"),
        ("WASH", "2", "Sanitation standard", "معيار الصرف الصحي", "20 شخص/مرحاض"),
        ("Food Security", "1", "Nutrition standard", "معيار التغذية", "2,100 سعرة/شخص/يوم"),
        ("Shelter", "1", "Shelter standard", "معيار المأوى", "3.5 م²/شخص"),
        ("Health", "1", "Health services standard", "معيار الصحة", "طبيب/50,000 نسمة"),
        ("Education", "1", "Education standard", "معيار التعليم", "40 طالب/معلم"),
    ]
    for sector, num, title_en, title_ar, indicator in sphere_data:
        db.add(SphereStandard(
            sector=sector, standard_number=num,
            title_en=title_en, title_ar=title_ar,
            key_indicator=indicator,
            minimum_standard=f"الحد الأدنى: {indicator}",
        ))
    db.commit()

    gb_data = [
        ("transparency", "1", "الشفافية", "توفير بيانات مفتوحة عن التمويل"),
        ("funding", "2", "التمويل المرن", "زيادة نسبة التمويل غير المشروط"),
        ("localization", "3", "المحلية", "تخصيص 25% من التمويل للمنظمات المحلية"),
        ("reporting", "4", "تقليل التقارير", "توحيد متطلبات الإبلاغ"),
        ("participation", "5", "المشاركة", "إشراك المتضررين في صنع القرار"),
    ]
    for ws, num, title, desc in gb_data:
        db.add(GrandBargainCommitment(
            workstream=ws, commitment_number=num,
            title=title, description=desc,
            progress=round(random.uniform(30, 90), 1),
        ))
    db.commit()

    for i in range(5):
        db.add(DoNoHarmAnalysis(
            project_id=random.randint(1, 8),
            dividers=random.choice(["نزاعات قبلية", "تمييز عرقي", "نزاع على الموارد"]),
            connectors=random.choice(["تجارة مشتركة", "تزاوج بين القبائل", "مؤسسات دينية"]),
            resource_transfer_effects=random.choice(["محايد", "إيجابي", "سلبي طفيف"]),
            implicit_ethical_messages=random.choice(["إيجابي", "محايد", "يحتاج مراقبة"]),
            mitigation_actions=f"خطة التخفيف #{i+1}",
            analyst_id=random.randint(1, 5),
        ))
    db.commit()

    for i in range(6):
        db.add(GenderMarker(
            project_id=random.randint(1, 8),
            marker_code=random.choice(["0", "1", "2a", "2b", "3"]),
            needs_analysis=random.choice(["تحليل شامل", "تحليل جزئي", "بدون تحليل"]),
            overall_score=round(random.uniform(0, 4), 1),
            assessor_id=random.randint(1, 5),
        ))
    db.commit()

    from app.models.standards import DisabilityInclusionMarker
    barriers = ["وصول محدود للمرافق", "نقص في المساعدات التقنية", "وصمة اجتماعية", "بنية تحتية غير ملائمة", "نقص في التدريب"]
    accommodations = ["منحدرات كراسي متحركة", "ترجمة لغة إشارة", "مواد بصيغة بريل", "جلسات تأهيل", "نقل مخصص"]
    for i in range(5):
        scores = [round(random.uniform(0, 4), 1) for _ in range(6)]
        db.add(DisabilityInclusionMarker(
            project_id=random.randint(1, 8),
            seeing=scores[0], hearing=scores[1], walking=scores[2],
            remembering=scores[3], self_care=scores[4], communicating=scores[5],
            overall_score=round(sum(scores) / 6, 1),
            barriers_identified=random.choice(barriers),
            accommodations_planned=random.choice(accommodations),
            assessor_id=random.randint(1, 5),
        ))
    db.commit()

    # ── HR Advanced ──────────────────────────────────────────────────────
    for i in range(10):
        month = random.randint(1, 12)
        basic = random.randint(800, 3000)
        allow = random.randint(100, 500)
        deduct = random.randint(50, 300)
        db.add(PayrollRecord(
            employee_id=random.randint(1, 30),
            period_start=date(2024, month, 1),
            period_end=date(2024, month, 28),
            basic_salary=basic, allowances=allow, deductions=deduct,
            net_salary=basic + allow - deduct,
            currency="USD",
            status=random.choice(["paid", "paid", "approved", "draft"]),
            project_id=random.randint(1, 8),
            created_at=_now() - timedelta(days=random.randint(1, 180)),
        ))
    db.commit()

    for i in range(8):
        db.add(PerformanceReview(
            employee_id=random.randint(1, 30),
            reviewer_id=random.randint(1, 5),
            period=f"Q{random.randint(1, 4)}-2024",
            overall_score=round(random.uniform(2.5, 5.0), 1),
            objectives_score=round(random.uniform(2.5, 5.0), 1),
            competencies_score=round(random.uniform(2.5, 5.0), 1),
            comments=random.choice(["أداء ممتاز", "أداء جيد", "يحتاج تحسين", "متميز في العمل الميداني"]),
            goals_next_period=random.choice(["تحسين مهارات القيادة", "إكمال التدريب المهني", "تطوير المهارات التقنية"]),
            status=random.choice(["submitted", "submitted", "draft"]),
        ))
    db.commit()

    training_topics = [
        "السلامة والأمان الميداني", "إدارة المشاريع", "المتابعة والتقييم",
        "الحماية من الاستغلال والانتهاك", "الإسعافات الأولية", "التواصل مع المجتمعات",
    ]
    for topic in training_topics:
        db.add(Training(
            title=topic, description=f"تدريب متخصص في {topic}",
            provider=random.choice(["خبير خارجي", "مدرب داخلي", "شريك تدريبي"]),
            training_type=random.choice(["internal", "external", "online", "workshop"]),
            start_date=date(2024, random.randint(1, 12), random.randint(1, 28)),
            end_date=date(2024, random.randint(1, 12), random.randint(1, 28)),
            location=random.choice(GOVERNORATES[:5]),
            cost=random.randint(500, 5000),
            max_participants=random.randint(10, 30),
        ))
    db.commit()

    for i in range(10):
        db.add(Timesheet(
            employee_id=random.randint(1, 30),
            date=date.today() - timedelta(days=random.randint(1, 30)),
            hours=round(random.uniform(6, 10), 1),
            project_id=random.randint(1, 8),
            activity_type=random.choice(["field_work", "office", "travel", "training"]),
            description=random.choice(["عمل ميداني", "اجتماع", "تدريب", "إدارة", "تقارير"]),
            status=random.choice(["approved", "approved", "submitted", "draft"]),
        ))
    db.commit()

    for i in range(10):
        db.add(EmployeeContract(
            employee_id=random.randint(1, 30),
            contract_type=random.choice(["permanent", "fixed_term", "consultancy"]),
            start_date=date(2024, random.randint(1, 6), 1),
            end_date=date(2025, random.randint(6, 12), 28),
            salary=random.randint(800, 3000),
            currency="USD",
            position=random.choice(["مدير برنامج", "منسق ميداني", "محاسب", "مسؤول متابعة"]),
            department=random.choice(["البرامج", "المالية", "الموارد البشرية", "المتابعة"]),
            status=random.choice(["active", "active", "expired"]),
        ))
    db.commit()

    # ── Accounting ───────────────────────────────────────────────────────
    if db.query(Account).count() == 0:
        account_data = [
            ("1000", "النقد والبنوك", "asset"), ("1100", "البنك الرئيسي", "asset"),
            ("1200", "صندوق المصروفات النثرية", "asset"), ("2000", "الذمم الدائنة", "liability"),
            ("2100", "المستحقات", "liability"), ("3000", "صافي الأصول", "equity"),
            ("4000", "إيرادات المنح", "income"), ("4100", "تبرعات خاصة", "income"),
            ("5000", "مصاريف البرامج", "expense"), ("5100", "مصاريف إدارية", "expense"),
            ("5200", "رواتب وأجور", "expense"), ("5300", "إيجارات", "expense"),
        ]
        for code, name, atype in account_data:
            db.add(Account(code=code, name=name, name_ar=name, account_type=atype, is_active=True))
        db.commit()

        for i in range(8):
            db.add(JournalEntry(
                reference=f"JE-2024-{i+1:04d}",
                date=date.today() - timedelta(days=random.randint(1, 90)),
                description=random.choice([
                    "صرف رواتب الموظفين", "استلام منحة من USAID",
                    "دفع إيجار المكتب", "شراء مواد إغاثية",
                    "تحويل بين الحسابات", "صرف مستحقات",
                    "إيرادات تبرعات", "مصاريف سفر ميداني",
                ]),
                is_posted=random.choice([True, True, True, False]),
                created_by=1,
            ))
        db.commit()

        for je_id in range(1, 9):
            amount = round(random.uniform(5000, 50000), 2)
            db.add(JournalLine(journal_entry_id=je_id, account_id=random.randint(1, 6), debit=amount, credit=0, description="قيد مدين"))
            db.add(JournalLine(journal_entry_id=je_id, account_id=random.randint(7, 12), debit=0, credit=amount, description="قيد دائن"))
        db.commit()

        for i in range(10):
            db.add(BudgetLine(
                grant_id=random.randint(1, 6),
                project_id=random.randint(1, 8),
                account_id=random.randint(1, 12),
                description=random.choice(["رواتب", "إيجارات", "مشتريات", "سفر", "تدريب", "معدات"]),
                budgeted_amount=round(random.uniform(10000, 100000), 2),
                spent_amount=round(random.uniform(5000, 80000), 2),
                currency="USD",
                period_start=date(2024, 1, 1),
                period_end=date(2024, 12, 31),
            ))
        db.commit()

    print("All humanitarian modules seeded successfully!")
    db.close()


if __name__ == "__main__":
    seed_all_modules()
