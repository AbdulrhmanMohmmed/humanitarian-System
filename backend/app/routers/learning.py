from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import LessonLearned, ActionReview, CaseStudy, User
from app.schemas import (
    LessonLearnedCreate, LessonLearnedOut,
    ActionReviewCreate, ActionReviewOut,
    CaseStudyCreate, CaseStudyOut,
)
from app.auth import get_current_user

router = APIRouter(prefix="/api/learning", tags=["التعلم"])


# ---- Lessons Learned ----

@router.get("/lessons", response_model=List[LessonLearnedOut])
def list_lessons(
    category: Optional[str] = None,
    project_id: Optional[int] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(LessonLearned)
    if category:
        query = query.filter(LessonLearned.category == category)
    if project_id:
        query = query.filter(LessonLearned.project_id == project_id)
    if search:
        query = query.filter(
            (LessonLearned.title.ilike(f"%{search}%")) |
            (LessonLearned.description.ilike(f"%{search}%"))
        )
    return query.order_by(LessonLearned.created_at.desc()).all()


@router.post("/lessons", response_model=LessonLearnedOut)
def create_lesson(
    data: LessonLearnedCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lesson = LessonLearned(**data.model_dump(), created_by=current_user.id)
    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    return lesson


@router.delete("/lessons/{lesson_id}")
def delete_lesson(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lesson = db.query(LessonLearned).filter(LessonLearned.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="الدرس غير موجود")
    db.delete(lesson)
    db.commit()
    return {"message": "تم حذف الدرس بنجاح"}


# ---- Action Reviews (AAR) ----

@router.get("/reviews", response_model=List[ActionReviewOut])
def list_reviews(
    project_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(ActionReview)
    if project_id:
        query = query.filter(ActionReview.project_id == project_id)
    return query.order_by(ActionReview.created_at.desc()).all()


@router.post("/reviews", response_model=ActionReviewOut)
def create_review(
    data: ActionReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    review = ActionReview(**data.model_dump(), created_by=current_user.id)
    db.add(review)
    db.commit()
    db.refresh(review)
    return review


@router.delete("/reviews/{review_id}")
def delete_review(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    review = db.query(ActionReview).filter(ActionReview.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="المراجعة غير موجودة")
    db.delete(review)
    db.commit()
    return {"message": "تم حذف المراجعة بنجاح"}


# ---- Case Studies ----

@router.get("/case-studies", response_model=List[CaseStudyOut])
def list_case_studies(
    project_id: Optional[int] = None,
    sector: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(CaseStudy)
    if project_id:
        query = query.filter(CaseStudy.project_id == project_id)
    if sector:
        query = query.filter(CaseStudy.sector == sector)
    if search:
        query = query.filter(
            (CaseStudy.title.ilike(f"%{search}%")) |
            (CaseStudy.summary.ilike(f"%{search}%"))
        )
    return query.order_by(CaseStudy.created_at.desc()).all()


@router.post("/case-studies", response_model=CaseStudyOut)
def create_case_study(
    data: CaseStudyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    study = CaseStudy(**data.model_dump(), created_by=current_user.id)
    db.add(study)
    db.commit()
    db.refresh(study)
    return study


@router.put("/case-studies/{study_id}/publish")
def toggle_publish(
    study_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    study = db.query(CaseStudy).filter(CaseStudy.id == study_id).first()
    if not study:
        raise HTTPException(status_code=404, detail="دراسة الحالة غير موجودة")
    study.is_published = not study.is_published
    db.commit()
    return {"is_published": study.is_published}


@router.delete("/case-studies/{study_id}")
def delete_case_study(
    study_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    study = db.query(CaseStudy).filter(CaseStudy.id == study_id).first()
    if not study:
        raise HTTPException(status_code=404, detail="دراسة الحالة غير موجودة")
    db.delete(study)
    db.commit()
    return {"message": "تم حذف دراسة الحالة بنجاح"}
