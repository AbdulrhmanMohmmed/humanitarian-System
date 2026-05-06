"""Seed the database with sample data for demonstration."""
from datetime import date, datetime, timedelta
import random
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models import (
    Base, User, Beneficiary, Project, Activity, Grant, Transaction,
    Employee, Warehouse, InventoryItem, Distribution, CashTransfer,
    Indicator, Measurement, Survey, SurveyQuestion
)
from app.auth import get_password_hash
from app.schema_maintenance import ensure_runtime_columns

GOVERNORATES = ["صنعاء", "عدن", "تعز", "الحديدة", "إب", "حضرموت", "مأرب", "ذمار", "حجة", "البيضاء"]
DISTRICTS = ["المركز", "الشمالي", "الجنوبي", "الشرقي", "الغربي"]
SECTORS = ["الصحة", "التعليم", "الأمن الغذائي", "المياه والصرف الصحي", "الحماية", "المأوى"]
DEPARTMENTS = ["البرامج", "المالية", "الموارد البشرية", "اللوجستيات", "المتابعة والتقييم", "الإدارة"]
DONORS = ["USAID", "ECHO", "UNICEF", "WFP", "DFID", "SIDA", "BMZ", "SDC"]


def seed_database():
    Base.metadata.create_all(bind=engine)
    ensure_runtime_columns()
    db = SessionLocal()

    if db.query(User).count() > 0:
        print("Database already seeded.")
        db.close()
        return

    print("Seeding database...")

    # Users
    admin = User(
        username="admin",
        email="admin@humanitarian.org",
        full_name="مدير النظام",
        hashed_password=get_password_hash("admin123"),
        role="admin",
        department="الإدارة",
    )
    db.add(admin)

    users_data = [
        ("mohammed", "محمد أحمد", "manager", "البرامج"),
        ("fatima", "فاطمة علي", "field_officer", "المتابعة والتقييم"),
        ("ahmed", "أحمد سالم", "finance", "المالية"),
        ("sara", "سارة حسين", "hr", "الموارد البشرية"),
    ]
    for uname, fname, role, dept in users_data:
        u = User(
            username=uname, email=f"{uname}@humanitarian.org",
            full_name=fname, hashed_password=get_password_hash("pass123"),
            role=role, department=dept,
        )
        db.add(u)
    db.commit()

    # Beneficiaries
    first_names_m = ["محمد", "أحمد", "علي", "عبدالله", "خالد", "سالم", "يوسف", "إبراهيم", "عمر", "حسن"]
    first_names_f = ["فاطمة", "عائشة", "مريم", "نورة", "سارة", "هند", "أمل", "ليلى", "زينب", "رقية"]
    last_names = ["الحارثي", "السعيدي", "العمري", "الزبيدي", "المقطري", "الشرعبي", "الكمالي", "العبدلي", "النعمان", "الحيمي"]

    for i in range(150):
        gender = random.choice(["male", "female"])
        first = random.choice(first_names_m if gender == "male" else first_names_f)
        last = random.choice(last_names)
        gov = random.choice(GOVERNORATES)
        b = Beneficiary(
            national_id=f"YEM{random.randint(100000000, 999999999)}",
            first_name=first, last_name=last,
            gender=gender,
            date_of_birth=date(random.randint(1960, 2015), random.randint(1, 12), random.randint(1, 28)),
            phone=f"77{random.randint(1000000, 9999999)}",
            governorate=gov,
            district=random.choice(DISTRICTS),
            village=f"قرية {i+1}",
            household_size=random.randint(1, 12),
            head_of_household=random.choice([True, False]),
            vulnerability_score=round(random.uniform(0, 10), 1),
            status=random.choice(["active", "active", "active", "inactive"]),
            registered_by=1,
        )
        db.add(b)
    db.commit()

    # Projects
    projects_data = [
        ("PRJ-001", "برنامج الاستجابة الصحية الطارئة", "الصحة", "active"),
        ("PRJ-002", "مشروع تعزيز الأمن الغذائي", "الأمن الغذائي", "active"),
        ("PRJ-003", "برنامج المياه والصرف الصحي", "المياه والصرف الصحي", "active"),
        ("PRJ-004", "مشروع حماية الطفولة", "الحماية", "active"),
        ("PRJ-005", "برنامج التعليم في حالات الطوارئ", "التعليم", "active"),
        ("PRJ-006", "مشروع المأوى الطارئ", "المأوى", "completed"),
        ("PRJ-007", "برنامج التغذية المجتمعية", "الصحة", "planned"),
        ("PRJ-008", "مشروع سبل العيش", "الأمن الغذائي", "planned"),
    ]
    for code, name, sector, status in projects_data:
        budget = random.randint(100000, 2000000)
        spent = int(budget * random.uniform(0.1, 0.8)) if status == "active" else (budget if status == "completed" else 0)
        p = Project(
            code=code, name=name, sector=sector, status=status,
            description=f"وصف تفصيلي لـ {name}",
            start_date=date(2024, random.randint(1, 6), 1),
            end_date=date(2025, random.randint(6, 12), 28),
            budget=budget, spent=spent, currency="USD",
            target_beneficiaries=random.randint(500, 5000),
            actual_beneficiaries=random.randint(200, 3000) if status != "planned" else 0,
            governorate=random.choice(GOVERNORATES),
            donor=random.choice(DONORS),
            manager_id=1,
        )
        db.add(p)
    db.commit()

    # Activities for projects
    for pid in range(1, 9):
        for j in range(3):
            a = Activity(
                project_id=pid,
                name=f"نشاط {j+1}",
                description=f"وصف النشاط {j+1}",
                start_date=date(2024, random.randint(1, 6), 1),
                end_date=date(2025, random.randint(6, 12), 28),
                budget=random.randint(10000, 100000),
                spent=random.randint(5000, 50000),
                progress=round(random.uniform(0, 100), 1),
                status=random.choice(["active", "planned", "completed"]),
            )
            db.add(a)
    db.commit()

    # Grants
    for i in range(6):
        donor = random.choice(DONORS)
        amount = random.randint(200000, 3000000)
        g = Grant(
            code=f"GRN-{2024}-{i+1:03d}",
            name=f"منحة {donor} - {i+1}",
            donor=donor,
            amount=amount,
            spent=int(amount * random.uniform(0.1, 0.6)),
            currency="USD",
            status=random.choice(["active", "active", "approved", "completed"]),
            start_date=date(2024, random.randint(1, 6), 1),
            end_date=date(2025, random.randint(6, 12), 28),
            project_id=random.randint(1, 5),
            conditions=f"شروط المنحة من {donor}",
        )
        db.add(g)
    db.commit()

    # Transactions
    categories = ["رواتب", "إيجارات", "مشتريات", "سفر", "تدريب", "معدات", "خدمات"]
    for i in range(40):
        t_type = random.choice(["income", "expense", "expense", "expense"])
        t = Transaction(
            reference=f"TXN-{2024}-{i+1:04d}",
            type=t_type,
            amount=random.randint(1000, 100000),
            currency="USD",
            description=f"معاملة مالية #{i+1}",
            category=random.choice(categories),
            grant_id=random.randint(1, 6) if t_type == "expense" else None,
            project_id=random.randint(1, 5),
            approved_by=1,
            transaction_date=date(2024, random.randint(1, 12), random.randint(1, 28)),
        )
        db.add(t)
    db.commit()

    # Employees
    positions = ["مدير برنامج", "منسق ميداني", "محاسب", "مسؤول موارد بشرية", "مهندس", "طبيب", "ممرض", "سائق", "حارس", "مسؤول متابعة"]
    for i in range(30):
        gender = random.choice(["male", "female"])
        first = random.choice(first_names_m if gender == "male" else first_names_f)
        last = random.choice(last_names)
        e = Employee(
            employee_id=f"EMP-{i+1:04d}",
            first_name=first, last_name=last,
            email=f"emp{i+1}@humanitarian.org",
            phone=f"73{random.randint(1000000, 9999999)}",
            gender=gender,
            date_of_birth=date(random.randint(1975, 2000), random.randint(1, 12), random.randint(1, 28)),
            hire_date=date(random.randint(2020, 2024), random.randint(1, 12), 1),
            department=random.choice(DEPARTMENTS),
            position=random.choice(positions),
            salary=random.randint(500, 3000),
            currency="USD",
            status="active",
            contract_type=random.choice(["دائم", "مؤقت", "استشاري"]),
            office_location=random.choice(GOVERNORATES[:5]),
        )
        db.add(e)
    db.commit()

    # Warehouses
    for i, gov in enumerate(GOVERNORATES[:5]):
        w = Warehouse(
            name=f"مخزن {gov}",
            code=f"WH-{i+1:03d}",
            location=f"منطقة المخازن - {gov}",
            governorate=gov,
            capacity=random.randint(100, 1000),
            manager_id=1,
        )
        db.add(w)
    db.commit()

    # Inventory Items
    items = [
        ("أرز", "food", "كيلو"), ("دقيق", "food", "كيلو"), ("زيت طبخ", "food", "لتر"),
        ("سكر", "food", "كيلو"), ("فاصوليا", "food", "كيلو"),
        ("باراسيتامول", "medicine", "علبة"), ("أموكسيسيلين", "medicine", "علبة"),
        ("ضمادات", "medicine", "عبوة"), ("محلول ملحي", "medicine", "لتر"),
        ("خيمة عائلية", "shelter", "وحدة"), ("بطانيات", "shelter", "قطعة"),
        ("صابون", "wash", "قطعة"), ("كلور", "wash", "لتر"),
        ("أدوات مطبخ", "nfi", "طقم"), ("فرشات", "nfi", "قطعة"),
        ("حقائب مدرسية", "education", "قطعة"), ("دفاتر", "education", "رزمة"),
    ]
    for name, cat, unit in items:
        for wid in range(1, 6):
            item = InventoryItem(
                name=name, sku=f"SKU-{name[:3]}-{wid}",
                category=cat, quantity=random.randint(50, 5000),
                unit=unit, min_stock=random.randint(10, 100),
                warehouse_id=wid,
                unit_cost=round(random.uniform(0.5, 50), 2),
                currency="USD",
            )
            db.add(item)
    db.commit()

    # Distributions
    for i in range(10):
        d = Distribution(
            title=f"توزيع {random.choice(['غذائي', 'طبي', 'مأوى', 'NFI'])} - {random.choice(GOVERNORATES)}",
            project_id=random.randint(1, 5),
            warehouse_id=random.randint(1, 5),
            distribution_date=date(2024, random.randint(1, 12), random.randint(1, 28)),
            location=random.choice(GOVERNORATES),
            governorate=random.choice(GOVERNORATES),
            status=random.choice(["completed", "completed", "in_progress", "planned"]),
            total_beneficiaries=random.randint(50, 500),
            created_by=1,
        )
        db.add(d)
    db.commit()

    # Cash Transfers
    methods = ["bank", "mobile_money", "hawala", "cash_in_hand"]
    for i in range(25):
        ct = CashTransfer(
            reference=f"CT-2024{random.randint(1, 12):02d}{random.randint(1, 28):02d}-{random.randint(100000, 999999)}",
            beneficiary_id=random.randint(1, 150),
            project_id=random.randint(1, 5),
            amount=random.randint(10000, 100000),
            currency="YER",
            method=random.choice(methods),
            status=random.choice(["disbursed", "received", "pending", "approved"]),
            purpose=random.choice(["إيجار", "غذاء", "صحة", "تعليم", "سبل عيش"]),
            transfer_date=date(2024, random.randint(1, 12), random.randint(1, 28)),
            agent_name=f"وكيل {random.randint(1, 10)}",
            approved_by=1,
        )
        db.add(ct)
    db.commit()

    # Indicators
    indicator_data = [
        ("IND-001", "عدد المستفيدين من الخدمات الصحية", "output", "شخص", 5000),
        ("IND-002", "عدد الأطفال المحصنين", "output", "طفل", 3000),
        ("IND-003", "نسبة الأسر التي تحسن أمنها الغذائي", "outcome", "نسبة مئوية", 70),
        ("IND-004", "عدد المدارس المؤهلة", "output", "مدرسة", 50),
        ("IND-005", "نسبة رضا المستفيدين", "outcome", "نسبة مئوية", 80),
        ("IND-006", "كمية المياه الموزعة", "output", "لتر", 1000000),
        ("IND-007", "عدد النازحين المستفيدين من المأوى", "output", "أسرة", 2000),
        ("IND-008", "نسبة انخفاض سوء التغذية", "impact", "نسبة مئوية", 30),
    ]
    for code, name, itype, unit, target in indicator_data:
        ind = Indicator(
            code=code, name=name, type=itype, unit=unit,
            target_value=target,
            actual_value=int(target * random.uniform(0.3, 0.9)),
            project_id=random.randint(1, 5),
            baseline=int(target * 0.1),
            data_source="تقارير ميدانية",
            frequency="شهري",
        )
        db.add(ind)
    db.commit()

    # Measurements
    for ind_id in range(1, 9):
        for month in range(1, 13):
            m = Measurement(
                indicator_id=ind_id,
                value=random.randint(10, 500),
                date=date(2024, month, 15),
                notes=f"قياس شهر {month}",
                collected_by=random.randint(1, 5),
                governorate=random.choice(GOVERNORATES),
            )
            db.add(m)
    db.commit()

    # Surveys
    survey = Survey(
        title="استبيان رضا المستفيدين 2024",
        description="استبيان لقياس مستوى رضا المستفيدين عن الخدمات المقدمة",
        project_id=1,
        is_active=True,
        total_responses=125,
        start_date=date(2024, 1, 1),
        end_date=date(2024, 12, 31),
        created_by=1,
    )
    db.add(survey)
    db.commit()

    questions = [
        ("ما مستوى رضاك عن الخدمات المقدمة؟", "choice", "راضٍ جداً,راضٍ,محايد,غير راضٍ"),
        ("هل وصلتك المساعدات في الوقت المناسب؟", "choice", "نعم,لا,أحياناً"),
        ("ما هي الخدمات التي تحتاجها أكثر؟", "text", None),
        ("كيف تقيم تعامل فريق العمل؟", "choice", "ممتاز,جيد,مقبول,ضعيف"),
    ]
    for text, qtype, options in questions:
        q = SurveyQuestion(
            survey_id=1,
            question_text=text,
            question_type=qtype,
            options=options,
            is_required=True,
            order=questions.index((text, qtype, options)),
        )
        db.add(q)
    db.commit()

    print("Database seeded successfully!")
    db.close()


if __name__ == "__main__":
    seed_database()
