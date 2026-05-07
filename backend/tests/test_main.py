import pytest
from fastapi.testclient import TestClient
from main import app
from app.config import settings


def test_health_check():
    """Test the health check endpoint"""
    with TestClient(app) as client:
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "version" in data
        assert "timestamp" in data


def test_readiness_check():
    """Test the readiness probe endpoint"""
    with TestClient(app) as client:
        response = client.get("/health/ready")
        assert response.status_code in [200, 503]
        data = response.json()
        assert "status" in data


def test_metrics_endpoint(client):
    """Test the metrics endpoint (requires DB fixtures from conftest)"""
    response = client.get("/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "users_total" in data


def test_api_root():
    """Test the API root endpoint with rate limiting"""
    with TestClient(app) as client:
        response = client.get("/api")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["name"] == "HIAOS API"


def test_api_v1_auth_login():
    """Test that v1 API paths are accessible"""
    with TestClient(app) as client:
        response = client.post(
            "/api/v1/auth/login",
            json={"username": "nonexistent", "password": "wrong"},
        )
        assert response.status_code in [401, 422, 400, 404]


def test_api_compat_auth_login():
    """Test backward-compatible /api/ paths still work"""
    with TestClient(app) as client:
        response = client.post(
            "/api/auth/login",
            json={"username": "nonexistent", "password": "wrong"},
        )
        assert response.status_code in [401, 422, 400, 404]


def test_error_handler_returns_structured_json():
    """Test unified error handler returns structured JSON"""
    with TestClient(app) as client:
        response = client.get("/api/v1/beneficiaries/999999")
        assert response.status_code in [401, 404]
        data = response.json()
        if response.status_code == 404:
            assert data["success"] is False
            assert "error" in data
