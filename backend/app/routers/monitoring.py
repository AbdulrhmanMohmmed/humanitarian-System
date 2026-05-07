from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from app.database import get_db
from app.models import Indicator, Measurement, Survey, SurveyQuestion, SurveyResponse, User
from app.schemas import (
    IndicatorCreate, IndicatorOut, MeasurementCreate, MeasurementOut,
    SurveyCreate, SurveyOut
)
from app.auth import get_current_user

router = APIRouter(prefix="/monitoring", tags=["المتابعة والتقييم"])


# Indicators
@router.get("/indicators", response_model=List[IndicatorOut])
def list_indicators(
    project_id: Optional[int] = None,
    type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Indicator)
    if project_id:
        query = query.filter(Indicator.project_id == project_id)
    if type:
        query = query.filter(Indicator.type == type)
    return query.order_by(Indicator.created_at.desc()).all()


@router.post("/indicators", response_model=IndicatorOut)
def create_indicator(data: IndicatorCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ind = Indicator(**data.model_dump())
    db.add(ind)
    db.commit()
    db.refresh(ind)
    return ind


@router.delete("/indicators/{indicator_id}")
def delete_indicator(indicator_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ind = db.query(Indicator).filter(Indicator.id == indicator_id).first()
    if not ind:
        raise HTTPException(status_code=404, detail="المؤشر غير موجود")
    db.delete(ind)
    db.commit()
    return {"message": "تم حذف المؤشر بنجاح"}


# Measurements
@router.get("/measurements", response_model=List[MeasurementOut])
def list_measurements(
    indicator_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Measurement)
    if indicator_id:
        query = query.filter(Measurement.indicator_id == indicator_id)
    return query.order_by(Measurement.date.desc()).all()


@router.post("/measurements", response_model=MeasurementOut)
def create_measurement(data: MeasurementCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    m = Measurement(**data.model_dump(), collected_by=current_user.id)
    db.add(m)
    db.commit()
    db.refresh(m)

    # Update indicator actual_value
    ind = db.query(Indicator).filter(Indicator.id == data.indicator_id).first()
    if ind:
        total = db.query(func.sum(Measurement.value)).filter(Measurement.indicator_id == data.indicator_id).scalar() or 0
        ind.actual_value = total
        db.commit()

    return m


# Surveys
@router.get("/surveys", response_model=List[SurveyOut])
def list_surveys(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Survey).order_by(Survey.created_at.desc()).all()


@router.post("/surveys", response_model=SurveyOut)
def create_survey(data: SurveyCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    survey = Survey(
        title=data.title,
        description=data.description,
        project_id=data.project_id,
        start_date=data.start_date,
        end_date=data.end_date,
        created_by=current_user.id,
    )
    db.add(survey)
    db.commit()
    db.refresh(survey)

    for q in data.questions:
        question = SurveyQuestion(survey_id=survey.id, **q.model_dump())
        db.add(question)
    db.commit()
    db.refresh(survey)
    return survey


@router.get("/surveys/{survey_id}", response_model=SurveyOut)
def get_survey(survey_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    s = db.query(Survey).filter(Survey.id == survey_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="الاستبيان غير موجود")
    return s


@router.delete("/surveys/{survey_id}")
def delete_survey(survey_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    s = db.query(Survey).filter(Survey.id == survey_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="الاستبيان غير موجود")
    db.delete(s)
    db.commit()
    return {"message": "تم حذف الاستبيان بنجاح"}
