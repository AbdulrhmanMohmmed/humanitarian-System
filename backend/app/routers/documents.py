from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import json
import os
import shutil
from datetime import datetime
from app.database import get_db
from app.models import Document, User, DocumentCategory
from app.schemas import DocumentOut, DocumentUpdate
from app.auth import get_current_user

router = APIRouter(prefix="/api/documents", tags=["أرشيف الوثائق"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "documents")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.get("/", response_model=List[DocumentOut])
def list_documents(
    category: Optional[str] = None,
    project_id: Optional[int] = None,
    search: Optional[str] = None,
    is_archived: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Document)
    if category:
        query = query.filter(Document.category == category)
    if project_id:
        query = query.filter(Document.project_id == project_id)
    if is_archived is not None:
        query = query.filter(Document.is_archived == is_archived)
    if search:
        query = query.filter(
            (Document.title.ilike(f"%{search}%")) |
            (Document.description.ilike(f"%{search}%")) |
            (Document.tags.ilike(f"%{search}%"))
        )
    return query.order_by(Document.created_at.desc()).all()


@router.post("/upload", response_model=DocumentOut)
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form(...),
    description: str = Form(None),
    category: str = Form("other"),
    project_id: int = Form(None),
    tags: str = Form(None),
    custom_values_json: str = Form("{}"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    safe_filename = f"{timestamp}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)

    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)

    file_size = len(content)

    try:
        custom_values = json.loads(custom_values_json or "{}")
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid custom_values_json")

    doc = Document(
        title=title,
        description=description,
        category=category,
        file_name=file.filename,
        file_path=file_path,
        file_size=file_size,
        file_type=file.content_type,
        project_id=project_id if project_id and project_id > 0 else None,
        tags=tags,
        uploaded_by=current_user.id,
    )
    doc.custom_values = custom_values
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


@router.get("/{document_id}", response_model=DocumentOut)
def get_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="الوثيقة غير موجودة")
    return doc


@router.put("/{document_id}", response_model=DocumentOut)
def update_document(
    document_id: int,
    data: DocumentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="الوثيقة غير موجودة")
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(doc, key, value)
    doc.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(doc)
    return doc


@router.delete("/{document_id}")
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="الوثيقة غير موجودة")
    if os.path.exists(doc.file_path):
        os.remove(doc.file_path)
    db.delete(doc)
    db.commit()
    return {"message": "تم حذف الوثيقة بنجاح"}


@router.get("/{document_id}/download")
def download_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="الوثيقة غير موجودة")
    if not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="الملف غير موجود على الخادم")
    from fastapi.responses import FileResponse
    return FileResponse(
        doc.file_path,
        filename=doc.file_name,
        media_type=doc.file_type or "application/octet-stream",
    )


@router.get("/categories/list")
def list_categories(current_user: User = Depends(get_current_user)):
    return [
        {"value": "project_proposal", "label": "مقترح مشروع"},
        {"value": "report", "label": "تقرير"},
        {"value": "assessment", "label": "تقييم"},
        {"value": "agreement", "label": "اتفاقية"},
        {"value": "budget", "label": "ميزانية"},
        {"value": "meeting_minutes", "label": "محضر اجتماع"},
        {"value": "policy", "label": "سياسة"},
        {"value": "photo", "label": "صورة"},
        {"value": "map", "label": "خريطة"},
        {"value": "other", "label": "أخرى"},
    ]
