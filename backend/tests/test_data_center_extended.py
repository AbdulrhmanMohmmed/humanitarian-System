import pytest
from fastapi.testclient import TestClient


@pytest.fixture(scope="module")
def client():
    from main import app
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="module")
def auth_headers(client):
    r = client.post("/api/v1/auth/login", json={"username": "admin", "password": "admin123"})
    token = r.json().get("access_token", "")
    return {"Authorization": f"Bearer {token}"}


class TestPopulationRecords:
    def test_create_population_idp(self, client, auth_headers):
        r = client.post("/api/v1/data-center/population", headers=auth_headers, json={
            "governorate": "مأرب",
            "district": "مأرب المدينة",
            "sub_district": "الأشراف",
            "category": "idp",
            "gender": "total",
            "age_group": "total",
            "count": 125000,
            "year": 2026,
            "quarter": 1,
            "source": "OCHA Yemen",
            "methodology": "DTM Round 45",
        })
        assert r.status_code == 200
        data = r.json()
        assert data["governorate"] == "مأرب"
        assert data["category"] == "idp"
        assert data["count"] == 125000

    def test_create_population_host_community(self, client, auth_headers):
        r = client.post("/api/v1/data-center/population", headers=auth_headers, json={
            "governorate": "مأرب",
            "district": "مأرب المدينة",
            "category": "host_community",
            "count": 85000,
            "year": 2026,
        })
        assert r.status_code == 200
        assert r.json()["category"] == "host_community"

    def test_create_population_returnee(self, client, auth_headers):
        r = client.post("/api/v1/data-center/population", headers=auth_headers, json={
            "governorate": "عدن",
            "district": "دار سعد",
            "category": "returnee",
            "count": 15000,
            "year": 2026,
        })
        assert r.status_code == 200
        assert r.json()["category"] == "returnee"

    def test_create_population_refugee(self, client, auth_headers):
        r = client.post("/api/v1/data-center/population", headers=auth_headers, json={
            "governorate": "عدن",
            "category": "refugee",
            "count": 8500,
            "year": 2026,
            "source": "UNHCR",
        })
        assert r.status_code == 200
        assert r.json()["category"] == "refugee"

    def test_list_population(self, client, auth_headers):
        r = client.get("/api/v1/data-center/population", headers=auth_headers)
        assert r.status_code == 200
        data = r.json()
        assert "items" in data
        assert data["total"] >= 4

    def test_filter_population_by_governorate(self, client, auth_headers):
        r = client.get("/api/v1/data-center/population?governorate=مأرب", headers=auth_headers)
        assert r.status_code == 200
        for item in r.json()["items"]:
            assert "مأرب" in item["governorate"]

    def test_filter_population_by_category(self, client, auth_headers):
        r = client.get("/api/v1/data-center/population?category=idp", headers=auth_headers)
        assert r.status_code == 200
        for item in r.json()["items"]:
            assert item["category"] == "idp"

    def test_update_population(self, client, auth_headers):
        r = client.put("/api/v1/data-center/population/1", headers=auth_headers, json={
            "governorate": "مأرب",
            "category": "idp",
            "count": 130000,
            "year": 2026,
        })
        assert r.status_code == 200
        assert r.json()["count"] == 130000

    def test_delete_population(self, client, auth_headers):
        create = client.post("/api/v1/data-center/population", headers=auth_headers, json={
            "governorate": "test_delete",
            "category": "idp",
            "count": 100,
            "year": 2026,
        })
        pid = create.json()["id"]
        r = client.delete(f"/api/v1/data-center/population/{pid}", headers=auth_headers)
        assert r.status_code == 200


class TestCampSites:
    def test_create_camp(self, client, auth_headers):
        r = client.post("/api/v1/data-center/camps", headers=auth_headers, json={
            "name": "مخيم الجفينة",
            "site_id": "YEM-MAR-001",
            "camp_type": "مخيم عشوائي",
            "status": "active",
            "governorate": "مأرب",
            "district": "مأرب المدينة",
            "latitude": 15.4541,
            "longitude": 45.3244,
            "capacity": 5000,
            "current_population": 4200,
            "households": 700,
            "managed_by": "IOM",
            "water_source": "تنكر مياه",
            "available_services": ["صحة", "تعليم", "حماية", "توزيع"],
        })
        assert r.status_code == 200
        data = r.json()
        assert data["name"] == "مخيم الجفينة"
        assert data["current_population"] == 4200
        assert len(data["available_services"]) == 4

    def test_list_camps(self, client, auth_headers):
        r = client.get("/api/v1/data-center/camps", headers=auth_headers)
        assert r.status_code == 200
        data = r.json()
        assert data["total"] >= 1

    def test_filter_camps_by_governorate(self, client, auth_headers):
        r = client.get("/api/v1/data-center/camps?governorate=مأرب", headers=auth_headers)
        assert r.status_code == 200

    def test_filter_camps_by_status(self, client, auth_headers):
        r = client.get("/api/v1/data-center/camps?status=active", headers=auth_headers)
        assert r.status_code == 200

    def test_update_camp(self, client, auth_headers):
        r = client.put("/api/v1/data-center/camps/1", headers=auth_headers, json={
            "name": "مخيم الجفينة",
            "status": "active",
            "current_population": 4500,
            "households": 750,
        })
        assert r.status_code == 200
        assert r.json()["current_population"] == 4500


