"""Add donor portal and data center tables

Revision ID: 0004
Revises: 0003
"""
from alembic import op
import sqlalchemy as sa

revision = '0004'
down_revision = '0003'
branch_labels = None
depends_on = None


def upgrade():
    # Donor Portal tables
    op.create_table('proposals',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('title', sa.String(500), nullable=False),
        sa.Column('code', sa.String(50), unique=True),
        sa.Column('status', sa.String(50), default='draft'),
        sa.Column('donor_id', sa.Integer(), sa.ForeignKey('donors.id'), nullable=True),
        sa.Column('project_id', sa.Integer(), sa.ForeignKey('projects.id'), nullable=True),
        sa.Column('sector', sa.String(100)),
        sa.Column('budget_requested', sa.Float(), default=0),
        sa.Column('duration_months', sa.Integer(), default=12),
        sa.Column('target_beneficiaries', sa.Integer(), default=0),
        sa.Column('objectives', sa.JSON()),
        sa.Column('outcomes', sa.JSON()),
        sa.Column('activities', sa.JSON()),
        sa.Column('indicators', sa.JSON()),
        sa.Column('logframe', sa.JSON()),
        sa.Column('budget_breakdown', sa.JSON()),
        sa.Column('submitted_at', sa.DateTime()),
        sa.Column('approved_at', sa.DateTime()),
        sa.Column('created_at', sa.DateTime()),
        sa.Column('updated_at', sa.DateTime()),
    )
    op.create_table('funding_opportunities',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('title', sa.String(500), nullable=False),
        sa.Column('donor_name', sa.String(300)),
        sa.Column('sector', sa.String(100)),
        sa.Column('amount', sa.Float(), default=0),
        sa.Column('currency', sa.String(10), default='USD'),
        sa.Column('deadline', sa.DateTime()),
        sa.Column('status', sa.String(50), default='open'),
        sa.Column('description', sa.Text()),
        sa.Column('eligibility', sa.Text()),
        sa.Column('application_url', sa.String(500)),
        sa.Column('created_at', sa.DateTime()),
    )
    op.create_table('donor_installments',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('donor_id', sa.Integer(), sa.ForeignKey('donors.id')),
        sa.Column('grant_id', sa.Integer(), sa.ForeignKey('grants.id')),
        sa.Column('amount', sa.Float(), default=0),
        sa.Column('currency', sa.String(10), default='USD'),
        sa.Column('due_date', sa.DateTime()),
        sa.Column('status', sa.String(50), default='pending'),
        sa.Column('disbursed_at', sa.DateTime()),
        sa.Column('notes', sa.Text()),
        sa.Column('created_at', sa.DateTime()),
    )
    op.create_table('donor_visits',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('donor_id', sa.Integer(), sa.ForeignKey('donors.id')),
        sa.Column('project_id', sa.Integer(), sa.ForeignKey('projects.id')),
        sa.Column('visit_date', sa.DateTime()),
        sa.Column('location', sa.String(300)),
        sa.Column('purpose', sa.Text()),
        sa.Column('status', sa.String(50), default='scheduled'),
        sa.Column('findings', sa.Text()),
        sa.Column('created_at', sa.DateTime()),
    )
    op.create_table('donor_communications',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('donor_id', sa.Integer(), sa.ForeignKey('donors.id')),
        sa.Column('subject', sa.String(500)),
        sa.Column('message', sa.Text()),
        sa.Column('direction', sa.String(20), default='outgoing'),
        sa.Column('channel', sa.String(50), default='email'),
        sa.Column('sent_at', sa.DateTime()),
        sa.Column('created_at', sa.DateTime()),
    )

    # Data Center tables
    op.create_table('org_policies',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('title', sa.String(500), nullable=False),
        sa.Column('category', sa.String(50)),
        sa.Column('version', sa.String(20), default='1.0'),
        sa.Column('content', sa.Text()),
        sa.Column('summary', sa.Text()),
        sa.Column('effective_date', sa.DateTime()),
        sa.Column('review_date', sa.DateTime()),
        sa.Column('approved_by', sa.String(200)),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('attachment_url', sa.String(500)),
        sa.Column('created_at', sa.DateTime()),
        sa.Column('updated_at', sa.DateTime()),
    )
    op.create_table('contact_directory',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(300), nullable=False),
        sa.Column('organization', sa.String(300)),
        sa.Column('contact_type', sa.String(50)),
        sa.Column('title', sa.String(200)),
        sa.Column('email', sa.String(200)),
        sa.Column('phone', sa.String(50)),
        sa.Column('phone2', sa.String(50)),
        sa.Column('address', sa.Text()),
        sa.Column('city', sa.String(100)),
        sa.Column('country', sa.String(100)),
        sa.Column('notes', sa.Text()),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('tags', sa.JSON()),
        sa.Column('created_at', sa.DateTime()),
    )
    op.create_table('org_resources',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('title', sa.String(500), nullable=False),
        sa.Column('resource_type', sa.String(50)),
        sa.Column('category', sa.String(100)),
        sa.Column('description', sa.Text()),
        sa.Column('file_url', sa.String(500)),
        sa.Column('content', sa.Text()),
        sa.Column('language', sa.String(10), default='ar'),
        sa.Column('version', sa.String(20), default='1.0'),
        sa.Column('download_count', sa.Integer(), default=0),
        sa.Column('is_public', sa.Boolean(), default=False),
        sa.Column('tags', sa.JSON()),
        sa.Column('created_at', sa.DateTime()),
        sa.Column('updated_at', sa.DateTime()),
    )
    op.create_table('legal_documents',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('title', sa.String(500), nullable=False),
        sa.Column('doc_type', sa.String(50)),
        sa.Column('party_name', sa.String(300)),
        sa.Column('reference_number', sa.String(100)),
        sa.Column('start_date', sa.DateTime()),
        sa.Column('end_date', sa.DateTime()),
        sa.Column('value', sa.Float(), default=0),
        sa.Column('currency', sa.String(10), default='USD'),
        sa.Column('status', sa.String(50), default='active'),
        sa.Column('file_url', sa.String(500)),
        sa.Column('notes', sa.Text()),
        sa.Column('reminder_days', sa.Integer(), default=30),
        sa.Column('created_at', sa.DateTime()),
    )
    op.create_table('donor_profiles',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(300), nullable=False),
        sa.Column('acronym', sa.String(50)),
        sa.Column('donor_type', sa.String(100)),
        sa.Column('country', sa.String(100)),
        sa.Column('website', sa.String(300)),
        sa.Column('focal_point', sa.String(200)),
        sa.Column('email', sa.String(200)),
        sa.Column('phone', sa.String(50)),
        sa.Column('funding_sectors', sa.JSON()),
        sa.Column('funding_range_min', sa.Float(), default=0),
        sa.Column('funding_range_max', sa.Float(), default=0),
        sa.Column('currency', sa.String(10), default='USD'),
        sa.Column('reporting_requirements', sa.Text()),
        sa.Column('application_process', sa.Text()),
        sa.Column('notes', sa.Text()),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime()),
    )
    op.create_table('country_profiles',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('iso_code', sa.String(3)),
        sa.Column('region', sa.String(100)),
        sa.Column('capital', sa.String(100)),
        sa.Column('population', sa.Integer(), default=0),
        sa.Column('currency', sa.String(50)),
        sa.Column('languages', sa.JSON()),
        sa.Column('humanitarian_needs', sa.Text()),
        sa.Column('coordination_structure', sa.Text()),
        sa.Column('key_clusters', sa.JSON()),
        sa.Column('operating_ngos', sa.Integer(), default=0),
        sa.Column('crisis_level', sa.String(50)),
        sa.Column('hno_year', sa.Integer()),
        sa.Column('people_in_need', sa.Integer(), default=0),
        sa.Column('people_targeted', sa.Integer(), default=0),
        sa.Column('funding_required', sa.Float(), default=0),
        sa.Column('funding_received', sa.Float(), default=0),
        sa.Column('notes', sa.Text()),
        sa.Column('created_at', sa.DateTime()),
        sa.Column('updated_at', sa.DateTime()),
    )
    op.create_table('sector_references',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('cluster', sa.String(100)),
        sa.Column('lead_agency', sa.String(200)),
        sa.Column('description', sa.Text()),
        sa.Column('standards', sa.JSON()),
        sa.Column('key_indicators', sa.JSON()),
        sa.Column('min_standards', sa.Text()),
        sa.Column('guidelines_url', sa.String(500)),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime()),
    )
    op.create_table('emergency_contacts',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(300), nullable=False),
        sa.Column('role', sa.String(200)),
        sa.Column('organization', sa.String(300)),
        sa.Column('phone', sa.String(50), nullable=False),
        sa.Column('phone2', sa.String(50)),
        sa.Column('email', sa.String(200)),
        sa.Column('location', sa.String(200)),
        sa.Column('priority', sa.Integer(), default=1),
        sa.Column('available_24h', sa.Boolean(), default=False),
        sa.Column('notes', sa.Text()),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime()),
    )
    op.create_table('currency_rates',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('from_currency', sa.String(10), nullable=False),
        sa.Column('to_currency', sa.String(10), nullable=False),
        sa.Column('rate', sa.Float(), nullable=False),
        sa.Column('source', sa.String(100)),
        sa.Column('effective_date', sa.DateTime()),
        sa.Column('created_at', sa.DateTime()),
    )


def downgrade():
    op.drop_table('currency_rates')
    op.drop_table('emergency_contacts')
    op.drop_table('sector_references')
    op.drop_table('country_profiles')
    op.drop_table('donor_profiles')
    op.drop_table('legal_documents')
    op.drop_table('org_resources')
    op.drop_table('contact_directory')
    op.drop_table('org_policies')
    op.drop_table('donor_communications')
    op.drop_table('donor_visits')
    op.drop_table('donor_installments')
    op.drop_table('funding_opportunities')
    op.drop_table('proposals')
