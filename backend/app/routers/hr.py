from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from app.database import get_db
from app.models import Employee, LeaveRequest, Attendance, User
from app.schemas import EmployeeCreate, EmployeeUpdate, EmployeeOut, LeaveCreate, LeaveOut
from app.auth import get_current_user

router = APIRouter(prefix="/hr", tags=["الموارد البشرية"])


# Employees
@router.get("/employees", response_model=List[EmployeeOut])
def list_employees(
    skip: int = 0, limit: int = 50,
    department: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Employee)
    if department:
        query = query.filter(Employee.department == department)
    if status:
        query = query.filter(Employee.status == status)
    return query.order_by(Employee.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/employees/stats")
def employee_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    total = db.query(Employee).count()
    active = db.query(Employee).filter(Employee.status == "active").count()
    by_dept = db.query(Employee.department, func.count(Employee.id)).group_by(Employee.department).all()
    by_gender = db.query(Employee.gender, func.count(Employee.id)).group_by(Employee.gender).all()
    total_salary = db.query(func.sum(Employee.salary)).filter(Employee.status == "active").scalar() or 0
    return {
        "total": total,
        "active": active,
        "total_salary": total_salary,
        "by_department": [{"department": d or "غير محدد", "count": c} for d, c in by_dept],
        "by_gender": [{"gender": g or "غير محدد", "count": c} for g, c in by_gender if g],
    }


@router.get("/employees/{employee_id}", response_model=EmployeeOut)
def get_employee(employee_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    e = db.query(Employee).filter(Employee.id == employee_id).first()
    if not e:
        raise HTTPException(status_code=404, detail="الموظف غير موجود")
    return e


@router.post("/employees", response_model=EmployeeOut)
def create_employee(data: EmployeeCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if db.query(Employee).filter(Employee.employee_id == data.employee_id).first():
        raise HTTPException(status_code=400, detail="رقم الموظف موجود بالفعل")
    e = Employee(**data.model_dump())
    db.add(e)
    db.commit()
    db.refresh(e)
    return e


@router.put("/employees/{employee_id}", response_model=EmployeeOut)
def update_employee(employee_id: int, data: EmployeeUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    e = db.query(Employee).filter(Employee.id == employee_id).first()
    if not e:
        raise HTTPException(status_code=404, detail="الموظف غير موجود")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(e, key, value)
    db.commit()
    db.refresh(e)
    return e


@router.delete("/employees/{employee_id}")
def delete_employee(employee_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    e = db.query(Employee).filter(Employee.id == employee_id).first()
    if not e:
        raise HTTPException(status_code=404, detail="الموظف غير موجود")
    db.delete(e)
    db.commit()
    return {"message": "تم حذف الموظف بنجاح"}


# Leave Requests
@router.get("/leaves", response_model=List[LeaveOut])
def list_leaves(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(LeaveRequest)
    if status:
        query = query.filter(LeaveRequest.status == status)
    return query.order_by(LeaveRequest.created_at.desc()).all()


@router.post("/leaves", response_model=LeaveOut)
def create_leave(data: LeaveCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    days = (data.end_date - data.start_date).days + 1
    leave = LeaveRequest(**data.model_dump(), days=days)
    db.add(leave)
    db.commit()
    db.refresh(leave)
    return leave


@router.put("/leaves/{leave_id}/approve")
def approve_leave(leave_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    leave = db.query(LeaveRequest).filter(LeaveRequest.id == leave_id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="طلب الإجازة غير موجود")
    leave.status = "approved"
    leave.approved_by = current_user.id
    db.commit()
    return {"message": "تم قبول طلب الإجازة"}


@router.put("/leaves/{leave_id}/reject")
def reject_leave(leave_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    leave = db.query(LeaveRequest).filter(LeaveRequest.id == leave_id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="طلب الإجازة غير موجود")
    leave.status = "rejected"
    leave.approved_by = current_user.id
    db.commit()
    return {"message": "تم رفض طلب الإجازة"}
