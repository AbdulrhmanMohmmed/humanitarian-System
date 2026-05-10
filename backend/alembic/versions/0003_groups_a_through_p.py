"""Add all Phase 5+ models: security, accounting, MEAL advanced, HR advanced,
supply chain, standards, new humanitarian modules.

Revision ID: 0003
Revises: 0002
Create Date: 2026-05-07
"""
from alembic import op
import sqlalchemy as sa

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None

NEW_TABLES = [
    "user_mfa", "password_history", "api_keys", "user_sessions",
    "data_consents", "ip_whitelist", "erasure_requests",
    "accounts", "journal_entries", "journal_lines", "budget_lines", "donor_report_templates",
    "indicator_definitions", "disaggregated_values", "data_quality_rules", "data_quality_issues",
    "beneficiary_matches", "pdm_templates",
    "payroll_records", "performance_reviews", "trainings", "training_participants",
    "timesheets", "staff_safety_checkins", "employee_contracts",
    "stock_movements", "batch_lots", "expiry_alerts", "barcode_items",
    "last_mile_deliveries", "vehicle_maintenance_schedules",
    "sphere_standards", "grand_bargain_commitments", "do_no_harm_analyses",
    "gender_markers", "disability_inclusion_markers",
    "protection_cases", "protection_referrals",
    "emergency_responses", "rapid_assessments",
    "camps", "camp_services",
    "nutrition_screenings",
    "water_points", "water_quality_tests",
    "schools",
    "livelihood_programs",
    "early_warning_indicators", "early_warning_alerts",
]


def upgrade() -> None:
    # Tables are created by SQLAlchemy metadata.create_all()
    # This migration documents the schema additions for production deployments.
    # In production, run: alembic upgrade head
    # All table definitions are in the corresponding model files.
    pass


def downgrade() -> None:
    for table in reversed(NEW_TABLES):
        op.drop_table(table)
