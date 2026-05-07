"""Service layer for Project and Activity operations."""

from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.middleware.error_handler import ConflictError, NotFoundError
from app.models import Activity, Project
from app.schemas import ActivityCreate, ProjectCreate, ProjectUpdate


def list_projects(
    db: Session,
    *,
    skip: int = 0,
    limit: int = 50,
    status: Optional[str] = None,
    sector: Optional[str] = None,
) -> list[Project]:
    query = db.query(Project)
    if status:
        query = query.filter(Project.status == status)
    if sector:
        query = query.filter(Project.sector == sector)
    return query.order_by(Project.created_at.desc()).offset(skip).limit(limit).all()


def project_stats(db: Session) -> dict:
    total = db.query(Project).count()
    active = db.query(Project).filter(Project.status == "active").count()
    total_budget = db.query(func.sum(Project.budget)).scalar() or 0
    total_spent = db.query(func.sum(Project.spent)).scalar() or 0
    by_sector = (
        db.query(Project.sector, func.count(Project.id))
        .group_by(Project.sector)
        .all()
    )
    return {
        "total": total,
        "active": active,
        "total_budget": total_budget,
        "total_spent": total_spent,
        "by_sector": [
            {"sector": s or "غير محدد", "count": c} for s, c in by_sector
        ],
    }


def get_project(db: Session, project_id: int) -> Project:
    p = db.query(Project).filter(Project.id == project_id).first()
    if not p:
        raise NotFoundError("Project", project_id)
    return p


def create_project(db: Session, data: ProjectCreate, manager_id: int) -> Project:
    if db.query(Project).filter(Project.code == data.code).first():
        raise ConflictError("رمز المشروع موجود بالفعل")
    p = Project(**data.model_dump(), manager_id=manager_id)
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


def update_project(db: Session, project_id: int, data: ProjectUpdate) -> Project:
    p = get_project(db, project_id)
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(p, key, value)
    db.commit()
    db.refresh(p)
    return p


def delete_project(db: Session, project_id: int) -> None:
    p = get_project(db, project_id)
    db.delete(p)
    db.commit()


def list_activities(db: Session, project_id: int) -> list[Activity]:
    return db.query(Activity).filter(Activity.project_id == project_id).all()


def create_activity(
    db: Session, project_id: int, data: ActivityCreate
) -> Activity:
    get_project(db, project_id)  # ensure project exists
    a = Activity(**data.model_dump())
    a.project_id = project_id
    db.add(a)
    db.commit()
    db.refresh(a)
    return a
