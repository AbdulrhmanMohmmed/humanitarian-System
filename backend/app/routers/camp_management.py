"""Camp Management (CCCM) endpoints."""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import User
from app.models.new_modules import Camp, CampService
from app.pagination import PaginationParams, paginate

router = APIRouter(prefix="/camps", tags=["إدارة المخيمات"])


class CampCreate(BaseModel):
    name: str
    location: str = ""
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    capacity: int = 0


@router.post("/")
def create_camp(body: CampCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    camp = Camp(**body.model_dump(), camp_manager_id=current_user.id)
    db.add(camp)
    db.commit()
    return {"id": camp.id, "name": camp.name}


@router.get("/")
def list_camps(
    status: Optional[str] = None,
    params: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Camp)
    if status:
        query = query.filter(Camp.status == status)
    return paginate(query.order_by(Camp.name), params)


@router.get("/{camp_id}")
def get_camp(camp_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    camp = db.query(Camp).filter(Camp.id == camp_id).first()
    if not camp:
        raise HTTPException(404, "مخيم غير موجود")
    services = db.query(CampService).filter(CampService.camp_id == camp_id).all()
    return {
        "id": camp.id, "name": camp.name, "location": camp.location,
        "capacity": camp.capacity, "population": camp.current_population,
        "services": [{"id": s.id, "type": s.service_type, "provider": s.provider, "status": s.status} for s in services],
    }


class ServiceCreate(BaseModel):
    camp_id: int
    service_type: str
    provider: str = ""
    capacity: int = 0


@router.post("/services")
def add_service(body: ServiceCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    svc = CampService(**body.model_dump())
    db.add(svc)
    db.commit()
    return {"id": svc.id, "service_type": svc.service_type}
