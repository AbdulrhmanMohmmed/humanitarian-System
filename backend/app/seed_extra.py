from datetime import date, datetime, timedelta
import random
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models import Project, User, Base
from app.models.finance import Donor, Grant
from app.models.hr import Employee, Payroll, Payslip
from app.models.financial_engine import ExchangeRate, BudgetAllocation
from app.models.risk_management import IncidentReport, RiskMatrix
from app.models.partners import Partner, SubGrant
from app.models.procurement import Vendor, PurchaseRequest, Quote, PurchaseOrder
from app.models.logistics import Asset, Vehicle, FuelLog
from app.models.enums import (
    ProcurementStatus, PurchaseOrderStatus, VendorCategory, 
    GrantCategory, GrantStatus, Currency,
    AssetStatus, VehicleStatus, FuelType, EmployeeStatus
)

def seed_extra_data():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    print("Adding extra seed data for new modules...")

    # 1. Donors
    if db.query(Donor).count() > 0:
        print("Donors already exist. Skipping donor seeding.")
        donors_list = db.query(Donor).all()
    else:
        donors_data = [
            ("USAID", "United States Agency for International Development"),
            ("ECHO", "European Civil Protection and Humanitarian Aid Operations"),
            ("UNICEF", "United Nations Children's Fund"),
            ("WFP", "World Food Programme"),
            ("EHF", "Yemen Humanitarian Fund"),
        ]
        
        donors_list = []
        for short, full in donors_data:
            donor = Donor(
                name=full,
                short_name=short,
                description=f"المانح الدولي {short} لدعم العمل الإنساني في اليمن.",
                website=f"https://www.{short.lower()}.org",
                contact_person=f"Representative of {short}",
                email=f"contact@{short.lower()}.org"
            )
            db.add(donor)
            donors_list.append(donor)
        db.commit()

    # 2. Update Projects with GIS Coordinates
    # ... (coordinates update is idempotent)

    # 2. Update Projects with GIS Coordinates
    # Coordinates for some Yemeni cities
    YEMEN_COORDS = [
        (15.3694, 44.1910), # Sana'a
        (12.7855, 45.0186), # Aden
        (13.5795, 44.0116), # Taiz
        (14.7922, 42.9544), # Hodeidah
        (13.9721, 44.1725), # Ibb
        (14.5422, 45.2671), # Marib
        (14.4578, 44.3822), # Dhamar
    ]
    
    projects = db.query(Project).all()
    for i, p in enumerate(projects):
        coord = YEMEN_COORDS[i % len(YEMEN_COORDS)]
        p.latitude = coord[0] + random.uniform(-0.05, 0.05)
        p.longitude = coord[1] + random.uniform(-0.05, 0.05)
    db.commit()

    # 3. Grants
    for i, p in enumerate(projects[:5]):
        donor = donors_list[i % len(donors_list)]
        g = Grant(
            name=f"منحة دعم {p.sector} - {donor.short_name}",
            donor_id=donor.id,
            category=GrantCategory.HUMANITARIAN,
            amount=p.budget * 1.2,
            spent=p.spent,
            currency=Currency.USD,
            status=GrantStatus.ACTIVE,
            start_date=p.start_date,
            end_date=p.end_date,
            project_id=p.id
        )
        db.add(g)
    db.commit()

    # 4. Vendors
    if db.query(Vendor).count() > 0:
        print("Vendors already exist. Skipping vendor seeding.")
        vendors_list = db.query(Vendor).all()
    else:
        vendors_data = [
            ("مجموعة هائل سعيد أنعم", VendorCategory.SUPPLIER, "تعز"),
            ("شركة العربي للتجارة", VendorCategory.SUPPLIER, "صنعاء"),
            ("مؤسسة الشفق الطبية", VendorCategory.SERVICE_PROVIDER, "عدن"),
            ("مقاولات الوحدة", VendorCategory.CONTRACTOR, "مأرب"),
            ("استشارات الأمل", VendorCategory.CONSULTANT, "صنعاء"),
        ]
        
        vendors_list = []
        for name, cat, city in vendors_data:
            v = Vendor(
                name=name,
                category=cat,
                contact_name=f"مدير مبيعات {name}",
                email=f"info@{name.split()[0]}.com",
                phone=f"77{random.randint(1000000, 9999999)}",
                address=f"اليمن - {city}",
                is_active=1
            )
            db.add(v)
            vendors_list.append(v)
        db.commit()

    # 5. Purchase Requests & Quotes
    if db.query(PurchaseRequest).count() > 0:
        print("Purchase requests already exist. Skipping.")
    else:
        for i in range(5):
            p = random.choice(projects)
            pr = PurchaseRequest(
                request_number=f"PR-2024-{i+1:03d}",
                title=f"شراء مواد إغاثية لـ {p.name}",
                description=f"طلب توريد مواد طارئة لدعم أنشطة {p.sector}.",
                estimated_cost=random.randint(5000, 50000),
                currency=Currency.USD,
                status=ProcurementStatus.AWARDED if i < 3 else ProcurementStatus.PENDING_APPROVAL,
                project_id=p.id,
                requested_by_id=1
            )
            db.add(pr)
            db.commit() # Commit to get ID
            
            # Add Quotes
            for v in random.sample(vendors_list, 3):
                q = Quote(
                    purchase_request_id=pr.id,
                    vendor_id=v.id,
                    amount=pr.estimated_cost * random.uniform(0.9, 1.1),
                    currency=pr.currency,
                    delivery_time="15 يوماً",
                    is_winner=1 if (v.id == vendors_list[0].id and pr.status == ProcurementStatus.AWARDED) else 0
                )
                db.add(q)
                
                # If winner, create PO
                if q.is_winner:
                    po = PurchaseOrder(
                        po_number=f"PO-2024-{i+1:03d}",
                        purchase_request_id=pr.id,
                        vendor_id=v.id,
                        total_amount=q.amount,
                        currency=q.currency,
                        status=PurchaseOrderStatus.CONFIRMED
                    )
                    db.add(po)
        db.commit()

    # 6. Assets
    if db.query(Asset).count() > 0:
        print("Assets already exist. Skipping.")
    else:
        assets_data = [
            ("AST-LAP-001", "Laptop Dell Latitude", "Laptops", "SN123456", 1200.0, "صنعاء"),
            ("AST-PRN-002", "HP LaserJet Pro", "Printers", "SN889900", 450.0, "عدن"),
            ("AST-TBL-003", "Samsung Galaxy Tab", "Tablets", "SN554433", 350.0, "تعز"),
        ]
        
        for code, name, cat, sn, cost, loc in assets_data:
            asset = Asset(
                code=code, name=name, category=cat, serial_number=sn,
                purchase_date=date.today() - timedelta(days=random.randint(100, 500)),
                purchase_cost=cost, currency=Currency.USD, status=AssetStatus.ACTIVE,
                location=loc, condition="Good", assigned_to_id=1
            )
            db.add(asset)
        db.commit()
    
    # 7. Vehicles & Fuel
    if db.query(Vehicle).count() > 0:
        print("Vehicles already exist. Skipping.")
    else:
        vehicles_data = [
            ("12345/1", "Toyota", "Land Cruiser", 2022, "PETROL", "صنعاء"),
            ("67890/2", "Nissan", "Patrol", 2021, "DIESEL", "عدن"),
        ]
        
        for plate, make, model, year, fuel, gov in vehicles_data:
            v = Vehicle(
                plate_number=plate, make=make, model=model, year=year,
                status=VehicleStatus.AVAILABLE, governorate=gov,
                fuel_type=FuelType[fuel], current_odometer=random.randint(10000, 50000),
                assigned_driver_id=1
            )
            db.add(v)
            db.commit() # Get ID
            
            # Add a fuel log
            fl = FuelLog(
                vehicle_id=v.id, date=date.today(), 
                odometer_reading=v.current_odometer + 150,
                liters=45.0, cost=65.0, currency=Currency.USD,
                fuel_station="محطة الأمل", recorded_by_id=1
            )
            db.add(fl)
        db.commit()

    # 8. HR & Payroll
    if db.query(Employee).count() > 0:
        print("Employees already exist. Skipping.")
        employees = db.query(Employee).all()
    else:
        employees_data = [
            ("EMP001", "أحمد", "علي", "ahmed@hiaos.org", 2500.0, "البرامج"),
            ("EMP002", "سارة", "خالد", "sara@hiaos.org", 2200.0, "المتابعة والتقييم"),
            ("EMP003", "محمد", "عثمان", "mohamed@hiaos.org", 3000.0, "الإدارة"),
        ]
        employees = []
        for eid, f, l, email, sal, dep in employees_data:
            emp = Employee(
                employee_id=eid, first_name=f, last_name=l, email=email,
                salary=sal, department=dep, status=EmployeeStatus.ACTIVE,
                hire_date=date.today() - timedelta(days=365)
            )
            db.add(emp)
            employees.append(emp)
        db.commit()

    # Generate a draft payroll for the current month
    if db.query(Payroll).count() == 0:
        payroll = Payroll(
            month=date.today().month,
            year=date.today().year,
            status="draft",
            total_gross=sum(e.salary for e in employees),
            total_net=sum(e.salary * 1.05 for e in employees) # Mock net
        )
        db.add(payroll)
        db.commit()

    # 9. Financial Engine (Exchange Rates)
    if db.query(ExchangeRate).count() == 0:
        rates = [
            (Currency.USD, Currency.YER, 530.0, "Sana'a"),
            (Currency.USD, Currency.YER, 1680.0, "Aden"),
            (Currency.USD, Currency.SAR, 3.75, "Global"),
        ]
        for f, t, r, reg in rates:
            db.add(ExchangeRate(from_currency=f, to_currency=t, rate=r, region=reg))
        db.commit()

    # 10. Risk & Incidents
    if db.query(IncidentReport).count() == 0:
        incident = IncidentReport(
            title="تأخر القافلة في نقطة عبور",
            description="تم احتجاز شاحنات المواد الإغاثية لمدة 48 ساعة بسبب إجراءات تفتيش إضافية.",
            location_name="منفذ الضباب - تعز",
            severity="Medium",
            reported_by_id=1,
            project_id=1
        )
        db.add(incident)
        
        # Risk Matrix for Project 1
        db.add(RiskMatrix(
            project_id=1, category="Security", 
            risk_description="النزاع المسلح وتأثيره على سلاسل الإمداد",
            probability=4, impact=5, 
            mitigation_plan="استخدام طرق بديلة والتنسيق المسبق مع الكتل القطاعية."
        ))
        db.commit()

    # 11. Partners
    if db.query(Partner).count() == 0:
        partners_data = [
            ("منظمة صناع النهضة", "Nahda Makers", "Local NGO", 4.8),
            ("مؤسسة تمدين شباب", "Tamdeen Youth", "Local NGO", 4.5),
        ]
        for n, a, t, r in partners_data:
            db.add(Partner(name=n, acronym=a, type=t, rating=r))
        db.commit()

    print("Extra seed data added successfully!")
    db.close()

if __name__ == "__main__":
    seed_extra_data()
