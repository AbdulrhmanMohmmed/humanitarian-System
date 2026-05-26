"""Tests for KoBoToolbox integration endpoints."""
import pytest


def test_connection_test(client, auth_header):
    r = client.get("/api/v1/kobo/connection-test", headers=auth_header)
    assert r.status_code == 200
    data = r.json()
    assert "status" in data
    assert "supported_versions" in data
    assert "export_formats" in data


def test_list_assets_no_token(client, auth_header):
    r = client.get("/api/v1/kobo/assets", headers=auth_header)
    assert r.status_code == 200
    data = r.json()
    assert "error" in data or "assets" in data


def test_export_xlsform_not_found(client, auth_header):
    r = client.get("/api/v1/kobo/export-xlsform/99999", headers=auth_header)
    assert r.status_code == 404


def test_import_submissions_not_found(client, auth_header):
    r = client.post("/api/v1/kobo/import-submissions/99999", headers=auth_header, json={"results": []})
    assert r.status_code == 404
