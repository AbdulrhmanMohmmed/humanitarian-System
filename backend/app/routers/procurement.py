from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.procurement import Vendor, PurchaseRequest, Quote, PurchaseOrder
from app.models.user import User
from app.models.enums import ProcurementStatus, PurchaseOrderStatus
from app.schemas.procurement import (
    VendorCreate, VendorUpdate, VendorOut,
    PurchaseRequestCreate, PurchaseRequestUpdate, PurchaseRequestOut,
    QuoteCreate, QuoteOut,
    PurchaseOrderCreate, PurchaseOrderOut
)
from app.auth import get_current_user
import uuid

router = APIRouter(prefix="/procurement", tags=["Procurement & Supply Chain"])

# ── Vendors ──────────────────────────────────────────────────────────────────

@router.get("/vendors", response_model=List[VendorOut])
def list_vendors(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Vendor).all()

@router.post("/vendors", response_model=VendorOut)
def create_vendor(vendor: VendorCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_vendor = Vendor(**vendor.model_dump())
    db.add(db_vendor)
    db.commit()
    db.refresh(db_vendor)
    return db_vendor

# ── Purchase Requests ────────────────────────────────────────────────────────

@router.get("/requests", response_model=List[PurchaseRequestOut])
def list_requests(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(PurchaseRequest).all()

@router.post("/requests", response_model=PurchaseRequestOut)
def create_request(request: PurchaseRequestCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    request_number = f"PR-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:4].upper()}"
    db_request = PurchaseRequest(
        **request.model_dump(),
        request_number=request_number,
        requested_by_id=current_user.id,
        status=ProcurementStatus.DRAFT
    )
    db.add(db_request)
    db.commit()
    db.refresh(db_request)
    return db_request

@router.patch("/requests/{request_id}/status")
def update_request_status(request_id: int, status: ProcurementStatus, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_request = db.query(PurchaseRequest).filter(PurchaseRequest.id == request_id).first()
    if not db_request:
        raise HTTPException(status_code=404, detail="Request not found")
    db_request.status = status
    db.commit()
    return {"message": "Status updated", "status": status}

# ── Quotes ───────────────────────────────────────────────────────────────────

@router.post("/quotes", response_model=QuoteOut)
def submit_quote(quote: QuoteCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_quote = Quote(**quote.model_dump())
    db.add(db_quote)
    db.commit()
    db.refresh(db_quote)
    return db_quote

@router.post("/quotes/{quote_id}/award")
def award_quote(quote_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_quote = db.query(Quote).filter(Quote.id == quote_id).first()
    if not db_quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    
    # Reset other quotes for this request
    db.query(Quote).filter(Quote.purchase_request_id == db_quote.purchase_request_id).update({"is_winner": 0})
    
    db_quote.is_winner = 1
    db_quote.purchase_request.status = ProcurementStatus.AWARDED
    
    # Automatically generate PO
    po_number = f"PO-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:4].upper()}"
    db_po = PurchaseOrder(
        po_number=po_number,
        purchase_request_id=db_quote.purchase_request_id,
        vendor_id=db_quote.vendor_id,
        total_amount=db_quote.amount,
        currency=db_quote.currency,
        status=PurchaseOrderStatus.DRAFT
    )
    db.add(db_po)
    db.commit()
    return {"message": "Quote awarded and PO generated", "po_number": po_number}

# ── Purchase Orders ──────────────────────────────────────────────────────────

@router.get("/pos", response_model=List[PurchaseOrderOut])
def list_pos(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(PurchaseOrder).all()

from datetime import datetime
