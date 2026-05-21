"""Geographic/GIS API endpoints for admin boundaries and locations."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
from pydantic import BaseModel
from app.database import get_db
from app.auth import get_current_user
from app.models import User
from app.models.geographic import AdminBoundary, Location, BoundaryLevel, LocationType, SpatialQuery

router = APIRouter(prefix="/geographic", tags=["Geographic / GIS"])


class AdminBoundaryOut(BaseModel):
    id: int
    name: str
    name_ar: Optional[str] = None
    code: Optional[str] = None
    level: str
    parent_id: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    population: int = 0
    area_sq_km: float = 0

    class Config:
        from_attributes = True


class LocationOut(BaseModel):
    id: int
    name: str
    location_type: str
    latitude: float
    longitude: float
    address: Optional[str] = None
    admin_boundary_id: Optional[int] = None
    is_active: bool = True

    class Config:
        from_attributes = True


class LocationCreate(BaseModel):
    name: str
    location_type: str
    latitude: float
    longitude: float
    altitude: Optional[float] = None
    address: Optional[str] = None
    admin_boundary_id: Optional[int] = None
    project_id: Optional[int] = None


class AdminBoundaryCreate(BaseModel):
    name: str
    name_ar: Optional[str] = None
    code: str
    level: str
    parent_id: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    population: int = 0
    area_sq_km: float = 0


@router.get("/boundaries", response_model=List[AdminBoundaryOut])
def list_boundaries(
    level: Optional[str] = None,
    parent_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(AdminBoundary)
    if level:
        q = q.filter(AdminBoundary.level == level)
    if parent_id is not None:
        q = q.filter(AdminBoundary.parent_id == parent_id)
    return q.order_by(AdminBoundary.name).all()


@router.post("/boundaries", response_model=AdminBoundaryOut)
def create_boundary(
    data: AdminBoundaryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    boundary = AdminBoundary(**data.model_dump())
    db.add(boundary)
    db.commit()
    db.refresh(boundary)
    return boundary


@router.get("/boundaries/{boundary_id}", response_model=AdminBoundaryOut)
def get_boundary(
    boundary_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    b = db.query(AdminBoundary).filter(AdminBoundary.id == boundary_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="الحد الإداري غير موجود")
    return b


@router.get("/locations", response_model=List[LocationOut])
def list_locations(
    location_type: Optional[str] = None,
    boundary_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Location).filter(Location.is_active == True)
    if location_type:
        q = q.filter(Location.location_type == location_type)
    if boundary_id is not None:
        q = q.filter(Location.admin_boundary_id == boundary_id)
    return q.order_by(Location.name).all()


@router.post("/locations", response_model=LocationOut)
def create_location(
    data: LocationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    loc = Location(**data.model_dump())
    db.add(loc)
    db.commit()
    db.refresh(loc)
    return loc


@router.get("/nearby")
def find_nearby(
    lat: float,
    lng: float,
    radius_km: float = 10.0,
    location_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Find locations within radius using Haversine approximation."""
    deg_per_km = 1 / 111.32
    lat_range = radius_km * deg_per_km
    lng_range = radius_km * deg_per_km

    q = db.query(Location).filter(
        Location.is_active == True,
        Location.latitude.between(lat - lat_range, lat + lat_range),
        Location.longitude.between(lng - lng_range, lng + lng_range),
    )
    if location_type:
        q = q.filter(Location.location_type == location_type)

    results = q.all()
    nearby = []
    for loc in results:
        dist = ((loc.latitude - lat) ** 2 + (loc.longitude - lng) ** 2) ** 0.5 * 111.32
        if dist <= radius_km:
            nearby.append({
                "id": loc.id,
                "name": loc.name,
                "type": loc.location_type.value if hasattr(loc.location_type, 'value') else loc.location_type,
                "latitude": loc.latitude,
                "longitude": loc.longitude,
                "distance_km": round(dist, 2),
            })
    return sorted(nearby, key=lambda x: x["distance_km"])


@router.get("/heatmap")
def beneficiary_heatmap(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate heatmap data from beneficiary locations."""
    from app.models.beneficiary import Beneficiary
    results = db.query(
        Beneficiary.governorate,
        func.count(Beneficiary.id).label("count"),
    ).filter(
        Beneficiary.governorate.isnot(None),
    ).group_by(Beneficiary.governorate).all()

    return {
        "type": "heatmap",
        "data": [{"governorate": r.governorate, "count": r.count} for r in results],
    }


@router.get("/coverage")
def coverage_analysis(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Analyze geographic coverage of projects and beneficiaries."""
    from app.models.beneficiary import Beneficiary
    from app.models.project import Project

    bene_gov = db.query(
        Beneficiary.governorate, func.count(Beneficiary.id)
    ).filter(Beneficiary.governorate.isnot(None)).group_by(Beneficiary.governorate).all()

    proj_gov = db.query(
        Project.governorate, func.count(Project.id)
    ).filter(Project.governorate.isnot(None)).group_by(Project.governorate).all()

    boundaries = db.query(AdminBoundary).filter(AdminBoundary.level == "governorate").all()

    coverage = {}
    for b in boundaries:
        coverage[b.name] = {
            "boundary_id": b.id,
            "population": b.population,
            "beneficiaries": 0,
            "projects": 0,
            "coverage_pct": 0,
        }

    for gov, count in bene_gov:
        if gov in coverage:
            coverage[gov]["beneficiaries"] = count
            if coverage[gov]["population"] > 0:
                coverage[gov]["coverage_pct"] = round(count / coverage[gov]["population"] * 100, 2)

    for gov, count in proj_gov:
        if gov in coverage:
            coverage[gov]["projects"] = count

    return {"coverage": list(coverage.values()), "total_governorates": len(coverage)}
