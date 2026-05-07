"""
Reusable model mixins.
"""

from datetime import datetime

from sqlalchemy import Column, DateTime, Integer


class SoftDeleteMixin:
    """Adds soft-delete support via deleted_at timestamp.

    Usage:
        class Beneficiary(SoftDeleteMixin, Base):
            ...

    Queries should filter: .filter(Model.deleted_at.is_(None))
    """
    deleted_at = Column(DateTime, nullable=True, default=None, index=True)
    deleted_by = Column(Integer, nullable=True)

    @property
    def is_deleted(self) -> bool:
        return self.deleted_at is not None

    def soft_delete(self, user_id: int | None = None):
        self.deleted_at = datetime.utcnow()
        self.deleted_by = user_id
