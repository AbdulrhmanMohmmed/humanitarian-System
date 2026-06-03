"""Add phone_surveys and third_party_checks tables

Revision ID: 0008
Revises: 0007
Create Date: 2026-05-07
"""
from alembic import op
import sqlalchemy as sa

revision = '0008'
down_revision = '0007'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'phone_surveys',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('title', sa.String(255), nullable=True),
        sa.Column('project_id', sa.Integer(), sa.ForeignKey('projects.id'), nullable=True),
        sa.Column('beneficiary_id', sa.Integer(), sa.ForeignKey('beneficiaries.id'), nullable=True),
        sa.Column('phone_number', sa.String(20), nullable=True),
        sa.Column('governorate', sa.String(100), nullable=True),
        sa.Column('district', sa.String(100), nullable=True),
        sa.Column('survey_type', sa.String(50), server_default='pdm'),
        sa.Column('questions', sa.Text(), server_default='[]'),
        sa.Column('responses', sa.Text(), server_default='{}'),
        sa.Column('status', sa.String(30), server_default='scheduled'),
        sa.Column('scheduled_date', sa.DateTime(), nullable=True),
        sa.Column('completed_date', sa.DateTime(), nullable=True),
        sa.Column('interviewer', sa.String(255), nullable=True),
        sa.Column('call_duration_minutes', sa.Integer(), nullable=True),
        sa.Column('call_quality', sa.String(20), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('consent_given', sa.Boolean(), server_default='false'),
        sa.Column('created_by', sa.Integer(), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
    )
    op.create_index('ix_phone_surveys_project_id', 'phone_surveys', ['project_id'])
    op.create_index('ix_phone_surveys_status', 'phone_surveys', ['status'])
    op.create_index('ix_phone_surveys_governorate', 'phone_surveys', ['governorate'])

    op.create_table(
        'third_party_checks',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('project_id', sa.Integer(), sa.ForeignKey('projects.id'), nullable=True),
        sa.Column('location', sa.String(255), nullable=True),
        sa.Column('governorate', sa.String(100), nullable=True),
        sa.Column('check_type', sa.String(50), server_default='verification'),
        sa.Column('third_party_name', sa.String(255), nullable=True),
        sa.Column('methodology', sa.Text(), nullable=True),
        sa.Column('findings', sa.Text(), nullable=True),
        sa.Column('photos', sa.Text(), server_default='[]'),
        sa.Column('gps_coordinates', sa.String(100), nullable=True),
        sa.Column('status', sa.String(30), server_default='pending'),
        sa.Column('risk_level', sa.String(20), server_default='high'),
        sa.Column('access_constraints', sa.Text(), nullable=True),
        sa.Column('created_by', sa.Integer(), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
    )
    op.create_index('ix_third_party_checks_project_id', 'third_party_checks', ['project_id'])
    op.create_index('ix_third_party_checks_status', 'third_party_checks', ['status'])


def downgrade() -> None:
    op.drop_table('third_party_checks')
    op.drop_table('phone_surveys')
