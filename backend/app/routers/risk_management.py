from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.risk_management import IncidentReport, RiskMatrix
from app.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/risk", tags=["Risk Management"])

@router.get("/incidents")
def list_incidents(db: Session = Depends(get_db)):
    return db.query(IncidentReport).order_by(IncidentReport.incident_date.desc()).all()

@router.post("/incidents")
def report_incident(data: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    incident = IncidentReport(**data, reported_by_id=current_user.id)
    db.add(incident)
    db.commit()
    return incident

@router.get("/matrix/{project_id}")
def get_risk_matrix(project_id: int, db: Session = Depends(get_db)):
    return db.query(RiskMatrix).filter(RiskMatrix.project_id == project_id).all()
