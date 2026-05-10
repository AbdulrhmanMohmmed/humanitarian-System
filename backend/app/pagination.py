"""
Reusable server-side pagination utilities.

Usage in routers:
    from app.pagination import PaginationParams, paginate

    @router.get("/items")
    def list_items(params: PaginationParams = Depends(), db: Session = Depends(get_db)):
        query = db.query(Item)
        return paginate(query, params)
"""

from math import ceil
from typing import Any, Generic, TypeVar

from fastapi import Query
from pydantic import BaseModel
from sqlalchemy.orm import Query as SAQuery


T = TypeVar("T")


class PaginationParams:
    """Dependency-injectable pagination parameters."""

    def __init__(
        self,
        page: int = Query(1, ge=1, description="Page number"),
        page_size: int = Query(25, ge=1, le=100, description="Items per page"),
    ):
        self.page = page
        self.page_size = page_size

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size


class PaginatedResponse(BaseModel):
    """Standard paginated response wrapper."""

    items: list[Any]
    total: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_prev: bool


def paginate(query: SAQuery, params: PaginationParams) -> dict:
    """Apply pagination to a SQLAlchemy query and return a standardized response."""
    total = query.count()
    total_pages = ceil(total / params.page_size) if params.page_size else 0
    items = query.offset(params.offset).limit(params.page_size).all()

    return {
        "items": items,
        "total": total,
        "page": params.page,
        "page_size": params.page_size,
        "total_pages": total_pages,
        "has_next": params.page < total_pages,
        "has_prev": params.page > 1,
    }
