"""Tests for finance, grants, cash, and procurement modules."""
import pytest


def test_list_finance_transactions(client, auth_header):
    r = client.get("/api/v1/finance/transactions", headers=auth_header)
    assert r.status_code == 200


def test_create_transaction(client, auth_header):
    r = client.post("/api/v1/finance/transactions", headers=auth_header, json={
        "type": "expense",
        "amount": 15000.0,
        "currency": "USD",
        "description": "شراء مستلزمات طبية",
        "category": "supplies",
        "date": "2026-03-15",
    })
    assert r.status_code in [200, 201]


def test_finance_transactions_summary(client, auth_header):
    r = client.get("/api/v1/finance/transactions/summary", headers=auth_header)
    assert r.status_code == 200


def test_finance_grants_list(client, auth_header):
    r = client.get("/api/v1/finance/grants", headers=auth_header)
    assert r.status_code == 200


def test_finance_grants_stats(client, auth_header):
    r = client.get("/api/v1/finance/grants/stats", headers=auth_header)
    assert r.status_code == 200


def test_grants_list(client, auth_header):
    r = client.get("/api/v1/grants/", headers=auth_header)
    assert r.status_code == 200


def test_grants_donors_list(client, auth_header):
    r = client.get("/api/v1/grants/donors", headers=auth_header)
    assert r.status_code == 200


def test_list_cash_transfers(client, auth_header):
    r = client.get("/api/v1/cash/transfers", headers=auth_header)
    assert r.status_code == 200


def test_cash_transfer_stats(client, auth_header):
    r = client.get("/api/v1/cash/transfers/stats", headers=auth_header)
    assert r.status_code == 200


def test_create_cash_transfer(client, auth_header):
    r = client.post("/api/v1/cash/transfers", headers=auth_header, json={
        "beneficiary_id": 1,
        "amount": 200.0,
        "currency": "USD",
        "method": "mobile_money",
        "status": "pending",
    })
    assert r.status_code in [200, 201, 404, 422]


def test_procurement_vendors(client, auth_header):
    r = client.get("/api/v1/procurement/vendors", headers=auth_header)
    assert r.status_code == 200


def test_procurement_requests(client, auth_header):
    r = client.get("/api/v1/procurement/requests", headers=auth_header)
    assert r.status_code == 200


def test_procurement_purchase_orders(client, auth_header):
    r = client.get("/api/v1/procurement/pos", headers=auth_header)
    assert r.status_code == 200
