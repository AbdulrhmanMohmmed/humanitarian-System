"""Add database indexes for performance optimization

Revision ID: 0007
Revises: 0006

Indexes on frequently queried columns: status, governorate, created_at,
foreign keys, and search fields.
"""
from alembic import op
import sqlalchemy as sa

revision = '0007'
down_revision = '0006'
branch_labels = None
depends_on = None


def upgrade():
    # Beneficiary indexes
    op.create_index('ix_beneficiaries_governorate', 'beneficiaries', ['governorate'])
    op.create_index('ix_beneficiaries_national_id', 'beneficiaries', ['national_id'])
    op.create_index('ix_beneficiaries_created_at', 'beneficiaries', ['created_at'])

    # Project indexes
    op.create_index('ix_projects_status', 'projects', ['status'])
    op.create_index('ix_projects_sector', 'projects', ['sector'])
    op.create_index('ix_projects_created_at', 'projects', ['created_at'])

    # Transaction indexes
    op.create_index('ix_transactions_type', 'transactions', ['type'])
    op.create_index('ix_transactions_date', 'transactions', ['date'])
    op.create_index('ix_transactions_project_id', 'transactions', ['project_id'])

    # Grant indexes
    op.create_index('ix_grants_status', 'grants', ['status'])
    op.create_index('ix_grants_donor_id', 'grants', ['donor_id'])

    # Employee indexes
    op.create_index('ix_employees_status', 'employees', ['status'])
    op.create_index('ix_employees_department', 'employees', ['department'])

    # Distribution indexes
    op.create_index('ix_distributions_project_id', 'distributions', ['project_id'])
    op.create_index('ix_distributions_status', 'distributions', ['status'])

    # Inventory indexes
    op.create_index('ix_inventory_items_category', 'inventory_items', ['category'])

    # Data Center indexes
    op.create_index('ix_population_records_governorate', 'population_records', ['governorate'])
    op.create_index('ix_population_records_category', 'population_records', ['category'])
    op.create_index('ix_camp_site_profiles_governorate', 'camp_site_profiles', ['governorate'])
    op.create_index('ix_camp_site_profiles_status', 'camp_site_profiles', ['status'])
    op.create_index('ix_needs_assessments_governorate', 'needs_assessment_records', ['governorate'])
    op.create_index('ix_sector_facilities_sector', 'sector_facilities', ['sector'])
    op.create_index('ix_sector_facilities_governorate', 'sector_facilities', ['governorate'])

    # Audit/Activity log indexes
    op.create_index('ix_org_policies_category', 'org_policies', ['category'])
    op.create_index('ix_contact_directory_type', 'contact_directory', ['contact_type'])


def downgrade():
    op.drop_index('ix_beneficiaries_governorate')
    op.drop_index('ix_beneficiaries_national_id')
    op.drop_index('ix_beneficiaries_created_at')
    op.drop_index('ix_projects_status')
    op.drop_index('ix_projects_sector')
    op.drop_index('ix_projects_created_at')
    op.drop_index('ix_transactions_type')
    op.drop_index('ix_transactions_date')
    op.drop_index('ix_transactions_project_id')
    op.drop_index('ix_grants_status')
    op.drop_index('ix_grants_donor_id')
    op.drop_index('ix_employees_status')
    op.drop_index('ix_employees_department')
    op.drop_index('ix_distributions_project_id')
    op.drop_index('ix_distributions_status')
    op.drop_index('ix_inventory_items_category')
    op.drop_index('ix_population_records_governorate')
    op.drop_index('ix_population_records_category')
    op.drop_index('ix_camp_site_profiles_governorate')
    op.drop_index('ix_camp_site_profiles_status')
    op.drop_index('ix_needs_assessments_governorate')
    op.drop_index('ix_sector_facilities_sector')
    op.drop_index('ix_sector_facilities_governorate')
    op.drop_index('ix_org_policies_category')
    op.drop_index('ix_contact_directory_type')
