from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Notification, Document
from app.auth import get_current_user
from app.models.user import User
import os

router = APIRouter(prefix="/api/comms", tags=["Communications & Documents"])

@router.get("/notifications")
def get_notifications(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Notification).filter(Notification.user_id == current_user.id).order_by(Notification.created_at.desc()).all()

@router.post("/notifications/read/{notif_id}")
def mark_as_read(notif_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    notif = db.query(Notification).filter(Notification.id == notif_id, Notification.user_id == current_user.id).first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"status": "success"}

@router.get("/documents")
def list_documents(project_id: int = None, category: str = None, db: Session = Depends(get_db)):
    query = db.query(Document)
    if project_id:
        query = query.filter(Document.project_id == project_id)
    # Note: category might need conversion if it's an Enum in the model
    return query.all()

@router.post("/documents/upload")
async def upload_document(
    title: str, 
    category: str, 
    project_id: int = None, 
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Mocking file save
    file_path = f"uploads/{file.filename}"
    doc = Document(
        title=title,
        file_path=file_path,
        file_name=file.filename,
        file_type=file.content_type,
        project_id=project_id,
        uploaded_by=current_user.id
    )
    db.add(doc)
    db.commit()
    return doc
