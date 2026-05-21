"""Tests for MEAL, monitoring, field visits, logframe, and analytics."""
import pytest


def test_list_monitoring_indicators(client, auth_header):
    r = client.get("/api/v1/monitoring/indicators", headers=auth_header)
    assert r.status_code == 200


def test_create_monitoring_indicator(client, auth_header):
    r = client.post("/api/v1/monitoring/indicators", headers=auth_header, json={
        "name": "عدد المستفيدين من المياه النظيفة",
        "type": "output",
        "target_value": 5000,
        "project_id": 1,
        "unit": "مستفيد",
    })
    assert r.status_code in [200, 201, 422]


def test_monitoring_measurements(client, auth_header):
    r = client.get("/api/v1/monitoring/measurements", headers=auth_header)
    assert r.status_code == 200


def test_monitoring_surveys(client, auth_header):
    r = client.get("/api/v1/monitoring/surveys", headers=auth_header)
    assert r.status_code == 200


def test_list_field_visits(client, auth_header):
    r = client.get("/api/v1/field-visits/", headers=auth_header)
    assert r.status_code == 200


def test_field_visit_checklists(client, auth_header):
    r = client.get("/api/v1/field-visits/checklists", headers=auth_header)
    assert r.status_code == 200


def test_logframe_all(client, auth_header):
    r = client.get("/api/v1/logframe/all", headers=auth_header)
    assert r.status_code == 200


def test_analytics_overview(client, auth_header):
    r = client.get("/api/v1/analytics/overview", headers=auth_header)
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, dict)


def test_analytics_geographic(client, auth_header):
    r = client.get("/api/v1/analytics/geographic", headers=auth_header)
    assert r.status_code == 200


def test_analytics_trends(client, auth_header):
    r = client.get("/api/v1/analytics/trends", headers=auth_header)
    assert r.status_code == 200


def test_analytics_5w(client, auth_header):
    r = client.get("/api/v1/analytics/5w", headers=auth_header)
    assert r.status_code == 200


def test_analytics_sample_calculator(client, auth_header):
    r = client.get("/api/v1/analytics/sample-calculator", headers=auth_header)
    assert r.status_code == 200


def test_meal_plan_list(client, auth_header):
    r = client.get("/api/v1/meal-plan/", headers=auth_header)
    assert r.status_code == 200


def test_iptt_list(client, auth_header):
    r = client.get("/api/v1/iptt/", headers=auth_header)
    assert r.status_code == 200


def test_iptt_alerts(client, auth_header):
    r = client.get("/api/v1/iptt/alerts", headers=auth_header)
    assert r.status_code == 200


def test_recommendations_list(client, auth_header):
    r = client.get("/api/v1/recommendations/", headers=auth_header)
    assert r.status_code == 200


def test_recommendations_dashboard(client, auth_header):
    r = client.get("/api/v1/recommendations/dashboard", headers=auth_header)
    assert r.status_code == 200


def test_assessment_tools_templates(client, auth_header):
    r = client.get("/api/v1/assessment-tools/templates", headers=auth_header)
    assert r.status_code == 200


def test_needs_assessment_list(client, auth_header):
    r = client.get("/api/v1/needs-assessment/", headers=auth_header)
    assert r.status_code == 200


def test_needs_assessment_templates(client, auth_header):
    r = client.get("/api/v1/needs-assessment/templates", headers=auth_header)
    assert r.status_code == 200
