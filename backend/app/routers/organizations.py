"""Organization management endpoints for multi-tenancy."""

from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.middleware.error_handler import NotFoundError
from app.models import User
from app.models.organization import Organization, OrganizationMember
from app.pagination import PaginationParams, paginate

router = APIRouter(prefix="/organizations", tags=["Organizations"])


class OrganizationCreate(BaseModel):
    name: str
    short_name: Optional[str] = None
    description: Optional[str] = None
    country: Optional[str] = None
    sector: Optional[str] = None
    website: Optional[str] = None


class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    short_name: Optional[str] = None
    description: Optional[str] = None
    country: Optional[str] = None
    sector: Optional[str] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None


class AddMemberRequest(BaseModel):
    user_id: int
    role: str = "member"


@router.get("/")
def list_organizations(
    params: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return paginate(db.query(Organization).order_by(Organization.name), params)


@router.post("/")
def create_organization(
    body: OrganizationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    org = Organization(**body.model_dump())
    db.add(org)
    db.flush()
    member = OrganizationMember(
        organization_id=org.id, user_id=current_user.id, role="owner",
    )
    db.add(member)
    db.commit()
    db.refresh(org)
    return org


@router.get("/{org_id}")
def get_organization(
    org_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise NotFoundError("Organization", org_id)
    return org


@router.put("/{org_id}")
def update_organization(
    org_id: int,
    body: OrganizationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise NotFoundError("Organization", org_id)
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(org, key, value)
    db.commit()
    db.refresh(org)
    return org


@router.get("/{org_id}/members")
def list_members(
    org_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(OrganizationMember).filter(
        OrganizationMember.organization_id == org_id,
    ).all()


@router.post("/{org_id}/members")
def add_member(
    org_id: int,
    body: AddMemberRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise NotFoundError("Organization", org_id)
    member = OrganizationMember(
        organization_id=org_id, user_id=body.user_id, role=body.role,
    )
    db.add(member)
    db.commit()
    db.refresh(member)
    return member
