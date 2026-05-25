"""Unified Search API — full-text search across all entities."""
from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.auth import get_current_user
from app.database import get_db
from app.middleware.rate_limit import limiter
from app.models import User, Beneficiary, Project, Grant
from app.models.data_center import (
    OrgPolicy, ContactDirectory, OrgResource, CountryProfile,
    SectorReference, PopulationRecord, CampSiteProfile, SectorFacility,
)

router = APIRouter(prefix="/search", tags=["البحث"])

VALID_ENTITIES = (
    "all", "beneficiaries", "projects", "grants",
    "policies", "contacts", "resources", "countries",
    "sectors", "population", "camps", "facilities",
)


@router.get("/")
@limiter.limit("30/minute")
def unified_search(
    request: Request,
    q: str = Query(..., min_length=2, description="Search query"),
    entity: str = Query("all", description="Entity filter"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Search across beneficiaries, projects, grants, and data center."""
    results = []
    term = f"%{q}%"
    per = max(limit // 4, 5)

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
            .limit(per)
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
            .limit(per)
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
            .limit(per)
            .all()
        )
        for g in grants:
            results.append({
                "type": "grant",
                "id": g.id,
                "title": g.name,
                "subtitle": f"{g.amount} {g.currency.value if hasattr(g.currency, 'value') else 'USD'}",
            })

    if entity in ("all", "policies"):
        for row in db.query(OrgPolicy).filter(or_(OrgPolicy.title.ilike(term), OrgPolicy.category.ilike(term))).limit(per).all():
            results.append({"type": "policy", "id": row.id, "title": row.title, "subtitle": row.category or ""})

    if entity in ("all", "contacts"):
        for row in db.query(ContactDirectory).filter(or_(ContactDirectory.name.ilike(term), ContactDirectory.organization.ilike(term))).limit(per).all():
            results.append({"type": "contact", "id": row.id, "title": row.name, "subtitle": row.organization or ""})

    if entity in ("all", "countries"):
        for row in db.query(CountryProfile).filter(or_(CountryProfile.name.ilike(term), CountryProfile.region.ilike(term))).limit(per).all():
            results.append({"type": "country", "id": row.id, "title": row.name, "subtitle": row.region or ""})

    if entity in ("all", "camps"):
        for row in db.query(CampSiteProfile).filter(or_(CampSiteProfile.name.ilike(term), CampSiteProfile.governorate.ilike(term))).limit(per).all():
            results.append({"type": "camp", "id": row.id, "title": row.name, "subtitle": row.governorate or ""})

    if entity in ("all", "facilities"):
        for row in db.query(SectorFacility).filter(or_(SectorFacility.name.ilike(term), SectorFacility.governorate.ilike(term))).limit(per).all():
            results.append({"type": "facility", "id": row.id, "title": row.name, "subtitle": row.governorate or ""})

    total = len(results)
    start = (page - 1) * limit
    page_results = results[start:start + limit]
    return {"query": q, "total": total, "page": page, "limit": limit, "results": page_results}
