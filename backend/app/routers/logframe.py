from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import LogFrame, User
from app.schemas import LogFrameCreate, LogFrameOut
from app.auth import get_current_user

router = APIRouter(prefix="/api/logframe", tags=["الإطار المنطقي"])


@router.get("/project/{project_id}", response_model=List[LogFrameOut])
def get_project_logframe(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items = db.query(LogFrame).filter(
        LogFrame.project_id == project_id,
        LogFrame.parent_id.is_(None),
    ).order_by(LogFrame.order).all()
    return items


@router.get("/all", response_model=List[LogFrameOut])
def list_all_logframes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items = db.query(LogFrame).filter(
        LogFrame.parent_id.is_(None),
    ).order_by(LogFrame.project_id, LogFrame.order).all()
    return items


@router.post("/", response_model=LogFrameOut)
def create_logframe_item(
    data: LogFrameCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = LogFrame(**data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/{item_id}", response_model=LogFrameOut)
def update_logframe_item(
    item_id: int,
    data: LogFrameCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(LogFrame).filter(LogFrame.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="العنصر غير موجود")
    update_data = data.model_dump()
    for key, value in update_data.items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}")
def delete_logframe_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(LogFrame).filter(LogFrame.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="العنصر غير موجود")
    db.delete(item)
    db.commit()
    return {"message": "تم حذف العنصر بنجاح"}
