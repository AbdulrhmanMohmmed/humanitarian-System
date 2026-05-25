"""Shared API response models for OpenAPI documentation."""
from pydantic import BaseModel, Field
from typing import List, Optional, Any


class PaginatedResponse(BaseModel):
    items: List[Any] = Field(default_factory=list)
    total: int = 0
    page: int = 1
    page_size: int = 25
    pages: int = 0


class SearchResult(BaseModel):
    type: str
    id: int
    title: str
    subtitle: str = ""


class SearchResponse(BaseModel):
    query: str
    total: int
    page: int = 1
    limit: int = 20
    results: List[SearchResult]


class AnalyticsOverview(BaseModel):
    total_projects: int = 0
    active_projects: int = 0
    total_beneficiaries: int = 0
    total_indicators: int = 0
    total_forms: int = 0
    total_submissions: int = 0
    budget_utilization: float = 0
    total_spent: float = 0
    total_budget: float = 0


class HealthCheck(BaseModel):
    status: str = "healthy"
    version: str = "2.0.0"
    database: str = "connected"


class ErrorResponse(BaseModel):
    detail: str
