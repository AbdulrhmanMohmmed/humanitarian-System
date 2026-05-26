"""Migrate datetime.utcnow to datetime.now(timezone.utc), PyJWT, bcrypt

Revision ID: 0006
Revises: 0005

This migration handles:
- All datetime column defaults updated to use timezone-aware UTC
- Password hashing scheme changed from pbkdf2_sha256 to bcrypt
  (existing users need password reset on next login)
- No schema changes required (behavioral/library changes only)
"""
from alembic import op
import sqlalchemy as sa

revision = '0006'
down_revision = '0005'
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
