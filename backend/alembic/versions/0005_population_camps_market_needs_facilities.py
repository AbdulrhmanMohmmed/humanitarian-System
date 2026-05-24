"""Add population demographics, camp sites, market studies, needs assessments, and sector facilities

Revision ID: 0005
Revises: 0004
"""
from alembic import op
import sqlalchemy as sa

revision = '0005'
down_revision = '0004'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('population_records',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('governorate', sa.String(200), nullable=False),
        sa.Column('district', sa.String(200)),
        sa.Column('sub_district', sa.String(200)),
        sa.Column('category', sa.String(50), nullable=False),
        sa.Column('gender', sa.String(20), default='total'),
        sa.Column('age_group', sa.String(20), default='total'),
        sa.Column('count', sa.Integer(), nullable=False, default=0),
        sa.Column('year', sa.Integer(), nullable=False),
        sa.Column('quarter', sa.Integer()),
        sa.Column('source', sa.String(300)),
        sa.Column('methodology', sa.String(200)),
        sa.Column('confidence_level', sa.String(50)),
        sa.Column('notes', sa.Text()),
        sa.Column('is_verified', sa.Boolean(), default=False),
        sa.Column('created_at', sa.DateTime()),
        sa.Column('updated_at', sa.DateTime()),
    )

    op.create_table('camp_site_profiles',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(300), nullable=False),
        sa.Column('site_id', sa.String(50), unique=True),
        sa.Column('camp_type', sa.String(100)),
        sa.Column('status', sa.String(50), default='active'),
        sa.Column('governorate', sa.String(200)),
        sa.Column('district', sa.String(200)),
        sa.Column('sub_district', sa.String(200)),
        sa.Column('latitude', sa.Float()),
        sa.Column('longitude', sa.Float()),
        sa.Column('capacity', sa.Integer(), default=0),
        sa.Column('current_population', sa.Integer(), default=0),
        sa.Column('households', sa.Integer(), default=0),
        sa.Column('established_date', sa.DateTime()),
        sa.Column('managed_by', sa.String(300)),
        sa.Column('land_ownership', sa.String(100)),
        sa.Column('shelter_types', sa.JSON()),
        sa.Column('available_services', sa.JSON()),
        sa.Column('water_source', sa.String(200)),
        sa.Column('electricity_available', sa.Boolean(), default=False),
        sa.Column('health_facility_nearby', sa.Boolean(), default=False),
        sa.Column('school_nearby', sa.Boolean(), default=False),
        sa.Column('protection_concerns', sa.JSON()),
        sa.Column('accessibility', sa.String(200)),
        sa.Column('last_assessment_date', sa.DateTime()),
        sa.Column('notes', sa.Text()),
        sa.Column('created_at', sa.DateTime()),
        sa.Column('updated_at', sa.DateTime()),
    )

    op.create_table('market_studies',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('title', sa.String(500), nullable=False),
        sa.Column('study_type', sa.String(100)),
        sa.Column('governorate', sa.String(200)),
        sa.Column('district', sa.String(200)),
        sa.Column('assessment_date', sa.DateTime()),
        sa.Column('market_name', sa.String(300)),
        sa.Column('market_functionality', sa.String(100)),
        sa.Column('main_commodities', sa.JSON()),
        sa.Column('supply_chain_status', sa.String(200)),
        sa.Column('price_trends', sa.String(200)),
        sa.Column('access_constraints', sa.JSON()),
        sa.Column('recommendations', sa.Text()),
        sa.Column('methodology', sa.String(200)),
        sa.Column('sample_size', sa.Integer(), default=0),
        sa.Column('conducted_by', sa.String(300)),
        sa.Column('report_url', sa.String(500)),
        sa.Column('notes', sa.Text()),
        sa.Column('created_at', sa.DateTime()),
    )

    op.create_table('commodity_prices',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('commodity_name', sa.String(200), nullable=False),
        sa.Column('commodity_category', sa.String(100)),
        sa.Column('unit', sa.String(50), nullable=False),
        sa.Column('price', sa.Float(), nullable=False),
        sa.Column('currency', sa.String(10), default='YER'),
        sa.Column('governorate', sa.String(200)),
        sa.Column('district', sa.String(200)),
        sa.Column('market_name', sa.String(300)),
        sa.Column('collection_date', sa.DateTime(), nullable=False),
        sa.Column('price_previous', sa.Float()),
        sa.Column('price_change_pct', sa.Float()),
        sa.Column('source', sa.String(300)),
        sa.Column('is_meb_item', sa.Boolean(), default=False),
        sa.Column('notes', sa.Text()),
        sa.Column('created_at', sa.DateTime()),
    )

    op.create_table('meb_baskets',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(300), nullable=False),
        sa.Column('basket_type', sa.String(100)),
        sa.Column('governorate', sa.String(200)),
        sa.Column('district', sa.String(200)),
        sa.Column('calculation_date', sa.DateTime()),
        sa.Column('total_cost', sa.Float(), nullable=False, default=0),
        sa.Column('currency', sa.String(10), default='YER'),
        sa.Column('household_size', sa.Integer(), default=7),
        sa.Column('items', sa.JSON()),
        sa.Column('previous_cost', sa.Float()),
        sa.Column('cost_change_pct', sa.Float()),
        sa.Column('methodology', sa.String(200)),
        sa.Column('source', sa.String(300)),
        sa.Column('notes', sa.Text()),
        sa.Column('created_at', sa.DateTime()),
    )

    op.create_table('needs_assessment_records',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('title', sa.String(500), nullable=False),
        sa.Column('assessment_type', sa.String(100)),
        sa.Column('sector', sa.String(100)),
        sa.Column('governorate', sa.String(200)),
        sa.Column('district', sa.String(200)),
        sa.Column('sub_district', sa.String(200)),
        sa.Column('assessment_date', sa.DateTime()),
        sa.Column('severity', sa.String(50)),
        sa.Column('people_in_need', sa.Integer(), default=0),
        sa.Column('people_targeted', sa.Integer(), default=0),
        sa.Column('people_reached', sa.Integer(), default=0),
        sa.Column('households_assessed', sa.Integer(), default=0),
        sa.Column('key_findings', sa.Text()),
        sa.Column('priority_needs', sa.JSON()),
        sa.Column('gaps_identified', sa.JSON()),
        sa.Column('recommendations', sa.Text()),
        sa.Column('data_sources', sa.JSON()),
        sa.Column('methodology', sa.String(200)),
        sa.Column('conducted_by', sa.String(300)),
        sa.Column('report_url', sa.String(500)),
        sa.Column('hno_year', sa.Integer()),
        sa.Column('ipc_phase', sa.String(50)),
        sa.Column('notes', sa.Text()),
        sa.Column('created_at', sa.DateTime()),
        sa.Column('updated_at', sa.DateTime()),
    )

    op.create_table('sector_facilities',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(300), nullable=False),
        sa.Column('facility_type', sa.String(50), nullable=False),
        sa.Column('status', sa.String(50), default='functional'),
        sa.Column('governorate', sa.String(200)),
        sa.Column('district', sa.String(200)),
        sa.Column('sub_district', sa.String(200)),
        sa.Column('latitude', sa.Float()),
        sa.Column('longitude', sa.Float()),
        sa.Column('capacity', sa.Integer(), default=0),
        sa.Column('current_utilization', sa.Integer(), default=0),
        sa.Column('managed_by', sa.String(300)),
        sa.Column('supported_by', sa.JSON()),
        sa.Column('services_provided', sa.JSON()),
        sa.Column('staff_count', sa.Integer(), default=0),
        sa.Column('operating_hours', sa.String(100)),
        sa.Column('beneficiaries_served', sa.Integer(), default=0),
        sa.Column('catchment_population', sa.Integer(), default=0),
        sa.Column('last_assessment_date', sa.DateTime()),
        sa.Column('challenges', sa.JSON()),
        sa.Column('needs', sa.JSON()),
        sa.Column('notes', sa.Text()),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime()),
        sa.Column('updated_at', sa.DateTime()),
    )


def downgrade():
    op.drop_table('sector_facilities')
    op.drop_table('needs_assessment_records')
    op.drop_table('meb_baskets')
    op.drop_table('commodity_prices')
    op.drop_table('market_studies')
    op.drop_table('camp_site_profiles')
    op.drop_table('population_records')
