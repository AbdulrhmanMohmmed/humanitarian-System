"""Tests for geographic/GIS API endpoints."""
import pytest


def test_list_boundaries(client, auth_header):
    r = client.get("/api/v1/geographic/boundaries", headers=auth_header)
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_create_boundary(client, auth_header):
    r = client.post("/api/v1/geographic/boundaries", headers=auth_header, json={
        "name": "Sana'a",
        "name_ar": "صنعاء",
        "code": "YE-SN",
        "level": "governorate",
        "latitude": 15.3694,
        "longitude": 44.191,
        "population": 3937451,
        "area_sq_km": 13850,
    })
    assert r.status_code == 200
    data = r.json()
    assert data["name"] == "Sana'a"
    assert data["code"] == "YE-SN"


def test_get_boundary(client, auth_header):
    r = client.get("/api/v1/geographic/boundaries/1", headers=auth_header)
    assert r.status_code in [200, 404]


def test_list_boundaries_by_level(client, auth_header):
    r = client.get("/api/v1/geographic/boundaries?level=governorate", headers=auth_header)
    assert r.status_code == 200


def test_list_locations(client, auth_header):
    r = client.get("/api/v1/geographic/locations", headers=auth_header)
    assert r.status_code == 200


def test_create_location(client, auth_header):
    r = client.post("/api/v1/geographic/locations", headers=auth_header, json={
        "name": "مخزن صنعاء الرئيسي",
        "location_type": "warehouse",
        "latitude": 15.3694,
        "longitude": 44.191,
        "address": "شارع الزبيري",
    })
    assert r.status_code == 200
    data = r.json()
    assert data["name"] == "مخزن صنعاء الرئيسي"


def test_nearby_search(client, auth_header):
    r = client.get("/api/v1/geographic/nearby?lat=15.37&lng=44.19&radius_km=50", headers=auth_header)
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_heatmap(client, auth_header):
    r = client.get("/api/v1/geographic/heatmap", headers=auth_header)
    assert r.status_code == 200
    data = r.json()
    assert "type" in data
    assert "data" in data


def test_coverage_analysis(client, auth_header):
    r = client.get("/api/v1/geographic/coverage", headers=auth_header)
    assert r.status_code == 200
    data = r.json()
    assert "coverage" in data
    assert "total_governorates" in data
