"""Tests for HR Advanced and Supply Chain modules — matching actual Pydantic schemas."""
import pytest
from datetime import date


@pytest.fixture(scope="module")
def auth_header(client):
    resp = client.post("/api/v1/auth/login", json={"username": "admin", "password": "admin123"})
    token = resp.json().get("access_token", "")
    return {"Authorization": f"Bearer {token}"}


# ── HR Advanced: Payroll ─────────────────────────────────────────────────────

def test_create_payroll(client, auth_header):
    resp = client.post("/api/v1/hr-advanced/payroll", json={
        "employee_id": 1, "period_start": "2025-01-01", "period_end": "2025-01-31",
        "basic_salary": 3000, "allowances": 500, "deductions": 200
    }, headers=auth_header)
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("net_salary") is not None


def test_list_payroll_paginated(client, auth_header):
    resp = client.get("/api/v1/hr-advanced/payroll", headers=auth_header)
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data


# ── HR Advanced: Performance Reviews ────────────────────────────────────────

def test_create_performance_review(client, auth_header):
    resp = client.post("/api/v1/hr-advanced/performance-reviews", json={
        "employee_id": 1, "period": "2025-H1",
        "overall_score": 4.5, "comments": "Excellent performance"
    }, headers=auth_header)
    assert resp.status_code == 200


def test_list_reviews_paginated(client, auth_header):
    resp = client.get("/api/v1/hr-advanced/performance-reviews", headers=auth_header)
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data


# ── HR Advanced: Training ───────────────────────────────────────────────────

def test_create_training(client, auth_header):
    resp = client.post("/api/v1/hr-advanced/trainings", json={
        "title": "Security Awareness", "training_type": "safety"
    }, headers=auth_header)
    assert resp.status_code == 200


def test_list_trainings_paginated(client, auth_header):
    resp = client.get("/api/v1/hr-advanced/trainings", headers=auth_header)
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data


# ── HR Advanced: Timesheets ─────────────────────────────────────────────────

def test_create_timesheet(client, auth_header):
    resp = client.post("/api/v1/hr-advanced/timesheets", json={
        "employee_id": 1, "date": "2025-06-01", "hours": 8
    }, headers=auth_header)
    assert resp.status_code == 200


def test_list_timesheets_paginated(client, auth_header):
    resp = client.get("/api/v1/hr-advanced/timesheets", headers=auth_header)
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data


# ── HR Advanced: Safety Check-ins ───────────────────────────────────────────

def test_create_safety_checkin(client, auth_header):
    resp = client.post("/api/v1/hr-advanced/safety/check-in", json={
        "employee_id": 1, "location": "Aden", "is_safe": True
    }, headers=auth_header)
    assert resp.status_code == 200


def test_safety_status(client, auth_header):
    resp = client.get("/api/v1/hr-advanced/safety/status", headers=auth_header)
    assert resp.status_code == 200
    data = resp.json()
    assert "total_staff" in data


# ── HR Advanced: Contracts ──────────────────────────────────────────────────

def test_create_contract(client, auth_header):
    resp = client.post("/api/v1/hr-advanced/contracts", json={
        "employee_id": 1, "contract_type": "full_time",
        "start_date": "2025-01-01"
    }, headers=auth_header)
    assert resp.status_code == 200


def test_list_contracts_paginated(client, auth_header):
    resp = client.get("/api/v1/hr-advanced/contracts", headers=auth_header)
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data


# ── Supply Chain: Stock Movements ───────────────────────────────────────────

def test_create_stock_movement(client, auth_header):
    resp = client.post("/api/v1/supply-chain/stock-movements", json={
        "item_id": 1, "warehouse_id": 1, "movement_type": "in", "quantity": 500
    }, headers=auth_header)
    assert resp.status_code == 200


def test_list_stock_movements_paginated(client, auth_header):
    resp = client.get("/api/v1/supply-chain/stock-movements", headers=auth_header)
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data


# ── Supply Chain: Batches ───────────────────────────────────────────────────

def test_create_batch(client, auth_header):
    resp = client.post("/api/v1/supply-chain/batches", json={
        "item_id": 1, "batch_number": "BT-2025-001",
        "quantity": 1000, "expiry_date": "2026-01-15"
    }, headers=auth_header)
    assert resp.status_code == 200


def test_list_batches_paginated(client, auth_header):
    resp = client.get("/api/v1/supply-chain/batches", headers=auth_header)
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data


# ── Supply Chain: Deliveries ────────────────────────────────────────────────

def test_create_delivery(client, auth_header):
    resp = client.post("/api/v1/supply-chain/last-mile", json={
        "distribution_id": 1, "destination": "Camp Alpha"
    }, headers=auth_header)
    assert resp.status_code == 200


def test_expiry_alerts_returns_list(client, auth_header):
    resp = client.get("/api/v1/supply-chain/expiry-alerts", headers=auth_header)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


# ── Supply Chain: Barcodes ──────────────────────────────────────────────────

def test_create_barcode(client, auth_header):
    resp = client.post("/api/v1/supply-chain/barcodes", json={
        "barcode": "QR-TEST-001", "barcode_type": "qr"
    }, headers=auth_header)
    assert resp.status_code == 200
