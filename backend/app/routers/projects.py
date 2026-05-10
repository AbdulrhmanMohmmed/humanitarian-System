from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import User, Project
from app.schemas import ProjectCreate, ProjectUpdate, ProjectOut, ActivityCreate, ActivityOut
from app.auth import get_current_user
from app.pagination import PaginationParams, paginate
from app.services import project_service as svc

router = APIRouter(prefix="/projects", tags=["المشاريع"])


@router.get("/")
def list_projects(
    params: PaginationParams = Depends(),
    status: Optional[str] = None,
    sector: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Project).filter(Project.deleted_at.is_(None))
    if status:
        query = query.filter(Project.status == status)
    if sector:
        query = query.filter(Project.sector == sector)
    query = query.order_by(Project.created_at.desc())
    return paginate(query, params)


@router.get("/stats")
def project_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return svc.project_stats(db)


@router.get("/{project_id}", response_model=ProjectOut)
def get_project(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return svc.get_project(db, project_id)


@router.post("/", response_model=ProjectOut)
def create_project(data: ProjectCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return svc.create_project(db, data, current_user.id)


@router.put("/{project_id}", response_model=ProjectOut)
def update_project(project_id: int, data: ProjectUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return svc.update_project(db, project_id, data)


@router.delete("/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    svc.delete_project(db, project_id)
    return {"message": "تم حذف المشروع بنجاح"}


# Activities
@router.get("/{project_id}/activities", response_model=List[ActivityOut])
def list_activities(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return svc.list_activities(db, project_id)


@router.post("/{project_id}/activities", response_model=ActivityOut)
def create_activity(project_id: int, data: ActivityCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return svc.create_activity(db, project_id, data)
