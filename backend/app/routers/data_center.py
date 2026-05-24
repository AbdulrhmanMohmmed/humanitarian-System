from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import Optional
from datetime import datetime, timedelta
from app.database import get_db
from app.auth import get_current_user
from app.models.data_center import (
    OrgPolicy, ContactDirectory, OrgResource, LegalDocument,
    DonorProfile, CountryProfile, SectorReference, EmergencyContact, CurrencyRate,
    PolicyCategory, ContactType, ResourceType, LegalDocType,
)
from pydantic import BaseModel, Field

router = APIRouter(prefix="/data-center", tags=["Data Center"])


# ── Schemas ──────────────────────────────────────────────────────────────────

class PolicyCreate(BaseModel):
    title: str
    category: str = "operations"
    version: str = "1.0"
    content: Optional[str] = None
    summary: Optional[str] = None
    approved_by: Optional[str] = None
    is_active: bool = True

class ContactCreate(BaseModel):
    name: str
    organization: Optional[str] = None
    contact_type: str = "partner"
    title: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    notes: Optional[str] = None

class ResourceCreate(BaseModel):
    title: str
    resource_type: str = "template"
    category: Optional[str] = None
    description: Optional[str] = None
    content: Optional[str] = None
    language: str = "ar"
    version: str = "1.0"

class LegalDocCreate(BaseModel):
    title: str
    doc_type: str = "contract"
    party_name: Optional[str] = None
    reference_number: Optional[str] = None
    value: float = 0
    currency: str = "USD"
    notes: Optional[str] = None
    reminder_days: int = 30

class DonorProfileCreate(BaseModel):
    name: str
    acronym: Optional[str] = None
    donor_type: Optional[str] = None
    country: Optional[str] = None
    website: Optional[str] = None
    focal_point: Optional[str] = None
    email: Optional[str] = None
    funding_sectors: list = []
    funding_range_min: float = 0
    funding_range_max: float = 0
    reporting_requirements: Optional[str] = None
    application_process: Optional[str] = None

class CountryProfileCreate(BaseModel):
    name: str
    iso_code: Optional[str] = None
    region: Optional[str] = None
    capital: Optional[str] = None
    population: int = 0
    currency: Optional[str] = None
    languages: list = []
    humanitarian_needs: Optional[str] = None
    crisis_level: Optional[str] = None
    people_in_need: int = 0
    people_targeted: int = 0
    funding_required: float = 0
    funding_received: float = 0

class SectorRefCreate(BaseModel):
    name: str
    cluster: Optional[str] = None
    lead_agency: Optional[str] = None
    description: Optional[str] = None
    standards: list = []
    key_indicators: list = []
    min_standards: Optional[str] = None
    guidelines_url: Optional[str] = None

class EmergencyContactCreate(BaseModel):
    name: str
    role: Optional[str] = None
    organization: Optional[str] = None
    phone: str
    email: Optional[str] = None
    location: Optional[str] = None
    priority: int = 1
    available_24h: bool = False

class CurrencyRateCreate(BaseModel):
    from_currency: str
    to_currency: str
    rate: float
    source: Optional[str] = None


# ── Dashboard ────────────────────────────────────────────────────────────────

@router.get("/dashboard")
def data_center_dashboard(db: Session = Depends(get_db), user=Depends(get_current_user)):
    now = datetime.utcnow()
    expiring_soon = db.query(func.count(LegalDocument.id)).filter(
        LegalDocument.end_date != None,
        LegalDocument.end_date <= now + timedelta(days=30),
        LegalDocument.end_date >= now,
    ).scalar()

    return {
        "policies": db.query(func.count(OrgPolicy.id)).scalar(),
        "active_policies": db.query(func.count(OrgPolicy.id)).filter(OrgPolicy.is_active == True).scalar(),
        "contacts": db.query(func.count(ContactDirectory.id)).scalar(),
        "resources": db.query(func.count(OrgResource.id)).scalar(),
        "legal_documents": db.query(func.count(LegalDocument.id)).scalar(),
        "expiring_documents": expiring_soon,
        "donor_profiles": db.query(func.count(DonorProfile.id)).scalar(),
        "country_profiles": db.query(func.count(CountryProfile.id)).scalar(),
        "sectors": db.query(func.count(SectorReference.id)).scalar(),
        "emergency_contacts": db.query(func.count(EmergencyContact.id)).scalar(),
        "currency_rates": db.query(func.count(CurrencyRate.id)).scalar(),
    }


