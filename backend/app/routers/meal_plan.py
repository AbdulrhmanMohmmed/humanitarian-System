from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import MEALPlan, User, MEALPlanStatus
from app.schemas import MEALPlanCreate, MEALPlanOut
from app.auth import get_current_user

router = APIRouter(prefix="/api/meal-plan", tags=["خطة MEAL"])


@router.get("/", response_model=List[MEALPlanOut])
def list_plans(
    project_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(MEALPlan)
    if project_id:
        query = query.filter(MEALPlan.project_id == project_id)
    return query.order_by(MEALPlan.created_at.desc()).all()


@router.post("/", response_model=MEALPlanOut)
def create_plan(
    data: MEALPlanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    plan = MEALPlan(**data.model_dump(), created_by=current_user.id)
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


@router.get("/{plan_id}", response_model=MEALPlanOut)
def get_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    plan = db.query(MEALPlan).filter(MEALPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="الخطة غير موجودة")
    return plan


@router.put("/{plan_id}", response_model=MEALPlanOut)
def update_plan(
    plan_id: int,
    data: MEALPlanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    plan = db.query(MEALPlan).filter(MEALPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="الخطة غير موجودة")
    for k, v in data.model_dump().items():
        setattr(plan, k, v)
    db.commit()
    db.refresh(plan)
    return plan


@router.put("/{plan_id}/status")
def update_status(
    plan_id: int,
    status: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    plan = db.query(MEALPlan).filter(MEALPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="الخطة غير موجودة")
    plan.status = status
    db.commit()
    return {"detail": "تم تحديث الحالة"}


@router.delete("/{plan_id}")
def delete_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    plan = db.query(MEALPlan).filter(MEALPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="الخطة غير موجودة")
    db.delete(plan)
    db.commit()
    return {"detail": "تم حذف الخطة"}
