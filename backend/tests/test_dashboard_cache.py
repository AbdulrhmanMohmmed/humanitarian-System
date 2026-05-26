"""Tests for dashboard with caching."""
import pytest


def test_dashboard_stats(client, auth_header):
    r = client.get("/api/v1/dashboard/stats", headers=auth_header)
    assert r.status_code == 200
    data = r.json()
    assert "total_beneficiaries" in data
    assert "active_projects" in data
    assert "total_employees" in data
    assert "total_grants" in data
    assert "total_spent" in data


def test_dashboard_stats_cached(client, auth_header):
    r1 = client.get("/api/v1/dashboard/stats", headers=auth_header)
    r2 = client.get("/api/v1/dashboard/stats", headers=auth_header)
    assert r1.status_code == 200
    assert r2.status_code == 200
    assert r1.json() == r2.json()


def test_dashboard_recent_activities(client, auth_header):
    r = client.get("/api/v1/dashboard/recent-activities", headers=auth_header)
    assert r.status_code == 200
    data = r.json()
    assert "recent_beneficiaries" in data
    assert "recent_projects" in data
    assert "recent_transactions" in data


def test_analytics_overview(client, auth_header):
    r = client.get("/api/v1/analytics/overview", headers=auth_header)
    assert r.status_code == 200
    data = r.json()
    assert "total_projects" in data
    assert "budget_utilization" in data


def test_analytics_overview_cached(client, auth_header):
    r1 = client.get("/api/v1/analytics/overview", headers=auth_header)
    r2 = client.get("/api/v1/analytics/overview", headers=auth_header)
    assert r1.status_code == 200
    assert r2.status_code == 200
    assert r1.json() == r2.json()