# ── Policies CRUD ────────────────────────────────────────────────────────────

@router.get("/policies")
def list_policies(
    category: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    q = db.query(OrgPolicy)
    if category:
        q = q.filter(OrgPolicy.category == category)
    if search:
        q = q.filter(or_(OrgPolicy.title.ilike(f"%{search}%"), OrgPolicy.summary.ilike(f"%{search}%")))
    total = q.count()
    items = q.order_by(OrgPolicy.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {"items": [_policy_dict(p) for p in items], "total": total, "page": page}


@router.post("/policies")
def create_policy(data: PolicyCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    p = OrgPolicy(**data.model_dump())
    db.add(p)
    db.commit()
    db.refresh(p)
    return _policy_dict(p)


@router.get("/policies/{pid}")
def get_policy(pid: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    p = db.query(OrgPolicy).filter(OrgPolicy.id == pid).first()
    if not p:
        raise HTTPException(404, "Policy not found")
    return _policy_dict(p)


@router.put("/policies/{pid}")
def update_policy(pid: int, data: PolicyCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    p = db.query(OrgPolicy).filter(OrgPolicy.id == pid).first()
    if not p:
        raise HTTPException(404, "Policy not found")
    for k, v in data.model_dump().items():
        setattr(p, k, v)
    p.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(p)
    return _policy_dict(p)


@router.delete("/policies/{pid}")
def delete_policy(pid: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    p = db.query(OrgPolicy).filter(OrgPolicy.id == pid).first()
    if not p:
        raise HTTPException(404, "Policy not found")
    db.delete(p)
    db.commit()
    return {"ok": True}


def _policy_dict(p):
    return {
        "id": p.id, "title": p.title, "category": p.category.value if p.category else None,
        "version": p.version, "summary": p.summary, "content": p.content,
        "approved_by": p.approved_by, "is_active": p.is_active,
        "effective_date": str(p.effective_date) if p.effective_date else None,
        "review_date": str(p.review_date) if p.review_date else None,
        "created_at": str(p.created_at) if p.created_at else None,
    }


# ── Contacts CRUD ────────────────────────────────────────────────────────────

@router.get("/contacts")
def list_contacts(
    contact_type: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    q = db.query(ContactDirectory)
    if contact_type:
        q = q.filter(ContactDirectory.contact_type == contact_type)
    if search:
        q = q.filter(or_(ContactDirectory.name.ilike(f"%{search}%"), ContactDirectory.organization.ilike(f"%{search}%")))
    total = q.count()
    items = q.order_by(ContactDirectory.name).offset((page - 1) * page_size).limit(page_size).all()
    return {"items": [_contact_dict(c) for c in items], "total": total, "page": page}


@router.post("/contacts")
def create_contact(data: ContactCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    c = ContactDirectory(**data.model_dump())
    db.add(c)
    db.commit()
    db.refresh(c)
    return _contact_dict(c)


@router.put("/contacts/{cid}")
def update_contact(cid: int, data: ContactCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    c = db.query(ContactDirectory).filter(ContactDirectory.id == cid).first()
    if not c:
        raise HTTPException(404, "Contact not found")
    for k, v in data.model_dump().items():
        setattr(c, k, v)
    db.commit()
    db.refresh(c)
    return _contact_dict(c)


@router.delete("/contacts/{cid}")
def delete_contact(cid: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    c = db.query(ContactDirectory).filter(ContactDirectory.id == cid).first()
    if not c:
        raise HTTPException(404, "Contact not found")
    db.delete(c)
    db.commit()
    return {"ok": True}


def _contact_dict(c):
    return {
        "id": c.id, "name": c.name, "organization": c.organization,
        "contact_type": c.contact_type.value if c.contact_type else None,
        "title": c.title, "email": c.email, "phone": c.phone,
        "city": c.city, "country": c.country, "notes": c.notes,
        "is_active": c.is_active, "created_at": str(c.created_at) if c.created_at else None,
    }


# ── Resources CRUD ───────────────────────────────────────────────────────────

@router.get("/resources")
def list_resources(
    resource_type: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    q = db.query(OrgResource)
    if resource_type:
        q = q.filter(OrgResource.resource_type == resource_type)
    if search:
        q = q.filter(or_(OrgResource.title.ilike(f"%{search}%"), OrgResource.description.ilike(f"%{search}%")))
    total = q.count()
    items = q.order_by(OrgResource.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {"items": [_resource_dict(r) for r in items], "total": total, "page": page}


@router.post("/resources")
def create_resource(data: ResourceCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    r = OrgResource(**data.model_dump())
    db.add(r)
    db.commit()
    db.refresh(r)
    return _resource_dict(r)


@router.delete("/resources/{rid}")
def delete_resource(rid: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    r = db.query(OrgResource).filter(OrgResource.id == rid).first()
    if not r:
        raise HTTPException(404, "Resource not found")
    db.delete(r)
    db.commit()
    return {"ok": True}


def _resource_dict(r):
    return {
        "id": r.id, "title": r.title, "resource_type": r.resource_type.value if r.resource_type else None,
        "category": r.category, "description": r.description, "language": r.language,
        "version": r.version, "download_count": r.download_count,
        "is_public": r.is_public, "tags": r.tags or [],
        "created_at": str(r.created_at) if r.created_at else None,
    }


# ── Legal Documents CRUD ─────────────────────────────────────────────────────

@router.get("/legal")
def list_legal_docs(
    doc_type: Optional[str] = None,
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    q = db.query(LegalDocument)
    if doc_type:
        q = q.filter(LegalDocument.doc_type == doc_type)
    if status:
        q = q.filter(LegalDocument.status == status)
    total = q.count()
    items = q.order_by(LegalDocument.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {"items": [_legal_dict(d) for d in items], "total": total, "page": page}


@router.post("/legal")
def create_legal_doc(data: LegalDocCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    d = LegalDocument(**data.model_dump())
    db.add(d)
    db.commit()
    db.refresh(d)
    return _legal_dict(d)


@router.delete("/legal/{did}")
def delete_legal_doc(did: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    d = db.query(LegalDocument).filter(LegalDocument.id == did).first()
    if not d:
        raise HTTPException(404, "Legal document not found")
    db.delete(d)
    db.commit()
    return {"ok": True}


def _legal_dict(d):
    return {
        "id": d.id, "title": d.title, "doc_type": d.doc_type.value if d.doc_type else None,
        "party_name": d.party_name, "reference_number": d.reference_number,
        "start_date": str(d.start_date) if d.start_date else None,
        "end_date": str(d.end_date) if d.end_date else None,
        "value": d.value, "currency": d.currency, "status": d.status,
        "reminder_days": d.reminder_days, "notes": d.notes,
        "created_at": str(d.created_at) if d.created_at else None,
    }


# ── Donor Profiles CRUD ─────────────────────────────────────────────────────

@router.get("/donors")
def list_donor_profiles(
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    q = db.query(DonorProfile)
    if search:
        q = q.filter(or_(DonorProfile.name.ilike(f"%{search}%"), DonorProfile.acronym.ilike(f"%{search}%")))
    total = q.count()
    items = q.order_by(DonorProfile.name).offset((page - 1) * page_size).limit(page_size).all()
    return {"items": [_donor_dict(d) for d in items], "total": total, "page": page}


@router.post("/donors")
def create_donor_profile(data: DonorProfileCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    d = DonorProfile(**data.model_dump())
    db.add(d)
    db.commit()
    db.refresh(d)
    return _donor_dict(d)


@router.delete("/donors/{did}")
def delete_donor_profile(did: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    d = db.query(DonorProfile).filter(DonorProfile.id == did).first()
    if not d:
        raise HTTPException(404, "Donor profile not found")
    db.delete(d)
    db.commit()
    return {"ok": True}


def _donor_dict(d):
    return {
        "id": d.id, "name": d.name, "acronym": d.acronym, "donor_type": d.donor_type,
        "country": d.country, "website": d.website, "focal_point": d.focal_point,
        "email": d.email, "funding_sectors": d.funding_sectors or [],
        "funding_range_min": d.funding_range_min, "funding_range_max": d.funding_range_max,
        "is_active": d.is_active, "created_at": str(d.created_at) if d.created_at else None,
    }


# ── Country Profiles CRUD ───────────────────────────────────────────────────

@router.get("/countries")
def list_country_profiles(
    region: Optional[str] = None,
    crisis_level: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    q = db.query(CountryProfile)
    if region:
        q = q.filter(CountryProfile.region == region)
    if crisis_level:
        q = q.filter(CountryProfile.crisis_level == crisis_level)
    total = q.count()
    items = q.order_by(CountryProfile.name).offset((page - 1) * page_size).limit(page_size).all()
    return {"items": [_country_dict(c) for c in items], "total": total, "page": page}


@router.post("/countries")
def create_country_profile(data: CountryProfileCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    c = CountryProfile(**data.model_dump())
    db.add(c)
    db.commit()
    db.refresh(c)
    return _country_dict(c)


@router.delete("/countries/{cid}")
def delete_country_profile(cid: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    c = db.query(CountryProfile).filter(CountryProfile.id == cid).first()
    if not c:
        raise HTTPException(404, "Country profile not found")
    db.delete(c)
    db.commit()
    return {"ok": True}


def _country_dict(c):
    return {
        "id": c.id, "name": c.name, "iso_code": c.iso_code, "region": c.region,
        "capital": c.capital, "population": c.population, "currency": c.currency,
        "languages": c.languages or [], "humanitarian_needs": c.humanitarian_needs,
        "crisis_level": c.crisis_level, "people_in_need": c.people_in_need,
        "people_targeted": c.people_targeted, "funding_required": c.funding_required,
        "funding_received": c.funding_received,
        "created_at": str(c.created_at) if c.created_at else None,
    }


# ── Sector References CRUD ──────────────────────────────────────────────────

@router.get("/sectors")
def list_sectors(
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    q = db.query(SectorReference)
    if search:
        q = q.filter(or_(SectorReference.name.ilike(f"%{search}%"), SectorReference.cluster.ilike(f"%{search}%")))
    items = q.order_by(SectorReference.name).all()
    return [_sector_dict(s) for s in items]


@router.post("/sectors")
def create_sector(data: SectorRefCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    s = SectorReference(**data.model_dump())
    db.add(s)
    db.commit()
    db.refresh(s)
    return _sector_dict(s)


def _sector_dict(s):
    return {
        "id": s.id, "name": s.name, "cluster": s.cluster, "lead_agency": s.lead_agency,
        "description": s.description, "standards": s.standards or [],
        "key_indicators": s.key_indicators or [], "min_standards": s.min_standards,
        "guidelines_url": s.guidelines_url, "is_active": s.is_active,
    }


# ── Emergency Contacts CRUD ─────────────────────────────────────────────────

@router.get("/emergency-contacts")
def list_emergency_contacts(db: Session = Depends(get_db), user=Depends(get_current_user)):
    items = db.query(EmergencyContact).filter(EmergencyContact.is_active == True).order_by(EmergencyContact.priority).all()
    return [_emg_dict(e) for e in items]


@router.post("/emergency-contacts")
def create_emergency_contact(data: EmergencyContactCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    e = EmergencyContact(**data.model_dump())
    db.add(e)
    db.commit()
    db.refresh(e)
    return _emg_dict(e)


@router.delete("/emergency-contacts/{eid}")
def delete_emergency_contact(eid: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    e = db.query(EmergencyContact).filter(EmergencyContact.id == eid).first()
    if not e:
        raise HTTPException(404, "Emergency contact not found")
    db.delete(e)
    db.commit()
    return {"ok": True}


def _emg_dict(e):
    return {
        "id": e.id, "name": e.name, "role": e.role, "organization": e.organization,
        "phone": e.phone, "phone2": e.phone2, "email": e.email,
        "location": e.location, "priority": e.priority,
        "available_24h": e.available_24h, "is_active": e.is_active,
    }


# ── Currency Rates CRUD ─────────────────────────────────────────────────────

@router.get("/currency-rates")
def list_currency_rates(db: Session = Depends(get_db), user=Depends(get_current_user)):
    items = db.query(CurrencyRate).order_by(CurrencyRate.effective_date.desc()).limit(100).all()
    return [_rate_dict(r) for r in items]


@router.post("/currency-rates")
def create_currency_rate(data: CurrencyRateCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    r = CurrencyRate(**data.model_dump())
    db.add(r)
    db.commit()
    db.refresh(r)
    return _rate_dict(r)


def _rate_dict(r):
    return {
        "id": r.id, "from_currency": r.from_currency, "to_currency": r.to_currency,
        "rate": r.rate, "source": r.source,
        "effective_date": str(r.effective_date) if r.effective_date else None,
    }
