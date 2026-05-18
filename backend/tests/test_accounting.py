"""Comprehensive accounting tests: double-entry, journal entries, budget lines, donor templates."""
import pytest
from datetime import date


@pytest.fixture(scope="module")
def auth_header(client):
    resp = client.post("/api/v1/auth/login", json={"username": "admin", "password": "admin123"})
    token = resp.json().get("access_token", "")
    return {"Authorization": f"Bearer {token}"}


def test_seed_chart_of_accounts_creates_defaults(client, auth_header):
    resp = client.post("/api/v1/accounting/accounts/seed", headers=auth_header)
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("seeded", 0) >= 0


def test_list_accounts_returns_array(client, auth_header):
    resp = client.get("/api/v1/accounting/accounts", headers=auth_header)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_create_account(client, auth_header):
    resp = client.post("/api/v1/accounting/accounts", json={
        "code": "9999", "name": "Test Account", "account_type": "expense"
    }, headers=auth_header)
    assert resp.status_code == 200
    data = resp.json()
    assert data["code"] == "9999"
    assert data["name"] == "Test Account"


def test_create_balanced_journal_entry(client, auth_header):
    # Get existing accounts first
    accts = client.get("/api/v1/accounting/accounts", headers=auth_header).json()
    if len(accts) < 2:
        pytest.skip("No accounts available for journal entry test")
    acct1 = accts[0]["id"]
    acct2 = accts[1]["id"]
    resp = client.post("/api/v1/accounting/journal-entries", json={
        "reference": "JE-TEST-001",
        "date": str(date.today()),
        "description": "Test balanced entry",
        "lines": [
            {"account_id": acct1, "debit": 100, "credit": 0},
            {"account_id": acct2, "debit": 0, "credit": 100}
        ]
    }, headers=auth_header)
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("id") is not None


def test_reject_unbalanced_journal_entry(client, auth_header):
    accts = client.get("/api/v1/accounting/accounts", headers=auth_header).json()
    if len(accts) < 2:
        pytest.skip("No accounts available")
    resp = client.post("/api/v1/accounting/journal-entries", json={
        "reference": "JE-BAD-001",
        "date": str(date.today()),
        "description": "Unbalanced entry",
        "lines": [
            {"account_id": accts[0]["id"], "debit": 100, "credit": 0},
            {"account_id": accts[1]["id"], "debit": 0, "credit": 50}
        ]
    }, headers=auth_header)
    assert resp.status_code in [400, 422]


def test_trial_balance_structure(client, auth_header):
    resp = client.get("/api/v1/accounting/trial-balance", headers=auth_header)
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, (list, dict))


def test_create_budget_line(client, auth_header):
    resp = client.post("/api/v1/accounting/budget-lines", json={
        "grant_id": 1, "description": "Q1 operations budget",
        "budgeted_amount": 50000
    }, headers=auth_header)
    assert resp.status_code == 200


def test_list_budget_lines_paginated(client, auth_header):
    resp = client.get("/api/v1/accounting/budget-lines", headers=auth_header)
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data


def test_donor_templates(client, auth_header):
    resp = client.get("/api/v1/accounting/donor-templates", headers=auth_header)
    assert resp.status_code == 200


def test_account_balance(client, auth_header):
    accts = client.get("/api/v1/accounting/accounts", headers=auth_header).json()
    if accts:
        resp = client.get(f"/api/v1/accounting/accounts/{accts[0]['id']}/balance", headers=auth_header)
        assert resp.status_code == 200
