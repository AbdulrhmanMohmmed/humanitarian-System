"""IATI 2.03 XML export endpoints."""

from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import User
from app.services.iati_export import generate_activities_xml, generate_organization_xml

router = APIRouter(prefix="/iati", tags=["IATI Export"])


@router.get("/activities.xml")
def export_activities(
    org_name: str = Query("HIAOS Organization"),
    org_ref: str = Query("HIAOS"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    xml = generate_activities_xml(db, org_name=org_name, org_ref=org_ref)
    return Response(content=xml, media_type="application/xml")


@router.get("/organisation.xml")
def export_organisation(
    org_name: str = Query("HIAOS Organization"),
    org_ref: str = Query("HIAOS"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    xml = generate_organization_xml(db, org_name=org_name, org_ref=org_ref)
    return Response(content=xml, media_type="application/xml")
