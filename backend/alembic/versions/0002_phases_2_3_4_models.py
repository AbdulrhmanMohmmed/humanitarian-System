"""Add Phase 2-4 models: approvals, organizations, CHS, token_blacklist, webhooks, soft delete

Revision ID: 0002
Revises: 0001
Create Date: 2026-05-07
"""
from alembic import op
import sqlalchemy as sa

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── Approval workflow ──────────────────────────────────────────────────
    op.create_table(
        "approval_rules",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("entity_type", sa.String(50), nullable=False),
        sa.Column("min_amount", sa.Float(), default=0),
        sa.Column("max_amount", sa.Float(), nullable=True),
        sa.Column("required_levels", sa.Integer(), default=1),
        sa.Column("created_at", sa.DateTime()),
    )
    op.create_table(
        "approval_requests",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("entity_type", sa.String(50), nullable=False),
        sa.Column("entity_id", sa.Integer(), nullable=False),
        sa.Column("amount", sa.Float()),
        sa.Column("currency", sa.String(10), default="USD"),
        sa.Column("description", sa.Text()),
        sa.Column("requester_id", sa.Integer(), sa.ForeignKey("users.id")),
        sa.Column("status", sa.String(20), default="pending"),
        sa.Column("required_level", sa.Integer(), default=1),
        sa.Column("current_level", sa.Integer(), default=0),
        sa.Column("created_at", sa.DateTime()),
        sa.Column("updated_at", sa.DateTime()),
    )
    op.create_table(
        "approval_steps",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("request_id", sa.Integer(), sa.ForeignKey("approval_requests.id")),
        sa.Column("level", sa.Integer(), nullable=False),
        sa.Column("approver_id", sa.Integer(), sa.ForeignKey("users.id")),
        sa.Column("status", sa.String(20), default="pending"),
        sa.Column("comment", sa.Text()),
        sa.Column("decided_at", sa.DateTime()),
        sa.Column("created_at", sa.DateTime()),
    )

    # ── Organizations (multi-tenancy) ──────────────────────────────────────
    op.create_table(
        "organizations",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("short_name", sa.String(50)),
        sa.Column("description", sa.Text()),
        sa.Column("country", sa.String(100)),
        sa.Column("sector", sa.String(100)),
        sa.Column("website", sa.String(255)),
        sa.Column("logo_url", sa.String(500)),
        sa.Column("plan", sa.String(50), default="free"),
        sa.Column("created_at", sa.DateTime()),
        sa.Column("updated_at", sa.DateTime()),
    )
    op.create_table(
        "organization_members",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("organization_id", sa.Integer(), sa.ForeignKey("organizations.id")),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id")),
        sa.Column("role", sa.String(50), default="member"),
        sa.Column("joined_at", sa.DateTime()),
    )

    # ── CHS Compliance ─────────────────────────────────────────────────────
    op.create_table(
        "chs_commitments",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("number", sa.Integer(), unique=True),
        sa.Column("title_en", sa.String(500)),
        sa.Column("title_ar", sa.String(500)),
        sa.Column("description", sa.Text()),
        sa.Column("created_at", sa.DateTime()),
    )
    op.create_table(
        "chs_assessment_items",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("commitment_id", sa.Integer(), sa.ForeignKey("chs_commitments.id")),
        sa.Column("assessment_period", sa.String(50)),
        sa.Column("score", sa.Float(), default=0),
        sa.Column("max_score", sa.Float(), default=5),
        sa.Column("evidence", sa.Text()),
        sa.Column("notes", sa.Text()),
        sa.Column("assessor_id", sa.Integer(), sa.ForeignKey("users.id")),
        sa.Column("created_at", sa.DateTime()),
    )

    # ── Token Blacklist & Login Attempts ───────────────────────────────────
    op.create_table(
        "token_blacklist",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("jti", sa.String(255), unique=True, index=True),
        sa.Column("token_type", sa.String(20)),
        sa.Column("user_id", sa.Integer()),
        sa.Column("revoked_at", sa.DateTime()),
        sa.Column("expires_at", sa.DateTime()),
    )
    op.create_table(
        "login_attempts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("username", sa.String(255), index=True),
        sa.Column("ip_address", sa.String(45)),
        sa.Column("success", sa.Boolean(), default=False),
        sa.Column("attempted_at", sa.DateTime()),
    )

    # ── Webhooks ───────────────────────────────────────────────────────────
    op.create_table(
        "webhooks",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("url", sa.String(1000), nullable=False),
        sa.Column("type", sa.String(50), default="custom"),
        sa.Column("secret", sa.String(255)),
        sa.Column("events", sa.Text(), default="*"),
        sa.Column("is_active", sa.Boolean(), default=True),
        sa.Column("created_by", sa.Integer()),
        sa.Column("created_at", sa.DateTime()),
        sa.Column("updated_at", sa.DateTime()),
    )
    op.create_table(
        "webhook_deliveries",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("webhook_id", sa.Integer(), sa.ForeignKey("webhooks.id")),
        sa.Column("event", sa.String(255)),
        sa.Column("payload", sa.Text()),
        sa.Column("response_status", sa.Integer()),
        sa.Column("response_body", sa.Text()),
        sa.Column("success", sa.Boolean(), default=False),
        sa.Column("created_at", sa.DateTime()),
    )

    # ── Soft delete columns on existing tables ─────────────────────────────
    for table in ("beneficiaries", "projects", "grants", "transactions"):
        op.add_column(table, sa.Column("deleted_at", sa.DateTime(), nullable=True))
        op.add_column(table, sa.Column("deleted_by", sa.Integer(), nullable=True))

    # ── Composite indexes for performance ──────────────────────────────────
    op.create_index("ix_beneficiaries_status_gov", "beneficiaries", ["status", "governorate"])
    op.create_index("ix_projects_status_sector", "projects", ["status", "sector"])
    op.create_index("ix_transactions_grant_date", "transactions", ["grant_id", "transaction_date"])
    op.create_index("ix_grants_status_project", "grants", ["status", "project_id"])


def downgrade() -> None:
    op.drop_index("ix_grants_status_project")
    op.drop_index("ix_transactions_grant_date")
    op.drop_index("ix_projects_status_sector")
    op.drop_index("ix_beneficiaries_status_gov")

    for table in ("beneficiaries", "projects", "grants", "transactions"):
        op.drop_column(table, "deleted_by")
        op.drop_column(table, "deleted_at")

    op.drop_table("webhook_deliveries")
    op.drop_table("webhooks")
    op.drop_table("login_attempts")
    op.drop_table("token_blacklist")
    op.drop_table("chs_assessment_items")
    op.drop_table("chs_commitments")
    op.drop_table("organization_members")
    op.drop_table("organizations")
    op.drop_table("approval_steps")
    op.drop_table("approval_requests")
    op.drop_table("approval_rules")
