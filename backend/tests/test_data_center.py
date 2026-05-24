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


class TestDataCenterDashboard:
    def test_dashboard(self, client, auth_headers):
        r = client.get("/api/v1/data-center/dashboard", headers=auth_headers)
        assert r.status_code == 200
        data = r.json()
        assert "policies" in data
        assert "contacts" in data
        assert "resources" in data
        assert "legal_documents" in data
        assert "donor_profiles" in data
        assert "country_profiles" in data
        assert "sectors" in data
        assert "emergency_contacts" in data
        assert "currency_rates" in data


class TestPolicies:
    def test_create_policy(self, client, auth_headers):
        r = client.post("/api/v1/data-center/policies", headers=auth_headers, json={
            "title": "سياسة الموارد البشرية",
            "category": "hr",
            "version": "2.0",
            "summary": "سياسة شاملة لإدارة الموارد البشرية",
            "approved_by": "المدير التنفيذي",
        })
        assert r.status_code == 200
        data = r.json()
        assert data["title"] == "سياسة الموارد البشرية"
        assert data["category"] == "hr"

    def test_list_policies(self, client, auth_headers):
        r = client.get("/api/v1/data-center/policies", headers=auth_headers)
        assert r.status_code == 200
        data = r.json()
        assert "items" in data
        assert "total" in data
        assert data["total"] >= 1

    def test_filter_policies_by_category(self, client, auth_headers):
        r = client.get("/api/v1/data-center/policies?category=hr", headers=auth_headers)
        assert r.status_code == 200
        for item in r.json()["items"]:
            assert item["category"] == "hr"

    def test_get_policy(self, client, auth_headers):
        r = client.get("/api/v1/data-center/policies/1", headers=auth_headers)
        assert r.status_code == 200

    def test_update_policy(self, client, auth_headers):
        r = client.put("/api/v1/data-center/policies/1", headers=auth_headers, json={
            "title": "سياسة الموارد البشرية المحدثة",
            "category": "hr",
            "version": "2.1",
        })
        assert r.status_code == 200
        assert "المحدثة" in r.json()["title"]


