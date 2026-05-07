from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.database import get_db
from app.models.hr import Employee, Payroll, Payslip
from app.models.user import User
from app.auth import get_current_user

router = APIRouter(prefix="/hr/payroll", tags=["Payroll"])

@router.get("/payrolls")
def list_payrolls(db: Session = Depends(get_db)):
    return db.query(Payroll).order_by(Payroll.year.desc(), Payroll.month.desc()).all()

@router.post("/generate/{year}/{month}")
def generate_payroll(year: int, month: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Check if exists
    existing = db.query(Payroll).filter(Payroll.year == year, Payroll.month == month).first()
    if existing:
        raise HTTPException(status_code=400, detail="Payroll already exists for this period")
    
    employees = db.query(Employee).filter(Employee.status == "active").all()
    
    payroll = Payroll(
        year=year,
        month=month,
        status="draft",
        total_gross=0,
        total_net=0
    )
    db.add(payroll)
    db.commit()
    db.refresh(payroll)
    
    t_gross = 0
    t_net = 0
    
    for emp in employees:
        # Mock allowances/deductions for demo
        allowance = emp.salary * 0.1
        deduction = emp.salary * 0.05
        net = emp.salary + allowance - deduction
        
        payslip = Payslip(
            payroll_id=payroll.id,
            employee_id=emp.id,
            base_salary=emp.salary,
            allowances=allowance,
            deductions=deduction,
            net_salary=net,
            payment_status="unpaid"
        )
        db.add(payslip)
        t_gross += emp.salary
        t_net += net
        
    payroll.total_gross = t_gross
    payroll.total_net = t_net
    db.commit()
    
    return {"message": f"Payroll generated for {len(employees)} employees", "payroll_id": payroll.id}

@router.get("/{payroll_id}/payslips")
def get_payslips(payroll_id: int, db: Session = Depends(get_db)):
    return db.query(Payslip).filter(Payslip.payroll_id == payroll_id).all()
