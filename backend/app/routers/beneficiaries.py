from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from datetime import date
from app.database import get_db
from app.models import Beneficiary, User
from app.models.enums import Gender
from app.schemas import BeneficiaryCreate, BeneficiaryUpdate, BeneficiaryOut
from app.permissions import Permission, require_permission
from app.routers.audit import log_audit
from app.models import AuditAction
import csv
import io
from difflib import SequenceMatcher

def calculate_vulnerability_score(data: BeneficiaryCreate | BeneficiaryUpdate) -> float:
    score = 0.0
    if getattr(data, "has_disability", False):
        score += 30.0
    if getattr(data, "household_size", 1) > 5:
        score += 20.0
    if getattr(data, "gender", None) == Gender.FEMALE and getattr(data, "head_of_household", False):
        score += 25.0
    if getattr(data, "date_of_birth", None):
        age = (date.today() - data.date_of_birth).days / 365
        if age > 60:
            score += 20.0
    return min(score, 100.0)

router = APIRouter(prefix="/api/beneficiaries", tags=["المستفيدين"])


@router.get("/", response_model=List[BeneficiaryOut])
def list_beneficiaries(
    skip: int = 0,
    limit: int = 50,
    search: Optional[str] = None,
    governorate: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.BENEFICIARIES_READ)),
):
    query = db.query(Beneficiary)
    if search:
        query = query.filter(
            or_(
                Beneficiary.first_name.contains(search),
                Beneficiary.last_name.contains(search),
                Beneficiary.national_id.contains(search),
                Beneficiary.phone.contains(search),
            )
        )
    if governorate:
        query = query.filter(Beneficiary.governorate == governorate)
    if status:
        query = query.filter(Beneficiary.status == status)
    return query.order_by(Beneficiary.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/count")
def count_beneficiaries(db: Session = Depends(get_db), current_user: User = Depends(require_permission(Permission.BENEFICIARIES_READ))):
    return {"count": db.query(Beneficiary).count()}


@router.get("/by-governorate")
def beneficiaries_by_governorate(db: Session = Depends(get_db), current_user: User = Depends(require_permission(Permission.BENEFICIARIES_READ))):
    from sqlalchemy import func
    results = db.query(
        Beneficiary.governorate, func.count(Beneficiary.id)
    ).group_by(Beneficiary.governorate).all()
    return [{"governorate": g or "غير محدد", "count": c} for g, c in results]


@router.get("/{beneficiary_id}", response_model=BeneficiaryOut)
def get_beneficiary(beneficiary_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_permission(Permission.BENEFICIARIES_READ))):
    b = db.query(Beneficiary).filter(Beneficiary.id == beneficiary_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="المستفيد غير موجود")
    return b


@router.post("/", response_model=BeneficiaryOut)
def create_beneficiary(data: BeneficiaryCreate, db: Session = Depends(get_db), current_user: User = Depends(require_permission(Permission.BENEFICIARIES_WRITE))):
    if data.national_id:
        existing = db.query(Beneficiary).filter(Beneficiary.national_id == data.national_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="رقم الهوية مسجل بالفعل - احتمال ازدواجية")
            
    # AI Advisor: Auto calculate vulnerability if not set
    if data.vulnerability_score == 0:
        data.vulnerability_score = calculate_vulnerability_score(data)
        
    b = Beneficiary(**data.model_dump(), registered_by=current_user.id)
    db.add(b)
    db.commit()
    db.refresh(b)
    log_audit(db, current_user.id, AuditAction.CREATE, "beneficiary", b.id, details="Beneficiary created")
    return b


@router.put("/{beneficiary_id}", response_model=BeneficiaryOut)
def update_beneficiary(
    beneficiary_id: int,
    data: BeneficiaryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.BENEFICIARIES_WRITE)),
):
    b = db.query(Beneficiary).filter(Beneficiary.id == beneficiary_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="المستفيد غير موجود")
    changed_fields = list(data.model_dump(exclude_unset=True).keys())
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(b, key, value)
    db.commit()
    db.refresh(b)
    log_audit(
        db,
        current_user.id,
        AuditAction.UPDATE,
        "beneficiary",
        b.id,
        details=f"Beneficiary updated: {', '.join(changed_fields)}",
    )
    return b


@router.delete("/{beneficiary_id}")
def delete_beneficiary(
    beneficiary_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.BENEFICIARIES_DELETE)),
):
    b = db.query(Beneficiary).filter(Beneficiary.id == beneficiary_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="المستفيد غير موجود")
    db.delete(b)
    db.commit()
    log_audit(db, current_user.id, AuditAction.DELETE, "beneficiary", beneficiary_id, details="Beneficiary deleted")
    return {"message": "تم حذف المستفيد بنجاح"}


@router.post("/check-duplicate")
def check_duplicate(
    national_id: Optional[str] = Query(None),
    first_name: Optional[str] = Query(None),
    last_name: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.BENEFICIARIES_READ)),
):
    if national_id:
        existing = db.query(Beneficiary).filter(Beneficiary.national_id == national_id).first()
        if existing:
            return {"duplicate": True, "confidence": 100, "beneficiary": BeneficiaryOut.model_validate(existing)}
            
    if first_name and last_name:
        # AI Advisor: Fuzzy matching duplicate detection
        all_bens = db.query(Beneficiary).all()
        best_match = None
        highest_ratio = 0.0
        
        target_name = f"{first_name} {last_name}".lower()
        for b in all_bens:
            full_name = f"{b.first_name} {b.last_name}".lower()
            ratio = SequenceMatcher(None, target_name, full_name).ratio()
            if ratio > highest_ratio:
                highest_ratio = ratio
                best_match = b
                
        if highest_ratio > 0.85: # 85% match confidence threshold
            return {"duplicate": True, "confidence": round(highest_ratio * 100), "beneficiary": BeneficiaryOut.model_validate(best_match)}
            
    return {"duplicate": False, "confidence": 0}

@router.get("/export/hxl")
def export_beneficiaries_hxl(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.BENEFICIARIES_READ)),
):
    # OCHA Data Standards: HXL Export implementation
    beneficiaries = db.query(Beneficiary).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Normal headers
    writer.writerow(["ID", "First Name", "Last Name", "Gender", "Date of Birth", "Phone", "Governorate", "District", "Household Size", "Vulnerability Score", "Has Disability"])
    # HXL tags
    writer.writerow(["#beneficiary+id", "#name+first", "#name+last", "#sex", "#date+dob", "#contact+phone", "#adm1+name", "#adm2+name", "#population+hh", "#indicator+vulnerability", "#indicator+disability"])
    
    for b in beneficiaries:
        writer.writerow([
            b.id, b.first_name, b.last_name, 
            b.gender.value if b.gender else "", 
            b.date_of_birth, b.phone, 
            b.governorate, b.district, 
            b.household_size, b.vulnerability_score,
            "Yes" if b.has_disability else "No"
        ])
    
    headers = {
        "Content-Disposition": "attachment; filename=beneficiaries_hxl.csv"
    }
    return Response(content=output.getvalue(), media_type="text/csv", headers=headers)
