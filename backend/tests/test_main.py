import pytest
from fastapi.testclient import TestClient
from main import app
from app.config import settings

client = TestClient(app)

def test_health_check():
    """Test the health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data
    assert "timestamp" in data

def test_readiness_check():
    """Test the readiness probe endpoint"""
    response = client.get("/health/ready")
    assert response.status_code in [200, 503]
    data = response.json()
    assert "status" in data

def test_metrics_endpoint():
    """Test the metrics endpoint"""
    response = client.get("/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "users_total" in data

def test_api_root():
    """Test the API root endpoint with rate limiting"""
    response = client.get("/api")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["name"] == "HIAOS API"
