"""Tests for reports, documents, integrations, notifications, and misc APIs."""
import pytest


def test_report_templates(client, auth_header):
    r = client.get("/api/v1/reports/templates", headers=auth_header)
    assert r.status_code == 200


def test_report_types(client, auth_header):
    r = client.get("/api/v1/reports/types", headers=auth_header)
    assert r.status_code == 200


def test_scheduled_reports_schedules(client, auth_header):
    r = client.get("/api/v1/scheduled-reports/schedules", headers=auth_header)
    assert r.status_code == 200


def test_scheduled_reports_types(client, auth_header):
    r = client.get("/api/v1/scheduled-reports/available-types", headers=auth_header)
    assert r.status_code == 200


def test_documents_list(client, auth_header):
    r = client.get("/api/v1/documents/", headers=auth_header)
    assert r.status_code == 200


def test_notifications_list(client, auth_header):
    r = client.get("/api/v1/notifications/", headers=auth_header)
    assert r.status_code == 200


def test_notifications_count(client, auth_header):
    r = client.get("/api/v1/notifications/count", headers=auth_header)
    assert r.status_code == 200


def test_learning_lessons(client, auth_header):
    r = client.get("/api/v1/learning/lessons", headers=auth_header)
    assert r.status_code == 200


def test_learning_reviews(client, auth_header):
    r = client.get("/api/v1/learning/reviews", headers=auth_header)
    assert r.status_code == 200


def test_hr_employees_list(client, auth_header):
    r = client.get("/api/v1/hr/employees", headers=auth_header)
    assert r.status_code == 200


def test_hr_employees_stats(client, auth_header):
    r = client.get("/api/v1/hr/employees/stats", headers=auth_header)
    assert r.status_code == 200


def test_inventory_warehouses(client, auth_header):
    r = client.get("/api/v1/inventory/warehouses", headers=auth_header)
    assert r.status_code == 200


def test_inventory_items_list(client, auth_header):
    r = client.get("/api/v1/inventory/items", headers=auth_header)
    assert r.status_code == 200


def test_inventory_items_stats(client, auth_header):
    r = client.get("/api/v1/inventory/items/stats", headers=auth_header)
    assert r.status_code == 200


def test_partners_list(client, auth_header):
    r = client.get("/api/v1/partners/", headers=auth_header)
    assert r.status_code == 200


def test_partners_subgrants(client, auth_header):
    r = client.get("/api/v1/partners/subgrants", headers=auth_header)
    assert r.status_code == 200


def test_data_collection_forms(client, auth_header):
    r = client.get("/api/v1/data-collection/forms", headers=auth_header)
    assert r.status_code == 200


def test_remote_monitoring_surveys(client, auth_header):
    r = client.get("/api/v1/remote-monitoring/phone-surveys", headers=auth_header)
    assert r.status_code == 200


def test_remote_monitoring_checks(client, auth_header):
    r = client.get("/api/v1/remote-monitoring/third-party-checks", headers=auth_header)
    assert r.status_code == 200


def test_sector_indicators_list(client, auth_header):
    r = client.get("/api/v1/sector-indicators/", headers=auth_header)
    assert r.status_code == 200


def test_sector_indicators_templates(client, auth_header):
    r = client.get("/api/v1/sector-indicators/templates", headers=auth_header)
    assert r.status_code == 200


def test_executive_dashboard(client, auth_header):
    r = client.get("/api/v1/executive/dashboard", headers=auth_header)
    assert r.status_code == 200
    data = r.json()
    assert "summary" in data


def test_strategic_metrics(client, auth_header):
    r = client.get("/api/v1/strategic/global-metrics", headers=auth_header)
    assert r.status_code == 200


def test_strategic_ocha_export(client, auth_header):
    r = client.get("/api/v1/strategic/ocha-3w-export", headers=auth_header)
    assert r.status_code == 200


def test_organizations_list(client, auth_header):
    r = client.get("/api/v1/organizations/", headers=auth_header)
    assert r.status_code == 200


def test_webhooks_list(client, auth_header):
    r = client.get("/api/v1/webhooks/", headers=auth_header)
    assert r.status_code == 200


def test_offline_sync_status(client, auth_header):
    r = client.get("/api/v1/offline/sync-status", headers=auth_header)
    assert r.status_code == 200


def test_offline_pending_forms(client, auth_header):
    r = client.get("/api/v1/offline/pending-forms", headers=auth_header)
    assert r.status_code == 200
