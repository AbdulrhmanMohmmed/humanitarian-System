"""Tests for PyJWT and bcrypt integration."""
import pytest
import jwt


def test_login_returns_valid_jwt(client):
    r = client.post("/api/v1/auth/login", json={"username": "admin", "password": "admin123"})
    assert r.status_code == 200
    token = r.json()["access_token"]
    from app.config import settings
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    assert payload["sub"] == "admin"
    assert payload["type"] == "access"
    assert "exp" in payload


def test_refresh_token_has_correct_type(client):
    r = client.post("/api/v1/auth/login", json={"username": "admin", "password": "admin123"})
    assert r.status_code == 200
    refresh = r.json()["refresh_token"]
    from app.config import settings
    payload = jwt.decode(refresh, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    assert payload["type"] == "refresh"


def test_bcrypt_password_hash():
    from app.auth import get_password_hash, verify_password
    hashed = get_password_hash("TestPassword123")
    assert hashed.startswith("$2")
    assert verify_password("TestPassword123", hashed)
    assert not verify_password("WrongPassword", hashed)


def test_password_validation():
    from app.auth import validate_password_strength
    ok, msg = validate_password_strength("ValidPass1")
    assert ok
    ok, msg = validate_password_strength("short")
    assert not ok
    ok, msg = validate_password_strength("nouppercase1")
    assert not ok
    ok, msg = validate_password_strength("NOLOWERCASE1")
    assert not ok
    ok, msg = validate_password_strength("NoDigitsHere")
    assert not ok


def test_token_decode_invalid():
    from app.auth import decode_token
    from fastapi import HTTPException
    with pytest.raises(HTTPException):
        decode_token("invalid.token.here")


def test_me_endpoint(client, auth_header):
    r = client.get("/api/v1/auth/me", headers=auth_header)
    assert r.status_code == 200
    data = r.json()
    assert data["username"] == "admin"


def test_change_password(client, auth_header):
    r = client.post("/api/v1/auth/change-password", headers=auth_header, json={
        "current_password": "admin123",
        "new_password": "NewAdmin123",
    })
    if r.status_code == 200:
        r2 = client.post("/api/v1/auth/change-password", headers=auth_header, json={
            "current_password": "NewAdmin123",
            "new_password": "admin123",
        })