class TestContacts:
    def test_create_contact(self, client, auth_headers):
        r = client.post("/api/v1/data-center/contacts", headers=auth_headers, json={
            "name": "أحمد علي",
            "organization": "UNICEF",
            "contact_type": "un_agency",
            "email": "ahmed@unicef.org",
            "phone": "+967123456789",
            "city": "صنعاء",
            "country": "اليمن",
        })
        assert r.status_code == 200
        data = r.json()
        assert data["name"] == "أحمد علي"
        assert data["contact_type"] == "un_agency"

    def test_list_contacts(self, client, auth_headers):
        r = client.get("/api/v1/data-center/contacts", headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["total"] >= 1

    def test_filter_contacts(self, client, auth_headers):
        r = client.get("/api/v1/data-center/contacts?contact_type=un_agency", headers=auth_headers)
        assert r.status_code == 200


class TestResources:
    def test_create_resource(self, client, auth_headers):
        r = client.post("/api/v1/data-center/resources", headers=auth_headers, json={
            "title": "قالب تقرير المانحين",
            "resource_type": "template",
            "category": "تقارير",
            "description": "قالب موحد لتقارير المانحين",
            "language": "ar",
        })
        assert r.status_code == 200
        assert r.json()["resource_type"] == "template"

    def test_list_resources(self, client, auth_headers):
        r = client.get("/api/v1/data-center/resources", headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["total"] >= 1


class TestLegalDocuments:
    def test_create_legal_doc(self, client, auth_headers):
        r = client.post("/api/v1/data-center/legal", headers=auth_headers, json={
            "title": "مذكرة تفاهم مع OCHA",
            "doc_type": "mou",
            "party_name": "OCHA Yemen",
            "reference_number": "MOU-2026-001",
            "value": 500000,
        })
        assert r.status_code == 200
        assert r.json()["doc_type"] == "mou"
        assert r.json()["value"] == 500000

    def test_list_legal_docs(self, client, auth_headers):
        r = client.get("/api/v1/data-center/legal", headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["total"] >= 1


class TestDonorProfiles:
    def test_create_donor(self, client, auth_headers):
        r = client.post("/api/v1/data-center/donors", headers=auth_headers, json={
            "name": "European Commission",
            "acronym": "EC",
            "donor_type": "Government",
            "country": "Belgium",
            "funding_range_min": 100000,
            "funding_range_max": 5000000,
            "funding_sectors": ["WASH", "FSL", "Protection"],
        })
        assert r.status_code == 200
        data = r.json()
        assert data["acronym"] == "EC"
        assert len(data["funding_sectors"]) == 3

    def test_list_donors(self, client, auth_headers):
        r = client.get("/api/v1/data-center/donors", headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["total"] >= 1


class TestCountryProfiles:
    def test_create_country(self, client, auth_headers):
        r = client.post("/api/v1/data-center/countries", headers=auth_headers, json={
            "name": "اليمن",
            "iso_code": "YEM",
            "region": "الشرق الأوسط",
            "capital": "صنعاء",
            "population": 33000000,
            "crisis_level": "L3",
            "people_in_need": 21600000,
            "people_targeted": 17300000,
            "funding_required": 4300000000,
            "funding_received": 1800000000,
        })
        assert r.status_code == 200
        data = r.json()
        assert data["iso_code"] == "YEM"
        assert data["crisis_level"] == "L3"
        assert data["people_in_need"] == 21600000

    def test_list_countries(self, client, auth_headers):
        r = client.get("/api/v1/data-center/countries", headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["total"] >= 1


class TestSectors:
    def test_create_sector(self, client, auth_headers):
        r = client.post("/api/v1/data-center/sectors", headers=auth_headers, json={
            "name": "المياه والصرف الصحي والنظافة",
            "cluster": "WASH",
            "lead_agency": "UNICEF",
            "description": "ضمان وصول المياه النظيفة والصرف الصحي",
            "standards": ["Sphere WASH Standards", "WHO Guidelines"],
            "key_indicators": ["liters/person/day", "people per latrine"],
        })
        assert r.status_code == 200
        data = r.json()
        assert data["cluster"] == "WASH"
        assert len(data["standards"]) == 2

    def test_list_sectors(self, client, auth_headers):
        r = client.get("/api/v1/data-center/sectors", headers=auth_headers)
        assert r.status_code == 200
        assert len(r.json()) >= 1


class TestEmergencyContacts:
    def test_create_emergency_contact(self, client, auth_headers):
        r = client.post("/api/v1/data-center/emergency-contacts", headers=auth_headers, json={
            "name": "مسؤول الأمن الميداني",
            "role": "مسؤول أمن",
            "organization": "HIAOS",
            "phone": "+967777123456",
            "location": "صنعاء",
            "priority": 1,
            "available_24h": True,
        })
        assert r.status_code == 200
        data = r.json()
        assert data["available_24h"] is True
        assert data["priority"] == 1

    def test_list_emergency_contacts(self, client, auth_headers):
        r = client.get("/api/v1/data-center/emergency-contacts", headers=auth_headers)
        assert r.status_code == 200
        assert len(r.json()) >= 1


class TestCurrencyRates:
    def test_create_rate(self, client, auth_headers):
        r = client.post("/api/v1/data-center/currency-rates", headers=auth_headers, json={
            "from_currency": "USD",
            "to_currency": "YER",
            "rate": 530.5,
            "source": "Central Bank",
        })
        assert r.status_code == 200
        data = r.json()
        assert data["rate"] == 530.5
        assert data["source"] == "Central Bank"

    def test_list_rates(self, client, auth_headers):
        r = client.get("/api/v1/data-center/currency-rates", headers=auth_headers)
        assert r.status_code == 200
        assert len(r.json()) >= 1


class TestDataCenterSearchAndPagination:
    def test_search_policies(self, client, auth_headers):
        r = client.get("/api/v1/data-center/policies?search=موارد", headers=auth_headers)
        assert r.status_code == 200

    def test_search_contacts(self, client, auth_headers):
        r = client.get("/api/v1/data-center/contacts?search=أحمد", headers=auth_headers)
        assert r.status_code == 200

    def test_pagination(self, client, auth_headers):
        r = client.get("/api/v1/data-center/policies?page=1&page_size=5", headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["page"] == 1
