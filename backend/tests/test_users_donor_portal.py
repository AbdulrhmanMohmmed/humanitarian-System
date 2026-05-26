"""Tests for User Management and Donor Portal APIs."""
import pytest


class TestUserManagement:
    def test_list_users(self, client, auth_header):
        r = client.get("/api/v1/users/", headers=auth_header)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) > 0

    def test_user_stats(self, client, auth_header):
        r = client.get("/api/v1/users/stats", headers=auth_header)
        assert r.status_code == 200
        data = r.json()
        assert "total" in data
        assert "active" in data
        assert "by_role" in data

    def test_create_user(self, client, auth_header):
        r = client.post("/api/v1/users/", headers=auth_header, json={
            "username": "testuser_new",
            "email": "testuser_new@test.com",
            "full_name": "Test User New",
            "password": "TestPass123",
            "role": "viewer",
        })
        assert r.status_code in [200, 201, 400]

    def test_search_users(self, client, auth_header):
        r = client.get("/api/v1/users/", params={"search": "admin"}, headers=auth_header)
        assert r.status_code == 200


class TestDonorPortal:
    def test_donor_dashboard(self, client, auth_header):
        r = client.get("/api/v1/donor-portal/dashboard", headers=auth_header)
        assert r.status_code == 200

    def test_list_proposals(self, client, auth_header):
        r = client.get("/api/v1/donor-portal/proposals", headers=auth_header)
        assert r.status_code == 200

    def test_create_proposal(self, client, auth_header):
        r = client.post("/api/v1/donor-portal/proposals", headers=auth_header, json={
            "title": "Test Proposal",
            "donor_name": "Test Donor",
            "requested_amount": 50000,
            "currency": "USD",
            "sector": "health",
            "description": "Test proposal for health sector",
        })
        assert r.status_code in [200, 201]

    def test_list_funding_opportunities(self, client, auth_header):
        r = client.get("/api/v1/donor-portal/funding-opportunities", headers=auth_header)
        assert r.status_code == 200

    def test_list_installments(self, client, auth_header):
        r = client.get("/api/v1/donor-portal/installments", headers=auth_header)
        assert r.status_code == 200

    def test_list_visits(self, client, auth_header):
        r = client.get("/api/v1/donor-portal/visits", headers=auth_header)
        assert r.status_code == 200

    def test_list_communications(self, client, auth_header):
        r = client.get("/api/v1/donor-portal/communications", headers=auth_header)
        assert r.status_code == 200
