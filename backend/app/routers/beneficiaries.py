from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import Beneficiary, User
from app.schemas import BeneficiaryCreate, BeneficiaryUpdate, BeneficiaryOut
from app.permissions import Permission, require_permission
from app.services import beneficiary_service as svc
import csv
import io

router = APIRouter(prefix="/beneficiaries", tags=["المستفيدين"])


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
    return svc.list_beneficiaries(
        db, skip=skip, limit=limit, search=search,
        governorate=governorate, status=status,
    )


@router.get("/count")
def count_beneficiaries(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.BENEFICIARIES_READ)),
):
    return {"count": svc.count_beneficiaries(db)}


@router.get("/by-governorate")
def beneficiaries_by_governorate(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.BENEFICIARIES_READ)),
):
    return svc.get_by_governorate(db)


@router.get("/{beneficiary_id}", response_model=BeneficiaryOut)
def get_beneficiary(
    beneficiary_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.BENEFICIARIES_READ)),
):
    return svc.get_beneficiary(db, beneficiary_id)


@router.post("/", response_model=BeneficiaryOut)
def create_beneficiary(
    data: BeneficiaryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.BENEFICIARIES_WRITE)),
):
    return svc.create_beneficiary(db, data, current_user.id)


@router.put("/{beneficiary_id}", response_model=BeneficiaryOut)
def update_beneficiary(
    beneficiary_id: int,
    data: BeneficiaryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.BENEFICIARIES_WRITE)),
):
    return svc.update_beneficiary(db, beneficiary_id, data, current_user.id)


@router.delete("/{beneficiary_id}")
def delete_beneficiary(
    beneficiary_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.BENEFICIARIES_DELETE)),
):
    svc.delete_beneficiary(db, beneficiary_id, current_user.id)
    return {"message": "تم حذف المستفيد بنجاح"}


@router.post("/check-duplicate")
def check_duplicate(
    national_id: Optional[str] = Query(None),
    first_name: Optional[str] = Query(None),
    last_name: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.BENEFICIARIES_READ)),
):
    matches = svc.check_duplicate(db, first_name or "", last_name or "", national_id)
    if matches:
        return {"duplicate": True, "confidence": int(matches[0]["similarity"] * 100), "matches": matches}
    return {"duplicate": False, "confidence": 0}


@router.get("/export/hxl")
def export_beneficiaries_hxl(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.BENEFICIARIES_READ)),
):
    beneficiaries = db.query(Beneficiary).all()

    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow([
        "ID", "First Name", "Last Name", "Gender", "Date of Birth",
        "Phone", "Governorate", "District", "Household Size",
        "Vulnerability Score", "Has Disability",
    ])
    writer.writerow([
        "#beneficiary+id", "#name+first", "#name+last", "#sex", "#date+dob",
        "#contact+phone", "#adm1+name", "#adm2+name", "#population+hh",
        "#indicator+vulnerability", "#indicator+disability",
    ])

    for b in beneficiaries:
        writer.writerow([
            b.id, b.first_name, b.last_name,
            b.gender.value if b.gender else "",
            b.date_of_birth, b.phone,
            b.governorate, b.district,
            b.household_size, b.vulnerability_score,
            "Yes" if b.has_disability else "No",
        ])

    headers = {"Content-Disposition": "attachment; filename=beneficiaries_hxl.csv"}
    return Response(content=output.getvalue(), media_type="text/csv", headers=headers)
