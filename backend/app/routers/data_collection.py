from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import json
from app.database import get_db
from app.models import DataCollectionForm, FormField, FormSubmission, User, FormStatus, SubmissionStatus
from app.schemas import (
    DataCollectionFormCreate, DataCollectionFormOut, DataCollectionFormUpdate,
    FormFieldCreate, FormFieldOut,
    FormSubmissionCreate, FormSubmissionOut,
)
from app.auth import get_current_user
from datetime import datetime, timezone

router = APIRouter(prefix="/data-collection", tags=["جمع البيانات"])


@router.get("/forms", response_model=List[DataCollectionFormOut])
def list_forms(
    project_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(DataCollectionForm)
    if project_id:
        query = query.filter(DataCollectionForm.project_id == project_id)
    if status:
        query = query.filter(DataCollectionForm.status == status)
    forms = query.order_by(DataCollectionForm.created_at.desc()).all()
    result = []
    for form in forms:
        form_dict = {
            "id": form.id,
            "title": form.title,
            "description": form.description,
            "project_id": form.project_id,
            "status": form.status,
            "version": form.version,
            "allow_edit_after_submit": form.allow_edit_after_submit,
            "collect_gps": form.collect_gps,
            "require_authentication": form.require_authentication,
            "submission_limit": form.submission_limit,
            "fields": form.fields,
            "submission_count": len(form.submissions),
            "created_at": form.created_at,
        }
        result.append(form_dict)
    return result


@router.post("/forms", response_model=DataCollectionFormOut)
def create_form(
    data: DataCollectionFormCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    form = DataCollectionForm(
        title=data.title,
        description=data.description,
        project_id=data.project_id,
        status=data.status,
        allow_edit_after_submit=data.allow_edit_after_submit,
        collect_gps=data.collect_gps,
        require_authentication=data.require_authentication,
        submission_limit=data.submission_limit,
        created_by=current_user.id,
    )
    db.add(form)
    db.commit()
    db.refresh(form)

    for i, field_data in enumerate(data.fields):
        field = FormField(
            form_id=form.id,
            field_name=field_data.field_name,
            label=field_data.label,
            field_type=field_data.field_type,
            is_required=field_data.is_required,
            options=field_data.options,
            default_value=field_data.default_value,
            validation_rules=field_data.validation_rules,
            help_text=field_data.help_text,
            order=field_data.order if field_data.order else i,
            section_name=field_data.section_name,
            skip_logic=field_data.skip_logic,
            appearance=field_data.appearance,
        )
        db.add(field)
    db.commit()
    db.refresh(form)

    return {
        "id": form.id,
        "title": form.title,
        "description": form.description,
        "project_id": form.project_id,
        "status": form.status,
        "version": form.version,
        "allow_edit_after_submit": form.allow_edit_after_submit,
        "collect_gps": form.collect_gps,
        "require_authentication": form.require_authentication,
        "submission_limit": form.submission_limit,
        "fields": form.fields,
        "submission_count": 0,
        "created_at": form.created_at,
    }


@router.get("/forms/{form_id}", response_model=DataCollectionFormOut)
def get_form(
    form_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    form = db.query(DataCollectionForm).filter(DataCollectionForm.id == form_id).first()
    if not form:
        raise HTTPException(status_code=404, detail="النموذج غير موجود")
    return {
        "id": form.id,
        "title": form.title,
        "description": form.description,
        "project_id": form.project_id,
        "status": form.status,
        "version": form.version,
        "allow_edit_after_submit": form.allow_edit_after_submit,
        "collect_gps": form.collect_gps,
        "require_authentication": form.require_authentication,
        "submission_limit": form.submission_limit,
        "fields": form.fields,
        "submission_count": len(form.submissions),
        "created_at": form.created_at,
    }


@router.put("/forms/{form_id}", response_model=DataCollectionFormOut)
def update_form(
    form_id: int,
    data: DataCollectionFormUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    form = db.query(DataCollectionForm).filter(DataCollectionForm.id == form_id).first()
    if not form:
        raise HTTPException(status_code=404, detail="النموذج غير موجود")
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(form, key, value)
    form.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(form)
    return {
        "id": form.id,
        "title": form.title,
        "description": form.description,
        "project_id": form.project_id,
        "status": form.status,
        "version": form.version,
        "allow_edit_after_submit": form.allow_edit_after_submit,
        "collect_gps": form.collect_gps,
        "require_authentication": form.require_authentication,
        "submission_limit": form.submission_limit,
        "fields": form.fields,
        "submission_count": len(form.submissions),
        "created_at": form.created_at,
    }


@router.delete("/forms/{form_id}")
def delete_form(
    form_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    form = db.query(DataCollectionForm).filter(DataCollectionForm.id == form_id).first()
    if not form:
        raise HTTPException(status_code=404, detail="النموذج غير موجود")
    db.query(FormField).filter(FormField.form_id == form_id).delete()
    db.query(FormSubmission).filter(FormSubmission.form_id == form_id).delete()
    db.delete(form)
    db.commit()
    return {"message": "تم حذف النموذج بنجاح"}


@router.post("/forms/{form_id}/fields", response_model=FormFieldOut)
def add_field(
    form_id: int,
    data: FormFieldCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    form = db.query(DataCollectionForm).filter(DataCollectionForm.id == form_id).first()
    if not form:
        raise HTTPException(status_code=404, detail="النموذج غير موجود")
    field = FormField(form_id=form_id, **data.model_dump())
    db.add(field)
    db.commit()
    db.refresh(field)
    return field


@router.delete("/forms/{form_id}/fields/{field_id}")
def delete_field(
    form_id: int,
    field_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    field = db.query(FormField).filter(
        FormField.id == field_id, FormField.form_id == form_id
    ).first()
    if not field:
        raise HTTPException(status_code=404, detail="الحقل غير موجود")
    db.delete(field)
    db.commit()
    return {"message": "تم حذف الحقل بنجاح"}


# -- Submissions --

@router.get("/forms/{form_id}/submissions", response_model=List[FormSubmissionOut])
def list_submissions(
    form_id: int,
    status: Optional[str] = None,
    governorate: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(FormSubmission).filter(FormSubmission.form_id == form_id)
    if status:
        query = query.filter(FormSubmission.status == status)
    if governorate:
        query = query.filter(FormSubmission.governorate == governorate)
    return query.order_by(FormSubmission.submitted_at.desc()).all()


@router.post("/submissions", response_model=FormSubmissionOut)
def create_submission(
    data: FormSubmissionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    form = db.query(DataCollectionForm).filter(DataCollectionForm.id == data.form_id).first()
    if not form:
        raise HTTPException(status_code=404, detail="النموذج غير موجود")
    if form.status != FormStatus.PUBLISHED:
        raise HTTPException(status_code=400, detail="النموذج غير منشور بعد")
    if form.submission_limit and len(form.submissions) >= form.submission_limit:
        raise HTTPException(status_code=400, detail="تم الوصول للحد الأقصى من الاستجابات")

    try:
        json.loads(data.data)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="بيانات الإجابات غير صالحة")

    submission = FormSubmission(
        form_id=data.form_id,
        data=data.data,
        submitted_by=current_user.id,
        beneficiary_id=data.beneficiary_id,
        governorate=data.governorate,
        district=data.district,
        gps_latitude=data.gps_latitude,
        gps_longitude=data.gps_longitude,
        notes=data.notes,
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    return submission


@router.put("/submissions/{submission_id}/validate")
def validate_submission(
    submission_id: int,
    approved: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sub = db.query(FormSubmission).filter(FormSubmission.id == submission_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="الاستجابة غير موجودة")
    sub.status = SubmissionStatus.VALIDATED if approved else SubmissionStatus.REJECTED
    sub.validated_by = current_user.id
    sub.validated_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "تم التحقق من الاستجابة بنجاح"}


@router.delete("/submissions/{submission_id}")
def delete_submission(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sub = db.query(FormSubmission).filter(FormSubmission.id == submission_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="الاستجابة غير موجودة")
    db.delete(sub)
    db.commit()
    return {"message": "تم حذف الاستجابة بنجاح"}
