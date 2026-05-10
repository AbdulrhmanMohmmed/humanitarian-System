"""Education in Emergencies endpoints."""
from typing import Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import User
from app.models.new_modules import School
from app.pagination import PaginationParams, paginate

router = APIRouter(prefix="/education", tags=["التعليم في الطوارئ"])


class SchoolCreate(BaseModel):
    name: str
    school_type: str = "formal"
    location: str = ""
    capacity: int = 0


@router.post("/schools")
def create_school(body: SchoolCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    school = School(**body.model_dump())
    db.add(school)
    db.commit()
    return {"id": school.id, "name": school.name}


@router.get("/schools")
def list_schools(
    school_type: Optional[str] = None,
    params: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(School)
    if school_type:
        query = query.filter(School.school_type == school_type)
    return paginate(query.order_by(School.name), params)


@router.get("/dashboard")
def education_dashboard(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    total = db.query(School).count()
    active = db.query(School).filter(School.status == "active").count()
    from sqlalchemy import func
    enrolled = db.query(func.sum(School.enrolled_students)).scalar() or 0
    teachers = db.query(func.sum(School.teachers_count)).scalar() or 0
    return {"total_schools": total, "active": active, "enrolled_students": int(enrolled), "teachers": int(teachers)}
