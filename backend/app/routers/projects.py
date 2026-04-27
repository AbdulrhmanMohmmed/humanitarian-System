from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import Project, Activity, User
from app.schemas import ProjectCreate, ProjectUpdate, ProjectOut, ActivityCreate, ActivityOut
from app.auth import get_current_user

router = APIRouter(prefix="/api/projects", tags=["المشاريع"])


@router.get("/", response_model=List[ProjectOut])
def list_projects(
    skip: int = 0, limit: int = 50,
    status: Optional[str] = None,
    sector: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Project)
    if status:
        query = query.filter(Project.status == status)
    if sector:
        query = query.filter(Project.sector == sector)
    return query.order_by(Project.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/stats")
def project_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from sqlalchemy import func
    total = db.query(Project).count()
    active = db.query(Project).filter(Project.status == "active").count()
    total_budget = db.query(func.sum(Project.budget)).scalar() or 0
    total_spent = db.query(func.sum(Project.spent)).scalar() or 0
    by_sector = db.query(Project.sector, func.count(Project.id)).group_by(Project.sector).all()
    return {
        "total": total,
        "active": active,
        "total_budget": total_budget,
        "total_spent": total_spent,
        "by_sector": [{"sector": s or "غير محدد", "count": c} for s, c in by_sector],
    }


@router.get("/{project_id}", response_model=ProjectOut)
def get_project(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    p = db.query(Project).filter(Project.id == project_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="المشروع غير موجود")
    return p


@router.post("/", response_model=ProjectOut)
def create_project(data: ProjectCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if db.query(Project).filter(Project.code == data.code).first():
        raise HTTPException(status_code=400, detail="رمز المشروع موجود بالفعل")
    p = Project(**data.model_dump(), manager_id=current_user.id)
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


@router.put("/{project_id}", response_model=ProjectOut)
def update_project(project_id: int, data: ProjectUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    p = db.query(Project).filter(Project.id == project_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="المشروع غير موجود")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(p, key, value)
    db.commit()
    db.refresh(p)
    return p


@router.delete("/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    p = db.query(Project).filter(Project.id == project_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="المشروع غير موجود")
    db.delete(p)
    db.commit()
    return {"message": "تم حذف المشروع بنجاح"}


# Activities
@router.get("/{project_id}/activities", response_model=List[ActivityOut])
def list_activities(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Activity).filter(Activity.project_id == project_id).all()


@router.post("/{project_id}/activities", response_model=ActivityOut)
def create_activity(project_id: int, data: ActivityCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    a = Activity(**data.model_dump())
    a.project_id = project_id
    db.add(a)
    db.commit()
    db.refresh(a)
    return a
