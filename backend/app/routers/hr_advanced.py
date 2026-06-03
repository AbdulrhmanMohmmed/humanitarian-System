"""Advanced HR endpoints — Payroll, Performance, Training, Timesheets, Safety, Contracts."""
from typing import Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.auth import get_current_user
from app.database import get_db
from app.models import User
from app.models.hr_advanced import (
    PayrollRecord, PerformanceReview, Training, TrainingParticipant,
    Timesheet, StaffSafetyCheckIn, EmployeeContract,
)
from app.pagination import PaginationParams, paginate

router = APIRouter(prefix="/hr-advanced", tags=["الموارد البشرية المتقدمة"])


# ── Payroll ──────────────────────────────────────────────────────────────────

class PayrollCreate(BaseModel):
    employee_id: int
    period_start: date
    period_end: date
    basic_salary: float
    allowances: float = 0
    deductions: float = 0
    tax: float = 0
    social_insurance: float = 0
    grant_id: Optional[int] = None
    project_id: Optional[int] = None


@router.post("/payroll")
def create_payroll(body: PayrollCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    net = body.basic_salary + body.allowances - body.deductions - body.tax - body.social_insurance
    record = PayrollRecord(**body.model_dump(), net_salary=net)
    db.add(record)
    db.commit()
    db.refresh(record)
    return {"id": record.id, "net_salary": net, "status": record.status}


@router.get("/payroll")
def list_payroll(
    employee_id: Optional[int] = None,
    status: Optional[str] = None,
    params: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(PayrollRecord)
    if employee_id:
        query = query.filter(PayrollRecord.employee_id == employee_id)
    if status:
        query = query.filter(PayrollRecord.status == status)
    return paginate(query.order_by(PayrollRecord.period_start.desc()), params)


@router.post("/payroll/{record_id}/approve")
def approve_payroll(record_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    record = db.query(PayrollRecord).filter(PayrollRecord.id == record_id).first()
    if not record:
        raise HTTPException(404, "سجل غير موجود")
    record.status = "approved"
    record.approved_by = current_user.id
    db.commit()
    return {"status": "approved"}


# ── Performance Reviews ──────────────────────────────────────────────────────

class PerformanceCreate(BaseModel):
    employee_id: int
    period: str
    overall_score: float = 0
    objectives_score: float = 0
    competencies_score: float = 0
    comments: str = ""
    goals_next_period: str = ""


@router.post("/performance-reviews")
def create_review(body: PerformanceCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    review = PerformanceReview(**body.model_dump(), reviewer_id=current_user.id)
    db.add(review)
    db.commit()
    return {"id": review.id, "overall_score": review.overall_score}


@router.get("/performance-reviews")
def list_reviews(employee_id: Optional[int] = None, params: PaginationParams = Depends(), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(PerformanceReview)
    if employee_id:
        query = query.filter(PerformanceReview.employee_id == employee_id)
    return paginate(query.order_by(PerformanceReview.created_at.desc()), params)


# ── Training ─────────────────────────────────────────────────────────────────

class TrainingCreate(BaseModel):
    title: str
    description: str = ""
    provider: str = ""
    training_type: str = "internal"
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    cost: float = 0


@router.post("/trainings")
def create_training(body: TrainingCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    training = Training(**body.model_dump())
    db.add(training)
    db.commit()
    return {"id": training.id, "title": training.title}


@router.get("/trainings")
def list_trainings(params: PaginationParams = Depends(), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return paginate(db.query(Training).order_by(Training.start_date.desc()), params)


# ── Timesheets ───────────────────────────────────────────────────────────────

class TimesheetCreate(BaseModel):
    employee_id: int
    project_id: Optional[int] = None
    date: date
    hours: float
    description: str = ""
    activity_type: str = "office"


@router.post("/timesheets")
def create_timesheet(body: TimesheetCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ts = Timesheet(**body.model_dump())
    db.add(ts)
    db.commit()
    return {"id": ts.id, "hours": ts.hours}


@router.get("/timesheets")
def list_timesheets(
    employee_id: Optional[int] = None,
    project_id: Optional[int] = None,
    params: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Timesheet)
    if employee_id:
        query = query.filter(Timesheet.employee_id == employee_id)
    if project_id:
        query = query.filter(Timesheet.project_id == project_id)
    return paginate(query.order_by(Timesheet.date.desc()), params)


# ── Staff Safety ─────────────────────────────────────────────────────────────

class CheckInCreate(BaseModel):
    employee_id: int
    check_type: str = "check_in"
    location: str = ""
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_safe: bool = True
    notes: str = ""


@router.post("/safety/check-in")
def safety_check_in(body: CheckInCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    checkin = StaffSafetyCheckIn(**body.model_dump())
    db.add(checkin)
    db.commit()
    return {"id": checkin.id, "check_type": checkin.check_type, "is_safe": checkin.is_safe}


@router.get("/safety/checkins")
def list_safety_checkins(
    params: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(StaffSafetyCheckIn).order_by(StaffSafetyCheckIn.created_at.desc())
    return paginate(query, params)


@router.get("/safety/status")
def safety_status(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from app.models.hr import Employee
    total = db.query(Employee).count()
    checked_in = db.query(func.count(func.distinct(StaffSafetyCheckIn.employee_id))).filter(
        StaffSafetyCheckIn.check_type == "check_in"
    ).scalar()
    return {"total_staff": total, "checked_in": checked_in or 0, "not_checked_in": total - (checked_in or 0)}


# ── Contracts ────────────────────────────────────────────────────────────────

class ContractCreate(BaseModel):
    employee_id: int
    contract_type: str = "fixed_term"
    start_date: date
    end_date: Optional[date] = None
    salary: float = 0
    position: str = ""
    department: str = ""


@router.post("/contracts")
def create_contract(body: ContractCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    contract = EmployeeContract(**body.model_dump())
    db.add(contract)
    db.commit()
    return {"id": contract.id, "position": contract.position}


@router.get("/contracts")
def list_contracts(
    employee_id: Optional[int] = None,
    status: Optional[str] = None,
    params: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(EmployeeContract)
    if employee_id:
        query = query.filter(EmployeeContract.employee_id == employee_id)
    if status:
        query = query.filter(EmployeeContract.status == status)
    return paginate(query.order_by(EmployeeContract.start_date.desc()), params)
