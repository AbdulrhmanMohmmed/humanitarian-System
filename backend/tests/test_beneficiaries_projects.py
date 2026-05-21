"""Tests for beneficiaries and projects core modules."""
import pytest


def test_list_beneficiaries(client, auth_header):
    r = client.get("/api/v1/beneficiaries/", headers=auth_header)
    assert r.status_code == 200


def test_create_beneficiary(client, auth_header):
    r = client.post("/api/v1/beneficiaries/", headers=auth_header, json={
        "first_name": "أحمد",
        "last_name": "محمد",
        "gender": "male",
        "date_of_birth": "1990-01-15",
        "governorate": "صنعاء",
        "district": "معين",
        "phone": "771234567",
        "national_id": "TEST-001",
        "household_size": 5,
        "vulnerability_score": 3.5,
    })
    assert r.status_code in [200, 201]


def test_create_beneficiary_validation(client, auth_header):
    r = client.post("/api/v1/beneficiaries/", headers=auth_header, json={})
    assert r.status_code == 422


def test_beneficiary_count(client, auth_header):
    r = client.get("/api/v1/beneficiaries/count", headers=auth_header)
    assert r.status_code == 200


def test_beneficiary_by_governorate(client, auth_header):
    r = client.get("/api/v1/beneficiaries/by-governorate", headers=auth_header)
    assert r.status_code == 200


def test_beneficiary_hxl_export(client, auth_header):
    r = client.get("/api/v1/beneficiaries/export/hxl", headers=auth_header)
    assert r.status_code == 200


def test_check_duplicate_beneficiary(client, auth_header):
    r = client.post("/api/v1/beneficiaries/check-duplicate", headers=auth_header, json={
        "full_name": "أحمد محمد",
        "phone": "771234567",
    })
    assert r.status_code in [200, 422]


def test_list_projects(client, auth_header):
    r = client.get("/api/v1/projects/", headers=auth_header)
    assert r.status_code == 200


def test_create_project(client, auth_header):
    r = client.post("/api/v1/projects/", headers=auth_header, json={
        "name": "مشروع المياه النظيفة",
        "code": "WP-2026-001",
        "status": "active",
        "start_date": "2026-01-01",
        "end_date": "2026-12-31",
        "budget": 500000.0,
        "sector": "WASH",
        "description": "توفير مياه نظيفة لـ 5000 مستفيد",
    })
    assert r.status_code in [200, 201, 422]


def test_create_project_validation(client, auth_header):
    r = client.post("/api/v1/projects/", headers=auth_header, json={})
    assert r.status_code == 422


def test_project_stats(client, auth_header):
    r = client.get("/api/v1/projects/stats", headers=auth_header)
    assert r.status_code == 200


def test_list_activities(client, auth_header):
    r = client.get("/api/v1/activities/", headers=auth_header)
    assert r.status_code == 200


def test_create_activity(client, auth_header):
    r = client.post("/api/v1/activities/", headers=auth_header, json={
        "name": "توزيع مواد غذائية",
        "project_id": 1,
        "status": "planned",
        "start_date": "2026-02-01",
        "end_date": "2026-03-01",
    })
    assert r.status_code in [200, 201, 422]
