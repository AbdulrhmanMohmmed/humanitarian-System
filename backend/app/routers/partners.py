from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.partners import Partner, SubGrant

router = APIRouter(prefix="/partners", tags=["Partnerships"])

@router.get("/")
def list_partners(db: Session = Depends(get_db)):
    return db.query(Partner).all()

@router.post("/")
def create_partner(data: dict, db: Session = Depends(get_db)):
    partner = Partner(**data)
    db.add(partner)
    db.commit()
    return partner

@router.get("/subgrants")
def list_subgrants(db: Session = Depends(get_db)):
    return db.query(SubGrant).all()