class TestMarketStudies:
    def test_create_market_study(self, client, auth_headers):
        r = client.post("/api/v1/data-center/market-studies", headers=auth_headers, json={
            "title": "تقييم سوق مأرب المركزي",
            "study_type": "تقييم شامل",
            "governorate": "مأرب",
            "market_name": "سوق مأرب المركزي",
            "market_functionality": "functional",
            "main_commodities": ["قمح", "أرز", "سكر", "زيت"],
            "supply_chain_status": "مستقر",
            "methodology": "مقابلات + مسح أسعار",
            "sample_size": 50,
            "conducted_by": "WFP VAM",
        })
        assert r.status_code == 200
        data = r.json()
        assert data["title"] == "تقييم سوق مأرب المركزي"
        assert len(data["main_commodities"]) == 4

    def test_list_market_studies(self, client, auth_headers):
        r = client.get("/api/v1/data-center/market-studies", headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["total"] >= 1


class TestCommodityPrices:
    def test_create_commodity_price(self, client, auth_headers):
        r = client.post("/api/v1/data-center/commodity-prices", headers=auth_headers, json={
            "commodity_name": "دقيق قمح",
            "commodity_category": "غذائية",
            "unit": "كغ",
            "price": 850.0,
            "currency": "YER",
            "governorate": "صنعاء",
            "market_name": "سوق شميلة",
            "source": "WFP ALPS",
            "is_meb_item": True,
        })
        assert r.status_code == 200
        data = r.json()
        assert data["commodity_name"] == "دقيق قمح"
        assert data["price"] == 850.0
        assert data["is_meb_item"] is True

    def test_create_another_commodity(self, client, auth_headers):
        r = client.post("/api/v1/data-center/commodity-prices", headers=auth_headers, json={
            "commodity_name": "أرز",
            "unit": "كغ",
            "price": 1200.0,
            "currency": "YER",
            "governorate": "عدن",
            "is_meb_item": True,
        })
        assert r.status_code == 200

    def test_list_commodity_prices(self, client, auth_headers):
        r = client.get("/api/v1/data-center/commodity-prices", headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["total"] >= 2

    def test_filter_meb_items(self, client, auth_headers):
        r = client.get("/api/v1/data-center/commodity-prices?is_meb_item=true", headers=auth_headers)
        assert r.status_code == 200
        for item in r.json()["items"]:
            assert item["is_meb_item"] is True


class TestMEBBaskets:
    def test_create_meb_basket(self, client, auth_headers):
        r = client.post("/api/v1/data-center/meb-baskets", headers=auth_headers, json={
            "name": "سلة الحد الأدنى للإنفاق - صنعاء",
            "basket_type": "غذائية",
            "governorate": "صنعاء",
            "total_cost": 89500.0,
            "currency": "YER",
            "household_size": 7,
            "items": [
                {"name": "دقيق قمح", "quantity": 50, "unit": "كغ", "price": 850},
                {"name": "أرز", "quantity": 10, "unit": "كغ", "price": 1200},
                {"name": "سكر", "quantity": 5, "unit": "كغ", "price": 1500},
                {"name": "زيت طبخ", "quantity": 5, "unit": "لتر", "price": 2500},
            ],
            "source": "WFP",
            "methodology": "Joint Market Monitoring Initiative",
        })
        assert r.status_code == 200
        data = r.json()
        assert data["total_cost"] == 89500.0
        assert len(data["items"]) == 4

    def test_list_meb_baskets(self, client, auth_headers):
        r = client.get("/api/v1/data-center/meb-baskets", headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["total"] >= 1


class TestNeedsAssessments:
    def test_create_needs_assessment(self, client, auth_headers):
        r = client.post("/api/v1/data-center/needs-assessments", headers=auth_headers, json={
            "title": "تقييم احتياجات WASH - مأرب",
            "assessment_type": "MSNA",
            "sector": "WASH",
            "governorate": "مأرب",
            "district": "مأرب المدينة",
            "severity": "3_severe",
            "people_in_need": 450000,
            "people_targeted": 300000,
            "households_assessed": 1200,
            "key_findings": "نقص حاد في مصادر المياه النظيفة",
            "priority_needs": ["مياه نظيفة", "صرف صحي", "نظافة"],
            "gaps_identified": ["تمويل غير كافٍ", "صعوبة وصول"],
            "conducted_by": "UNICEF + منظمات محلية",
            "methodology": "MSNA multi-sector",
            "hno_year": 2026,
        })
        assert r.status_code == 200
        data = r.json()
        assert data["severity"] == "3_severe"
        assert data["people_in_need"] == 450000
        assert len(data["priority_needs"]) == 3

    def test_list_needs_assessments(self, client, auth_headers):
        r = client.get("/api/v1/data-center/needs-assessments", headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["total"] >= 1

    def test_filter_needs_by_sector(self, client, auth_headers):
        r = client.get("/api/v1/data-center/needs-assessments?sector=WASH", headers=auth_headers)
        assert r.status_code == 200

    def test_filter_needs_by_severity(self, client, auth_headers):
        r = client.get("/api/v1/data-center/needs-assessments?severity=3_severe", headers=auth_headers)
        assert r.status_code == 200


class TestSectorFacilities:
    def test_create_health_center(self, client, auth_headers):
        r = client.post("/api/v1/data-center/facilities", headers=auth_headers, json={
            "name": "مركز صحي الجفينة",
            "facility_type": "health_center",
            "status": "functional",
            "governorate": "مأرب",
            "district": "مأرب المدينة",
            "latitude": 15.4550,
            "longitude": 45.3250,
            "capacity": 200,
            "managed_by": "MSF",
            "supported_by": ["WHO", "UNICEF"],
            "services_provided": ["رعاية أولية", "تغذية", "تطعيم", "صحة إنجابية"],
            "staff_count": 25,
            "operating_hours": "8:00-16:00",
            "beneficiaries_served": 15000,
            "catchment_population": 45000,
        })
        assert r.status_code == 200
        data = r.json()
        assert data["facility_type"] == "health_center"
        assert data["status"] == "functional"
        assert data["beneficiaries_served"] == 15000

    def test_create_school(self, client, auth_headers):
        r = client.post("/api/v1/data-center/facilities", headers=auth_headers, json={
            "name": "مدرسة النور",
            "facility_type": "school",
            "status": "partially_functional",
            "governorate": "مأرب",
            "managed_by": "وزارة التربية",
            "capacity": 500,
            "staff_count": 20,
            "beneficiaries_served": 350,
        })
        assert r.status_code == 200
        assert r.json()["facility_type"] == "school"

    def test_create_water_point(self, client, auth_headers):
        r = client.post("/api/v1/data-center/facilities", headers=auth_headers, json={
            "name": "نقطة مياه مخيم الجفينة",
            "facility_type": "water_point",
            "status": "functional",
            "governorate": "مأرب",
            "managed_by": "UNICEF",
            "beneficiaries_served": 5000,
        })
        assert r.status_code == 200
        assert r.json()["facility_type"] == "water_point"

    def test_list_facilities(self, client, auth_headers):
        r = client.get("/api/v1/data-center/facilities", headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["total"] >= 3

    def test_filter_facilities_by_type(self, client, auth_headers):
        r = client.get("/api/v1/data-center/facilities?facility_type=health_center", headers=auth_headers)
        assert r.status_code == 200
        for item in r.json()["items"]:
            assert item["facility_type"] == "health_center"

    def test_filter_facilities_by_status(self, client, auth_headers):
        r = client.get("/api/v1/data-center/facilities?status=functional", headers=auth_headers)
        assert r.status_code == 200

    def test_update_facility(self, client, auth_headers):
        r = client.put("/api/v1/data-center/facilities/1", headers=auth_headers, json={
            "name": "مركز صحي الجفينة",
            "facility_type": "health_center",
            "status": "functional",
            "beneficiaries_served": 18000,
            "staff_count": 30,
        })
        assert r.status_code == 200
        assert r.json()["beneficiaries_served"] == 18000


class TestExtendedDashboard:
    def test_dashboard_includes_new_sections(self, client, auth_headers):
        r = client.get("/api/v1/data-center/dashboard", headers=auth_headers)
        assert r.status_code == 200
        data = r.json()
        assert "population_records" in data
        assert "camp_sites" in data
        assert "market_studies" in data
        assert "commodity_prices" in data
        assert "meb_baskets" in data
        assert "needs_assessments" in data
        assert "sector_facilities" in data
        assert data["population_records"] >= 3
        assert data["camp_sites"] >= 1
        assert data["sector_facilities"] >= 3
