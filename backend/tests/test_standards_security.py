"""Tests for Standards, Security, Bulk Operations, Search — matching actual Pydantic schemas."""
import pytest


@pytest.fixture(scope="module")
def auth_header(client):
    resp = client.post("/api/v1/auth/login", json={"username": "admin", "password": "admin123"})
    token = resp.json().get("access_token", "")
    return {"Authorization": f"Bearer {token}"}


# ── Standards: Sphere ───────────────────────────────────────────────────────

def test_seed_sphere_creates_standards(client, auth_header):
    resp = client.post("/api/v1/standards/sphere/seed", headers=auth_header)
    assert resp.status_code == 200


def test_list_sphere_standards(client, auth_header):
    resp = client.get("/api/v1/standards/sphere", headers=auth_header)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


# ── Standards: Grand Bargain ────────────────────────────────────────────────

def test_create_grand_bargain_commitment(client, auth_header):
    resp = client.post("/api/v1/standards/grand-bargain", json={
        "workstream": "Transparency", "commitment_number": "GB-1",
        "title": "Publish to IATI", "progress": 50
    }, headers=auth_header)
    assert resp.status_code == 200


def test_list_grand_bargain(client, auth_header):
    resp = client.get("/api/v1/standards/grand-bargain", headers=auth_header)
    assert resp.status_code == 200


# ── Standards: Do No Harm ───────────────────────────────────────────────────

def test_create_do_no_harm(client, auth_header):
    resp = client.post("/api/v1/standards/do-no-harm", json={
        "project_id": 1, "dividers": "Conflict between groups",
        "connectors": "Shared resources", "mitigation_actions": "Community dialogue"
    }, headers=auth_header)
    assert resp.status_code == 200


def test_list_do_no_harm(client, auth_header):
    resp = client.get("/api/v1/standards/do-no-harm", headers=auth_header)
    assert resp.status_code == 200


# ── Standards: Gender Marker ────────────────────────────────────────────────

def test_create_gender_marker(client, auth_header):
    resp = client.post("/api/v1/standards/gender-marker", json={
        "project_id": 1, "marker_code": "2a", "overall_score": 3.5
    }, headers=auth_header)
    assert resp.status_code == 200


# ── Standards: Disability Inclusion ─────────────────────────────────────────

def test_create_disability_marker(client, auth_header):
    resp = client.post("/api/v1/standards/disability-inclusion", json={
        "project_id": 1, "seeing": 3, "hearing": 3, "walking": 2,
        "remembering": 3, "self_care": 3, "communicating": 3
    }, headers=auth_header)
    assert resp.status_code == 200


# ── Security: MFA ──────────────────────────────────────────────────────────

def test_mfa_status_structure(client, auth_header):
    resp = client.get("/api/v1/mfa/status", headers=auth_header)
    assert resp.status_code == 200
    data = resp.json()
    assert "mfa_enabled" in data


def test_mfa_setup_returns_secret(client, auth_header):
    resp = client.post("/api/v1/mfa/setup", headers=auth_header)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["secret"]) == 32
    assert len(data["backup_codes"]) == 8


# ── Security: API Keys ─────────────────────────────────────────────────────

def test_create_api_key_with_name(client, auth_header):
    resp = client.post("/api/v1/security/api-keys", json={"name": "CI Pipeline"}, headers=auth_header)
    assert resp.status_code == 200
    data = resp.json()
    assert data["key"].startswith("hiaos_")


def test_api_key_revocation(client, auth_header):
    create = client.post("/api/v1/security/api-keys", json={"name": "Temp Key"}, headers=auth_header)
    assert create.status_code == 200
    key_id = create.json()["id"]
    revoke = client.delete(f"/api/v1/security/api-keys/{key_id}", headers=auth_header)
    assert revoke.status_code == 200


# ── Security: Sessions ─────────────────────────────────────────────────────

def test_list_sessions_returns_list(client, auth_header):
    resp = client.get("/api/v1/security/sessions", headers=auth_header)
    assert resp.status_code == 200


# ── Bulk Operations ─────────────────────────────────────────────────────────

def test_bulk_export_beneficiaries_json(client, auth_header):
    resp = client.get("/api/v1/bulk/export/beneficiaries?format=json", headers=auth_header)
    assert resp.status_code == 200


def test_bulk_export_projects(client, auth_header):
    resp = client.get("/api/v1/bulk/export/projects?format=json", headers=auth_header)
    assert resp.status_code == 200


def test_bulk_export_invalid_entity(client, auth_header):
    resp = client.get("/api/v1/bulk/export/invalid_entity?format=json", headers=auth_header)
    assert resp.status_code == 400


# ── Unified Search ──────────────────────────────────────────────────────────

def test_search_with_query(client, auth_header):
    resp = client.get("/api/v1/search/?q=test", headers=auth_header)
    assert resp.status_code == 200
    data = resp.json()
    assert "results" in data


def test_search_with_entity_filter(client, auth_header):
    resp = client.get("/api/v1/search/?q=test&entity=beneficiaries", headers=auth_header)
    assert resp.status_code == 200


# ── CHS Compliance ──────────────────────────────────────────────────────────

def test_chs_dashboard(client, auth_header):
    resp = client.get("/api/v1/chs/dashboard", headers=auth_header)
    assert resp.status_code == 200


# ── IATI Export ─────────────────────────────────────────────────────────────

def test_iati_activities_export(client, auth_header):
    resp = client.get("/api/v1/iati/activities", headers=auth_header)
    assert resp.status_code == 200
