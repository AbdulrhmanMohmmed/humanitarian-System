from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import Optional
from datetime import datetime, timedelta, timezone
from app.database import get_db
from app.auth import get_current_user
from app.models.data_center import (
    OrgPolicy, ContactDirectory, OrgResource, LegalDocument,
    DonorProfile, CountryProfile, SectorReference, EmergencyContact, CurrencyRate,
    PolicyCategory, ContactType, ResourceType, LegalDocType,
    PopulationRecord, PopulationCategory, GenderGroup, AgeGroup,
    CampSiteProfile, CampStatus,
    MarketStudy, CommodityPrice, MEBBasket,
    NeedsAssessmentRecord, SeverityLevel,
    SectorFacility, FacilityType, FacilityStatus,
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
    now = datetime.now(timezone.utc)
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
        "population_records": db.query(func.count(PopulationRecord.id)).scalar(),
        "camp_sites": db.query(func.count(CampSiteProfile.id)).scalar(),
        "market_studies": db.query(func.count(MarketStudy.id)).scalar(),
        "commodity_prices": db.query(func.count(CommodityPrice.id)).scalar(),
        "meb_baskets": db.query(func.count(MEBBasket.id)).scalar(),
        "needs_assessments": db.query(func.count(NeedsAssessmentRecord.id)).scalar(),
        "sector_facilities": db.query(func.count(SectorFacility.id)).scalar(),
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
    p.updated_at = datetime.now(timezone.utc)
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


# ── Schemas for new sections ─────────────────────────────────────────────────

class PopulationCreate(BaseModel):
    governorate: str
    district: Optional[str] = None
    sub_district: Optional[str] = None
    category: str
    gender: str = "total"
    age_group: str = "total"
    count: int = 0
    year: int = 2026
    quarter: Optional[int] = None
    source: Optional[str] = None
    methodology: Optional[str] = None
    confidence_level: Optional[str] = None
    notes: Optional[str] = None

class CampSiteCreate(BaseModel):
    name: str
    site_id: Optional[str] = None
    camp_type: Optional[str] = None
    status: str = "active"
    governorate: Optional[str] = None
    district: Optional[str] = None
    sub_district: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    capacity: int = 0
    current_population: int = 0
    households: int = 0
    managed_by: Optional[str] = None
    land_ownership: Optional[str] = None
    shelter_types: list = []
    available_services: list = []
    water_source: Optional[str] = None
    electricity_available: bool = False
    health_facility_nearby: bool = False
    school_nearby: bool = False
    notes: Optional[str] = None

class MarketStudyCreate(BaseModel):
    title: str
    study_type: Optional[str] = None
    governorate: Optional[str] = None
    district: Optional[str] = None
    market_name: Optional[str] = None
    market_functionality: Optional[str] = None
    main_commodities: list = []
    supply_chain_status: Optional[str] = None
    price_trends: Optional[str] = None
    recommendations: Optional[str] = None
    methodology: Optional[str] = None
    sample_size: int = 0
    conducted_by: Optional[str] = None
    notes: Optional[str] = None

class CommodityPriceCreate(BaseModel):
    commodity_name: str
    commodity_category: Optional[str] = None
    unit: str
    price: float
    currency: str = "YER"
    governorate: Optional[str] = None
    district: Optional[str] = None
    market_name: Optional[str] = None
    price_previous: Optional[float] = None
    price_change_pct: Optional[float] = None
    source: Optional[str] = None
    is_meb_item: bool = False
    notes: Optional[str] = None

class MEBBasketCreate(BaseModel):
    name: str
    basket_type: Optional[str] = None
    governorate: Optional[str] = None
    district: Optional[str] = None
    total_cost: float = 0
    currency: str = "YER"
    household_size: int = 7
    items: list = []
    previous_cost: Optional[float] = None
    cost_change_pct: Optional[float] = None
    methodology: Optional[str] = None
    source: Optional[str] = None
    notes: Optional[str] = None

class NeedsAssessmentCreate(BaseModel):
    title: str
    assessment_type: Optional[str] = None
    sector: Optional[str] = None
    governorate: Optional[str] = None
    district: Optional[str] = None
    sub_district: Optional[str] = None
    severity: Optional[str] = None
    people_in_need: int = 0
    people_targeted: int = 0
    people_reached: int = 0
    households_assessed: int = 0
    key_findings: Optional[str] = None
    priority_needs: list = []
    gaps_identified: list = []
    recommendations: Optional[str] = None
    methodology: Optional[str] = None
    conducted_by: Optional[str] = None
    hno_year: Optional[int] = None
    ipc_phase: Optional[str] = None
    notes: Optional[str] = None

class SectorFacilityCreate(BaseModel):
    name: str
    facility_type: str
    status: str = "functional"
    governorate: Optional[str] = None
    district: Optional[str] = None
    sub_district: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    capacity: int = 0
    current_utilization: int = 0
    managed_by: Optional[str] = None
    supported_by: list = []
    services_provided: list = []
    staff_count: int = 0
    operating_hours: Optional[str] = None
    beneficiaries_served: int = 0
    catchment_population: int = 0
    challenges: list = []
    needs: list = []
    notes: Optional[str] = None


# ── Population Demographics CRUD ─────────────────────────────────────────────

@router.get("/population")
def list_population(
    governorate: Optional[str] = None,
    district: Optional[str] = None,
    category: Optional[str] = None,
    year: Optional[int] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    q = db.query(PopulationRecord)
    if governorate:
        q = q.filter(PopulationRecord.governorate.ilike(f"%{governorate}%"))
    if district:
        q = q.filter(PopulationRecord.district.ilike(f"%{district}%"))
    if category:
        q = q.filter(PopulationRecord.category == category)
    if year:
        q = q.filter(PopulationRecord.year == year)
    if search:
        q = q.filter(or_(
            PopulationRecord.governorate.ilike(f"%{search}%"),
            PopulationRecord.district.ilike(f"%{search}%"),
            PopulationRecord.sub_district.ilike(f"%{search}%"),
        ))
    total = q.count()
    items = q.order_by(PopulationRecord.governorate, PopulationRecord.district).offset((page - 1) * page_size).limit(page_size).all()
    return {"items": [_population_dict(p) for p in items], "total": total, "page": page}


@router.post("/population")
def create_population(data: PopulationCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    p = PopulationRecord(**data.model_dump())
    db.add(p)
    db.commit()
    db.refresh(p)
    return _population_dict(p)


@router.get("/population/{pid}")
def get_population(pid: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    p = db.query(PopulationRecord).filter(PopulationRecord.id == pid).first()
    if not p:
        raise HTTPException(404, "Population record not found")
    return _population_dict(p)


@router.put("/population/{pid}")
def update_population(pid: int, data: PopulationCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    p = db.query(PopulationRecord).filter(PopulationRecord.id == pid).first()
    if not p:
        raise HTTPException(404, "Population record not found")
    for k, v in data.model_dump().items():
        setattr(p, k, v)
    p.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(p)
    return _population_dict(p)


@router.delete("/population/{pid}")
def delete_population(pid: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    p = db.query(PopulationRecord).filter(PopulationRecord.id == pid).first()
    if not p:
        raise HTTPException(404, "Population record not found")
    db.delete(p)
    db.commit()
    return {"ok": True}


@router.get("/population/summary/by-governorate")
def population_by_governorate(
    year: Optional[int] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    q = db.query(
        PopulationRecord.governorate,
        PopulationRecord.category,
        func.sum(PopulationRecord.count).label("total"),
    ).filter(PopulationRecord.age_group == "total", PopulationRecord.gender == "total")
    if year:
        q = q.filter(PopulationRecord.year == year)
    if category:
        q = q.filter(PopulationRecord.category == category)
    rows = q.group_by(PopulationRecord.governorate, PopulationRecord.category).all()
    result = {}
    for gov, cat, total in rows:
        if gov not in result:
            result[gov] = {"governorate": gov, "categories": {}}
        result[gov]["categories"][cat.value if hasattr(cat, 'value') else cat] = total
    return list(result.values())


def _population_dict(p):
    return {
        "id": p.id, "governorate": p.governorate, "district": p.district,
        "sub_district": p.sub_district,
        "category": p.category.value if p.category else None,
        "gender": p.gender.value if p.gender else None,
        "age_group": p.age_group.value if p.age_group else None,
        "count": p.count, "year": p.year, "quarter": p.quarter,
        "source": p.source, "methodology": p.methodology,
        "confidence_level": p.confidence_level, "notes": p.notes,
        "is_verified": p.is_verified,
        "created_at": str(p.created_at) if p.created_at else None,
    }


# ── Camp / Site Management CRUD ──────────────────────────────────────────────

@router.get("/camps")
def list_camps(
    governorate: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    q = db.query(CampSiteProfile)
    if governorate:
        q = q.filter(CampSiteProfile.governorate.ilike(f"%{governorate}%"))
    if status:
        q = q.filter(CampSiteProfile.status == status)
    if search:
        q = q.filter(or_(
            CampSiteProfile.name.ilike(f"%{search}%"),
            CampSiteProfile.site_id.ilike(f"%{search}%"),
            CampSiteProfile.managed_by.ilike(f"%{search}%"),
        ))
    total = q.count()
    items = q.order_by(CampSiteProfile.name).offset((page - 1) * page_size).limit(page_size).all()
    return {"items": [_camp_dict(c) for c in items], "total": total, "page": page}


@router.post("/camps")
def create_camp(data: CampSiteCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    c = CampSiteProfile(**data.model_dump())
    db.add(c)
    db.commit()
    db.refresh(c)
    return _camp_dict(c)


@router.get("/camps/{cid}")
def get_camp(cid: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    c = db.query(CampSiteProfile).filter(CampSiteProfile.id == cid).first()
    if not c:
        raise HTTPException(404, "Camp not found")
    return _camp_dict(c)


@router.put("/camps/{cid}")
def update_camp(cid: int, data: CampSiteCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    c = db.query(CampSiteProfile).filter(CampSiteProfile.id == cid).first()
    if not c:
        raise HTTPException(404, "Camp not found")
    for k, v in data.model_dump().items():
        setattr(c, k, v)
    c.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(c)
    return _camp_dict(c)


@router.delete("/camps/{cid}")
def delete_camp(cid: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    c = db.query(CampSiteProfile).filter(CampSiteProfile.id == cid).first()
    if not c:
        raise HTTPException(404, "Camp not found")
    db.delete(c)
    db.commit()
    return {"ok": True}


def _camp_dict(c):
    return {
        "id": c.id, "name": c.name, "site_id": c.site_id, "camp_type": c.camp_type,
        "status": c.status.value if c.status else None,
        "governorate": c.governorate, "district": c.district, "sub_district": c.sub_district,
        "latitude": c.latitude, "longitude": c.longitude,
        "capacity": c.capacity, "current_population": c.current_population,
        "households": c.households, "managed_by": c.managed_by,
        "land_ownership": c.land_ownership,
        "shelter_types": c.shelter_types or [], "available_services": c.available_services or [],
        "water_source": c.water_source, "electricity_available": c.electricity_available,
        "health_facility_nearby": c.health_facility_nearby, "school_nearby": c.school_nearby,
        "protection_concerns": c.protection_concerns or [],
        "notes": c.notes,
        "created_at": str(c.created_at) if c.created_at else None,
    }


# ── Market Studies CRUD ──────────────────────────────────────────────────────

@router.get("/market-studies")
def list_market_studies(
    governorate: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    q = db.query(MarketStudy)
    if governorate:
        q = q.filter(MarketStudy.governorate.ilike(f"%{governorate}%"))
    if search:
        q = q.filter(or_(MarketStudy.title.ilike(f"%{search}%"), MarketStudy.market_name.ilike(f"%{search}%")))
    total = q.count()
    items = q.order_by(MarketStudy.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {"items": [_market_study_dict(m) for m in items], "total": total, "page": page}


@router.post("/market-studies")
def create_market_study(data: MarketStudyCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    m = MarketStudy(**data.model_dump())
    db.add(m)
    db.commit()
    db.refresh(m)
    return _market_study_dict(m)


@router.delete("/market-studies/{mid}")
def delete_market_study(mid: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    m = db.query(MarketStudy).filter(MarketStudy.id == mid).first()
    if not m:
        raise HTTPException(404, "Market study not found")
    db.delete(m)
    db.commit()
    return {"ok": True}


def _market_study_dict(m):
    return {
        "id": m.id, "title": m.title, "study_type": m.study_type,
        "governorate": m.governorate, "district": m.district,
        "market_name": m.market_name, "market_functionality": m.market_functionality,
        "main_commodities": m.main_commodities or [], "supply_chain_status": m.supply_chain_status,
        "price_trends": m.price_trends, "recommendations": m.recommendations,
        "methodology": m.methodology, "sample_size": m.sample_size,
        "conducted_by": m.conducted_by, "notes": m.notes,
        "created_at": str(m.created_at) if m.created_at else None,
    }


@router.get("/commodity-prices")
def list_commodity_prices(
    governorate: Optional[str] = None,
    commodity_category: Optional[str] = None,
    is_meb_item: Optional[bool] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    q = db.query(CommodityPrice)
    if governorate:
        q = q.filter(CommodityPrice.governorate.ilike(f"%{governorate}%"))
    if commodity_category:
        q = q.filter(CommodityPrice.commodity_category == commodity_category)
    if is_meb_item is not None:
        q = q.filter(CommodityPrice.is_meb_item == is_meb_item)
    if search:
        q = q.filter(CommodityPrice.commodity_name.ilike(f"%{search}%"))
    total = q.count()
    items = q.order_by(CommodityPrice.collection_date.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {"items": [_commodity_dict(c) for c in items], "total": total, "page": page}


@router.post("/commodity-prices")
def create_commodity_price(data: CommodityPriceCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    c = CommodityPrice(**data.model_dump())
    c.collection_date = datetime.now(timezone.utc)
    db.add(c)
    db.commit()
    db.refresh(c)
    return _commodity_dict(c)


@router.delete("/commodity-prices/{cid}")
def delete_commodity_price(cid: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    c = db.query(CommodityPrice).filter(CommodityPrice.id == cid).first()
    if not c:
        raise HTTPException(404, "Commodity price not found")
    db.delete(c)
    db.commit()
    return {"ok": True}


def _commodity_dict(c):
    return {
        "id": c.id, "commodity_name": c.commodity_name,
        "commodity_category": c.commodity_category, "unit": c.unit,
        "price": c.price, "currency": c.currency,
        "governorate": c.governorate, "district": c.district,
        "market_name": c.market_name,
        "collection_date": str(c.collection_date) if c.collection_date else None,
        "price_previous": c.price_previous, "price_change_pct": c.price_change_pct,
        "source": c.source, "is_meb_item": c.is_meb_item, "notes": c.notes,
        "created_at": str(c.created_at) if c.created_at else None,
    }


@router.get("/meb-baskets")
def list_meb_baskets(
    governorate: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    q = db.query(MEBBasket)
    if governorate:
        q = q.filter(MEBBasket.governorate.ilike(f"%{governorate}%"))
    total = q.count()
    items = q.order_by(MEBBasket.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {"items": [_meb_dict(m) for m in items], "total": total, "page": page}


@router.post("/meb-baskets")
def create_meb_basket(data: MEBBasketCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    m = MEBBasket(**data.model_dump())
    db.add(m)
    db.commit()
    db.refresh(m)
    return _meb_dict(m)


def _meb_dict(m):
    return {
        "id": m.id, "name": m.name, "basket_type": m.basket_type,
        "governorate": m.governorate, "district": m.district,
        "total_cost": m.total_cost, "currency": m.currency,
        "household_size": m.household_size, "items": m.items or [],
        "previous_cost": m.previous_cost, "cost_change_pct": m.cost_change_pct,
        "methodology": m.methodology, "source": m.source, "notes": m.notes,
        "created_at": str(m.created_at) if m.created_at else None,
    }


# ── Needs Assessments CRUD ───────────────────────────────────────────────────

@router.get("/needs-assessments")
def list_needs_assessments(
    governorate: Optional[str] = None,
    sector: Optional[str] = None,
    severity: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    q = db.query(NeedsAssessmentRecord)
    if governorate:
        q = q.filter(NeedsAssessmentRecord.governorate.ilike(f"%{governorate}%"))
    if sector:
        q = q.filter(NeedsAssessmentRecord.sector == sector)
    if severity:
        q = q.filter(NeedsAssessmentRecord.severity == severity)
    if search:
        q = q.filter(or_(
            NeedsAssessmentRecord.title.ilike(f"%{search}%"),
            NeedsAssessmentRecord.key_findings.ilike(f"%{search}%"),
        ))
    total = q.count()
    items = q.order_by(NeedsAssessmentRecord.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {"items": [_needs_dict(n) for n in items], "total": total, "page": page}


@router.post("/needs-assessments")
def create_needs_assessment(data: NeedsAssessmentCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    n = NeedsAssessmentRecord(**data.model_dump())
    db.add(n)
    db.commit()
    db.refresh(n)
    return _needs_dict(n)


@router.get("/needs-assessments/{nid}")
def get_needs_assessment(nid: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    n = db.query(NeedsAssessmentRecord).filter(NeedsAssessmentRecord.id == nid).first()
    if not n:
        raise HTTPException(404, "Needs assessment not found")
    return _needs_dict(n)


@router.delete("/needs-assessments/{nid}")
def delete_needs_assessment(nid: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    n = db.query(NeedsAssessmentRecord).filter(NeedsAssessmentRecord.id == nid).first()
    if not n:
        raise HTTPException(404, "Needs assessment not found")
    db.delete(n)
    db.commit()
    return {"ok": True}


def _needs_dict(n):
    return {
        "id": n.id, "title": n.title, "assessment_type": n.assessment_type,
        "sector": n.sector, "governorate": n.governorate, "district": n.district,
        "sub_district": n.sub_district,
        "severity": n.severity.value if n.severity else None,
        "people_in_need": n.people_in_need, "people_targeted": n.people_targeted,
        "people_reached": n.people_reached, "households_assessed": n.households_assessed,
        "key_findings": n.key_findings, "priority_needs": n.priority_needs or [],
        "gaps_identified": n.gaps_identified or [], "recommendations": n.recommendations,
        "methodology": n.methodology, "conducted_by": n.conducted_by,
        "hno_year": n.hno_year, "ipc_phase": n.ipc_phase, "notes": n.notes,
        "created_at": str(n.created_at) if n.created_at else None,
    }


# ── Sector Facilities CRUD ───────────────────────────────────────────────────

@router.get("/facilities")
def list_facilities(
    governorate: Optional[str] = None,
    facility_type: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    q = db.query(SectorFacility)
    if governorate:
        q = q.filter(SectorFacility.governorate.ilike(f"%{governorate}%"))
    if facility_type:
        q = q.filter(SectorFacility.facility_type == facility_type)
    if status:
        q = q.filter(SectorFacility.status == status)
    if search:
        q = q.filter(or_(
            SectorFacility.name.ilike(f"%{search}%"),
            SectorFacility.managed_by.ilike(f"%{search}%"),
        ))
    total = q.count()
    items = q.order_by(SectorFacility.name).offset((page - 1) * page_size).limit(page_size).all()
    return {"items": [_facility_dict(f) for f in items], "total": total, "page": page}


@router.post("/facilities")
def create_facility(data: SectorFacilityCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    f = SectorFacility(**data.model_dump())
    db.add(f)
    db.commit()
    db.refresh(f)
    return _facility_dict(f)


@router.get("/facilities/{fid}")
def get_facility(fid: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    f = db.query(SectorFacility).filter(SectorFacility.id == fid).first()
    if not f:
        raise HTTPException(404, "Facility not found")
    return _facility_dict(f)


@router.put("/facilities/{fid}")
def update_facility(fid: int, data: SectorFacilityCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    f = db.query(SectorFacility).filter(SectorFacility.id == fid).first()
    if not f:
        raise HTTPException(404, "Facility not found")
    for k, v in data.model_dump().items():
        setattr(f, k, v)
    f.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(f)
    return _facility_dict(f)


@router.delete("/facilities/{fid}")
def delete_facility(fid: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    f = db.query(SectorFacility).filter(SectorFacility.id == fid).first()
    if not f:
        raise HTTPException(404, "Facility not found")
    db.delete(f)
    db.commit()
    return {"ok": True}


def _facility_dict(f):
    return {
        "id": f.id, "name": f.name,
        "facility_type": f.facility_type.value if f.facility_type else None,
        "status": f.status.value if f.status else None,
        "governorate": f.governorate, "district": f.district, "sub_district": f.sub_district,
        "latitude": f.latitude, "longitude": f.longitude,
        "capacity": f.capacity, "current_utilization": f.current_utilization,
        "managed_by": f.managed_by, "supported_by": f.supported_by or [],
        "services_provided": f.services_provided or [], "staff_count": f.staff_count,
        "operating_hours": f.operating_hours, "beneficiaries_served": f.beneficiaries_served,
        "catchment_population": f.catchment_population,
        "challenges": f.challenges or [], "needs": f.needs or [],
        "notes": f.notes, "is_active": f.is_active,
        "created_at": str(f.created_at) if f.created_at else None,
    }
