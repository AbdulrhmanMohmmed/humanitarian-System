"""Tests for unified search with pagination."""
import pytest


def test_search_returns_pagination(client, auth_header):
    r = client.get("/api/v1/search/", params={"q": "test"}, headers=auth_header)
    assert r.status_code == 200
    data = r.json()
    assert "query" in data
    assert "total" in data
    assert "page" in data
    assert "limit" in data
    assert "results" in data
    assert data["page"] == 1
    assert data["limit"] == 20


def test_search_custom_page(client, auth_header):
    r = client.get("/api/v1/search/", params={"q": "test", "page": 2, "limit": 5}, headers=auth_header)
    assert r.status_code == 200
    data = r.json()
    assert data["page"] == 2
    assert data["limit"] == 5


def test_search_invalid_query_too_short(client, auth_header):
    r = client.get("/api/v1/search/", params={"q": "a"}, headers=auth_header)
    assert r.status_code == 422


def test_search_entity_filter(client, auth_header):
    r = client.get("/api/v1/search/", params={"q": "test", "entity": "beneficiaries"}, headers=auth_header)
    assert r.status_code == 200
    data = r.json()
    for result in data["results"]:
        assert result["type"] == "beneficiary"


def test_search_all_entities(client, auth_header):
    r = client.get("/api/v1/search/", params={"q": "test", "entity": "all"}, headers=auth_header)
    assert r.status_code == 200
