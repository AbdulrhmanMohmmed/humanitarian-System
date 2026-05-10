"""Unified Search API — full-text search across all entities."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.auth import get_current_user
from app.database import get_db
from app.models import User, Beneficiary, Project, Grant

router = APIRouter(prefix="/search", tags=["البحث"])


@router.get("/")
def unified_search(
    q: str = Query(..., min_length=2, description="Search query"),
    entity: str = Query("all", description="Entity filter: all, beneficiaries, projects, grants"),
    limit: int = Query(20, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Search across beneficiaries, projects, and grants."""
    results = []
    term = f"%{q}%"

    if entity in ("all", "beneficiaries"):
        bens = (
            db.query(Beneficiary)
            .filter(
                Beneficiary.deleted_at.is_(None),
                or_(
                    Beneficiary.first_name.ilike(term),
                    Beneficiary.last_name.ilike(term),
                    Beneficiary.national_id.ilike(term),
                    Beneficiary.governorate.ilike(term),
                ),
            )
            .limit(limit)
            .all()
        )
        for b in bens:
            results.append({
                "type": "beneficiary",
                "id": b.id,
                "title": f"{b.first_name} {b.last_name}",
                "subtitle": b.governorate or "",
                "national_id": b.national_id,
            })

    if entity in ("all", "projects"):
        projects = (
            db.query(Project)
            .filter(
                Project.deleted_at.is_(None),
                or_(
                    Project.name.ilike(term),
                    Project.description.ilike(term),
                    Project.sector.ilike(term),
                ),
            )
            .limit(limit)
            .all()
        )
        for p in projects:
            results.append({
                "type": "project",
                "id": p.id,
                "title": p.name,
                "subtitle": p.sector or "",
                "status": p.status,
            })

    if entity in ("all", "grants"):
        grants = (
            db.query(Grant)
            .filter(
                Grant.deleted_at.is_(None),
                or_(
                    Grant.name.ilike(term),
                    Grant.conditions.ilike(term),
                ),
            )
            .limit(limit)
            .all()
        )
        for g in grants:
            results.append({
                "type": "grant",
                "id": g.id,
                "title": g.name,
                "subtitle": f"{g.amount} {g.currency.value if hasattr(g.currency, 'value') else 'USD'}",
            })

    return {"query": q, "total": len(results), "results": results[:limit]}
