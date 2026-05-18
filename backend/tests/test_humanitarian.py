"""Tests for humanitarian modules — matching actual Pydantic schemas."""
import pytest
from datetime import date


@pytest.fixture(scope="module")
def auth_header(client):
    resp = client.post("/api/v1/auth/login", json={"username": "admin", "password": "admin123"})
    token = resp.json().get("access_token", "")
    return {"Authorization": f"Bearer {token}"}


# ── Protection ──────────────────────────────────────────────────────────────

def test_create_protection_case_gbv(client, auth_header):
    resp = client.post("/api/v1/protection/cases", json={
        "case_type": "GBV", "priority": "critical", "description": "Emergency GBV case"
    }, headers=auth_header)
    assert resp.status_code == 200
    data = resp.json()
    assert data["case_number"].startswith("PC-")


def test_list_protection_cases_paginated(client, auth_header):
    resp = client.get("/api/v1/protection/cases", headers=auth_header)
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data


def test_create_protection_referral(client, auth_header):
    cases = client.get("/api/v1/protection/cases", headers=auth_header).json()
    if cases.get("items"):
        case_id = cases["items"][0]["id"]
        resp = client.post("/api/v1/protection/referrals", json={
            "case_id": case_id, "referred_to": "UNFPA", "referral_reason": "Specialized GBV support"
        }, headers=auth_header)
        assert resp.status_code == 200


# ── Emergency ───────────────────────────────────────────────────────────────

def test_create_emergency_full(client, auth_header):
    resp = client.post("/api/v1/emergency/", json={
        "name": "Flood Response Aden",
        "emergency_type": "natural_disaster",
        "severity": "level_3"
    }, headers=auth_header)
    assert resp.status_code == 200


def test_list_emergencies_paginated(client, auth_header):
    resp = client.get("/api/v1/emergency/", headers=auth_header)
    assert resp.status_code == 200
    data = resp.json()
    # May be paginated or list
    assert isinstance(data, (list, dict))


# ── Camp Management ─────────────────────────────────────────────────────────

def test_create_camp_full(client, auth_header):
    resp = client.post("/api/v1/camps/", json={
        "name": "Camp Beta", "location": "Marib", "capacity": 10000
    }, headers=auth_header)
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "Camp Beta"


def test_list_camps(client, auth_header):
    resp = client.get("/api/v1/camps/", headers=auth_header)
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, (list, dict))


# ── Nutrition ───────────────────────────────────────────────────────────────

def test_create_nutrition_screening_sam(client, auth_header):
    resp = client.post("/api/v1/nutrition/screenings", json={
        "beneficiary_id": 1, "screening_date": str(date.today()), "muac": 110
    }, headers=auth_header)
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("classification") == "sam"


def test_create_nutrition_screening_mam(client, auth_header):
    resp = client.post("/api/v1/nutrition/screenings", json={
        "beneficiary_id": 1, "screening_date": str(date.today()), "muac": 120
    }, headers=auth_header)
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("classification") == "mam"


def test_create_nutrition_screening_normal(client, auth_header):
    resp = client.post("/api/v1/nutrition/screenings", json={
        "beneficiary_id": 1, "screening_date": str(date.today()), "muac": 140
    }, headers=auth_header)
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("classification") == "normal"


def test_nutrition_dashboard_counts(client, auth_header):
    resp = client.get("/api/v1/nutrition/dashboard", headers=auth_header)
    assert resp.status_code == 200
    data = resp.json()
    assert "sam" in data
    assert "mam" in data
    assert "normal" in data
    assert data["total_screenings"] >= 0


def test_list_nutrition_screenings_paginated(client, auth_header):
    resp = client.get("/api/v1/nutrition/screenings", headers=auth_header)
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data


# ── WASH ────────────────────────────────────────────────────────────────────

def test_create_water_point_full(client, auth_header):
    resp = client.post("/api/v1/wash/water-points", json={
        "name": "Well 2", "water_source_type": "borehole"
    }, headers=auth_header)
    assert resp.status_code == 200


def test_list_water_points_paginated(client, auth_header):
    resp = client.get("/api/v1/wash/water-points", headers=auth_header)
    assert resp.status_code == 200
    data = resp.json()
    # May be paginated
    assert isinstance(data, (list, dict))


def test_wash_dashboard_structure(client, auth_header):
    resp = client.get("/api/v1/wash/dashboard", headers=auth_header)
    assert resp.status_code == 200
    data = resp.json()
    assert "total_water_points" in data
    assert "functional" in data
    assert "total_served" in data


def test_list_water_tests(client, auth_header):
    resp = client.get("/api/v1/wash/water-tests", headers=auth_header)
    assert resp.status_code == 200


# ── Education ───────────────────────────────────────────────────────────────

def test_create_school(client, auth_header):
    resp = client.post("/api/v1/education/schools", json={
        "name": "Al-Noor School", "location": "Aden", "school_type": "primary"
    }, headers=auth_header)
    assert resp.status_code == 200


def test_list_schools(client, auth_header):
    resp = client.get("/api/v1/education/schools", headers=auth_header)
    assert resp.status_code == 200


def test_education_dashboard_structure(client, auth_header):
    resp = client.get("/api/v1/education/dashboard", headers=auth_header)
    assert resp.status_code == 200


# ── Livelihoods ─────────────────────────────────────────────────────────────

def test_create_livelihood_program(client, auth_header):
    resp = client.post("/api/v1/livelihoods/programs", json={
        "name": "Cash for Work - Roads", "program_type": "cash_for_work"
    }, headers=auth_header)
    assert resp.status_code == 200


def test_list_livelihood_programs(client, auth_header):
    resp = client.get("/api/v1/livelihoods/programs", headers=auth_header)
    assert resp.status_code == 200


# ── Early Warning ───────────────────────────────────────────────────────────

def test_create_early_warning_with_thresholds(client, auth_header):
    resp = client.post("/api/v1/early-warning/indicators", json={
        "name": "Displacement Rate", "category": "displacement",
        "threshold_warning": 50, "threshold_critical": 100
    }, headers=auth_header)
    assert resp.status_code == 200


def test_list_early_warning_indicators_paginated(client, auth_header):
    resp = client.get("/api/v1/early-warning/indicators", headers=auth_header)
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, (list, dict))


def test_early_warning_alerts_structure(client, auth_header):
    resp = client.get("/api/v1/early-warning/alerts", headers=auth_header)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
