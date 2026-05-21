"""Tests for accountability, compliance, safeguarding, feedback, and audit."""
import pytest


def test_accountability_complaints_list(client, auth_header):
    r = client.get("/api/v1/accountability/complaints", headers=auth_header)
    assert r.status_code == 200


def test_create_complaint(client, auth_header):
    r = client.post("/api/v1/accountability/complaints", headers=auth_header, json={
        "channel": "other",
        "category": "other",
        "subject": "تأخر في التوزيع",
        "description": "تأخر في توزيع المساعدات",
        "priority": "medium",
        "is_anonymous": True,
    })
    assert r.status_code in [200, 201]


def test_accountability_stats(client, auth_header):
    r = client.get("/api/v1/accountability/stats", headers=auth_header)
    assert r.status_code == 200


def test_accountability_detailed_stats(client, auth_header):
    r = client.get("/api/v1/accountability/stats/detailed", headers=auth_header)
    assert r.status_code == 200


def test_compliance_checks_list(client, auth_header):
    r = client.get("/api/v1/compliance/checks", headers=auth_header)
    assert r.status_code == 200


def test_compliance_dashboard(client, auth_header):
    r = client.get("/api/v1/compliance/dashboard", headers=auth_header)
    assert r.status_code == 200


def test_safeguarding_reports_list(client, auth_header):
    r = client.get("/api/v1/safeguarding/reports", headers=auth_header)
    assert r.status_code == 200


def test_create_safeguarding_report(client, auth_header):
    r = client.post("/api/v1/safeguarding/reports", headers=auth_header, json={
        "incident_type": "concern",
        "description": "تقرير عن مخاوف حماية",
        "location": "صنعاء",
    })
    assert r.status_code in [200, 201]


def test_safeguarding_chs_list(client, auth_header):
    r = client.get("/api/v1/safeguarding/chs", headers=auth_header)
    assert r.status_code == 200


def test_feedback_actions_list(client, auth_header):
    r = client.get("/api/v1/feedback-loop/actions", headers=auth_header)
    assert r.status_code == 200


def test_feedback_community_sessions(client, auth_header):
    r = client.get("/api/v1/feedback-loop/community-sessions", headers=auth_header)
    assert r.status_code == 200


def test_audit_trail_list(client, auth_header):
    r = client.get("/api/v1/audit/", headers=auth_header)
    assert r.status_code == 200


def test_risk_management_list(client, auth_header):
    r = client.get("/api/v1/risks/", headers=auth_header)
    assert r.status_code == 200


def test_create_risk(client, auth_header):
    r = client.post("/api/v1/risks/", headers=auth_header, json={
        "title": "مخاطر أمنية في المنطقة الجنوبية",
        "category": "security",
        "likelihood": "high",
        "impact": "major",
        "mitigation_plan": "تعزيز الإجراءات الأمنية",
    })
    assert r.status_code in [200, 201]


def test_risk_matrix(client, auth_header):
    r = client.get("/api/v1/risks/matrix", headers=auth_header)
    assert r.status_code == 200
