"""Tests for authentication, authorization, and security."""
import pytest


def test_login_success(client, auth_header):
    r = client.post("/api/v1/auth/login", json={
        "username": "admin",
        "password": "admin123",
    })
    assert r.status_code == 200
    data = r.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password(client):
    r = client.post("/api/v1/auth/login", json={
        "username": "admin",
        "password": "wrongpass",
    })
    assert r.status_code == 401


def test_login_nonexistent_user(client):
    r = client.post("/api/v1/auth/login", json={
        "username": "ghost_user_xyz",
        "password": "any",
    })
    assert r.status_code in [401, 404]


def test_register_user(client, auth_header):
    r = client.post("/api/v1/auth/register", json={
        "username": "newuser_test_999",
        "password": "SecurePass1!",
        "full_name": "مستخدم جديد",
        "role": "viewer",
    })
    assert r.status_code in [200, 201, 409, 422]


def test_protected_endpoint_without_token(client):
    r = client.get("/api/v1/beneficiaries/")
    assert r.status_code == 401


def test_protected_endpoint_with_token(client, auth_header):
    r = client.get("/api/v1/beneficiaries/", headers=auth_header)
    assert r.status_code == 200


def test_security_headers():
    from fastapi.testclient import TestClient
    from main import app
    with TestClient(app) as c:
        r = c.get("/health")
        headers_lower = {k.lower(): v for k, v in r.headers.items()}
        assert "x-content-type-options" in headers_lower


def test_invalid_token(client):
    r = client.get("/api/v1/beneficiaries/", headers={"Authorization": "Bearer invalid_token"})
    assert r.status_code == 401
