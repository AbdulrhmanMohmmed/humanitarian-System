"""Tests for all new modules and endpoints."""
import pytest
from fastapi.testclient import TestClient


@pytest.fixture(scope="module")
def auth_header(client):
    """Get auth token from seeded admin user."""
    resp = client.post("/api/v1/auth/login", json={"username": "admin", "password": "admin123"})
    token = resp.json().get("access_token", "")
    return {"Authorization": f"Bearer {token}"}


# ── MFA ──────────────────────────────────────────────────────────────────────

def test_mfa_status(client, auth_header):
    resp = client.get("/api/v1/mfa/status", headers=auth_header)
    assert resp.status_code == 200
    assert "mfa_enabled" in resp.json()


def test_mfa_setup(client, auth_header):
    resp = client.post("/api/v1/mfa/setup", headers=auth_header)
    assert resp.status_code == 200
    data = resp.json()
    assert "secret" in data
    assert "qr_uri" in data
    assert "backup_codes" in data


# ── Security ─────────────────────────────────────────────────────────────────

def test_create_api_key(client, auth_header):
    resp = client.post("/api/v1/security/api-keys", json={"name": "Test Key"}, headers=auth_header)
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "Test Key"
    assert data["key"].startswith("hiaos_")


def test_list_api_keys(client, auth_header):
    resp = client.get("/api/v1/security/api-keys", headers=auth_header)
    assert resp.status_code == 200


def test_list_sessions(client, auth_header):
    resp = client.get("/api/v1/security/sessions", headers=auth_header)
    assert resp.status_code == 200


# ── Accounting ───────────────────────────────────────────────────────────────

def test_seed_chart_of_accounts(client, auth_header):
    resp = client.post("/api/v1/accounting/accounts/seed", headers=auth_header)
    assert resp.status_code == 200
    assert "seeded" in resp.json()


def test_list_accounts(client, auth_header):
    resp = client.get("/api/v1/accounting/accounts", headers=auth_header)
    assert resp.status_code == 200


def test_trial_balance(client, auth_header):
    resp = client.get("/api/v1/accounting/trial-balance", headers=auth_header)
    assert resp.status_code == 200


# ── MEAL Advanced ────────────────────────────────────────────────────────────

def test_seed_global_indicators(client, auth_header):
    resp = client.post("/api/v1/meal/indicators/seed-global", headers=auth_header)
    assert resp.status_code == 200


def test_list_indicator_registry(client, auth_header):
    resp = client.get("/api/v1/meal/indicators/registry", headers=auth_header)
    assert resp.status_code == 200


def test_run_deduplication(client, auth_header):
    resp = client.post("/api/v1/meal/deduplication/run", headers=auth_header)
    assert resp.status_code == 200
    assert "matches_found" in resp.json()


# ── Standards ────────────────────────────────────────────────────────────────

def test_seed_sphere_standards(client, auth_header):
    resp = client.post("/api/v1/standards/sphere/seed", headers=auth_header)
    assert resp.status_code == 200


def test_list_sphere(client, auth_header):
    resp = client.get("/api/v1/standards/sphere", headers=auth_header)
    assert resp.status_code == 200


# ── Protection ───────────────────────────────────────────────────────────────

def test_create_protection_case(client, auth_header):
    resp = client.post("/api/v1/protection/cases", json={
        "case_type": "child_protection", "priority": "high", "description": "Test case"
    }, headers=auth_header)
    assert resp.status_code == 200
    assert "case_number" in resp.json()


def test_list_protection_cases(client, auth_header):
    resp = client.get("/api/v1/protection/cases", headers=auth_header)
    assert resp.status_code == 200


# ── Emergency ────────────────────────────────────────────────────────────────

def test_create_emergency(client, auth_header):
    resp = client.post("/api/v1/emergency/", json={
        "name": "Test Emergency", "emergency_type": "conflict", "severity": "level_2"
    }, headers=auth_header)
    assert resp.status_code == 200


# ── Camp Management ──────────────────────────────────────────────────────────

def test_create_camp(client, auth_header):
    resp = client.post("/api/v1/camps/", json={
        "name": "Camp Alpha", "location": "Aden", "capacity": 5000
    }, headers=auth_header)
    assert resp.status_code == 200


# ── Nutrition ────────────────────────────────────────────────────────────────

def test_nutrition_dashboard(client, auth_header):
    resp = client.get("/api/v1/nutrition/dashboard", headers=auth_header)
    assert resp.status_code == 200
    data = resp.json()
    assert "total_screenings" in data


# ── WASH ─────────────────────────────────────────────────────────────────────

def test_create_water_point(client, auth_header):
    resp = client.post("/api/v1/wash/water-points", json={
        "name": "Well 1", "water_source_type": "borehole"
    }, headers=auth_header)
    assert resp.status_code == 200


# ── Education ────────────────────────────────────────────────────────────────

def test_education_dashboard(client, auth_header):
    resp = client.get("/api/v1/education/dashboard", headers=auth_header)
    assert resp.status_code == 200


# ── Early Warning ────────────────────────────────────────────────────────────

def test_create_early_warning_indicator(client, auth_header):
    resp = client.post("/api/v1/early-warning/indicators", json={
        "name": "Food Price Index", "category": "food_security",
        "threshold_warning": 150, "threshold_critical": 200
    }, headers=auth_header)
    assert resp.status_code == 200


def test_early_warning_alerts(client, auth_header):
    resp = client.get("/api/v1/early-warning/alerts", headers=auth_header)
    assert resp.status_code == 200


# ── Search ───────────────────────────────────────────────────────────────────

def test_unified_search(client, auth_header):
    resp = client.get("/api/v1/search/?q=test", headers=auth_header)
    assert resp.status_code == 200
    assert "results" in resp.json()


# ── Bulk Export ──────────────────────────────────────────────────────────────

def test_bulk_export_beneficiaries(client, auth_header):
    resp = client.get("/api/v1/bulk/export/beneficiaries?format=json", headers=auth_header)
    assert resp.status_code == 200


# ── HR Advanced ──────────────────────────────────────────────────────────────

def test_safety_status(client, auth_header):
    resp = client.get("/api/v1/hr-advanced/safety/status", headers=auth_header)
    assert resp.status_code == 200


# ── Supply Chain ─────────────────────────────────────────────────────────────

def test_expiry_alerts(client, auth_header):
    resp = client.get("/api/v1/supply-chain/expiry-alerts", headers=auth_header)
    assert resp.status_code == 200
