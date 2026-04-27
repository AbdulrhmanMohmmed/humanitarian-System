from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from app.database import get_db
from app.models import Beneficiary, User
from app.schemas import BeneficiaryCreate, BeneficiaryUpdate, BeneficiaryOut
from app.auth import get_current_user

router = APIRouter(prefix="/api/beneficiaries", tags=["المستفيدين"])


@router.get("/", response_model=List[BeneficiaryOut])
def list_beneficiaries(
    skip: int = 0,
    limit: int = 50,
    search: Optional[str] = None,
    governorate: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
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
def count_beneficiaries(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return {"count": db.query(Beneficiary).count()}


@router.get("/by-governorate")
def beneficiaries_by_governorate(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from sqlalchemy import func
    results = db.query(
        Beneficiary.governorate, func.count(Beneficiary.id)
    ).group_by(Beneficiary.governorate).all()
    return [{"governorate": g or "غير محدد", "count": c} for g, c in results]


@router.get("/{beneficiary_id}", response_model=BeneficiaryOut)
def get_beneficiary(beneficiary_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    b = db.query(Beneficiary).filter(Beneficiary.id == beneficiary_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="المستفيد غير موجود")
    return b


@router.post("/", response_model=BeneficiaryOut)
def create_beneficiary(data: BeneficiaryCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if data.national_id:
        existing = db.query(Beneficiary).filter(Beneficiary.national_id == data.national_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="رقم الهوية مسجل بالفعل - احتمال ازدواجية")
    b = Beneficiary(**data.model_dump(), registered_by=current_user.id)
    db.add(b)
    db.commit()
    db.refresh(b)
    return b


@router.put("/{beneficiary_id}", response_model=BeneficiaryOut)
def update_beneficiary(beneficiary_id: int, data: BeneficiaryUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    b = db.query(Beneficiary).filter(Beneficiary.id == beneficiary_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="المستفيد غير موجود")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(b, key, value)
    db.commit()
    db.refresh(b)
    return b


@router.delete("/{beneficiary_id}")
def delete_beneficiary(beneficiary_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    b = db.query(Beneficiary).filter(Beneficiary.id == beneficiary_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="المستفيد غير موجود")
    db.delete(b)
    db.commit()
    return {"message": "تم حذف المستفيد بنجاح"}


@router.post("/check-duplicate")
def check_duplicate(national_id: str = Query(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing = db.query(Beneficiary).filter(Beneficiary.national_id == national_id).first()
    if existing:
        return {"duplicate": True, "beneficiary": BeneficiaryOut.model_validate(existing)}
    return {"duplicate": False}
