"""Tests for rate limiting configuration (verify it's disabled in tests)."""
import pytest


def test_login_not_rate_limited_in_tests(client):
    for _ in range(15):
        r = client.post("/api/v1/auth/login", json={"username": "admin", "password": "admin123"})
        assert r.status_code in [200, 401, 422]
        assert r.status_code != 429


def test_search_not_rate_limited_in_tests(client, auth_header):
    for _ in range(35):
        r = client.get("/api/v1/search/", params={"q": "test"}, headers=auth_header)
        assert r.status_code == 200
