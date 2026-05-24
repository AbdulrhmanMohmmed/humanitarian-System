import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy import Enum as SAEnum
from app.database import Base


class PolicyCategory(str, enum.Enum):
    HR = "hr"
    FINANCE = "finance"
    SECURITY = "security"
    PROCUREMENT = "procurement"
    IT = "it"
    OPERATIONS = "operations"
    SAFEGUARDING = "safeguarding"
    DATA_PROTECTION = "data_protection"
    ANTI_FRAUD = "anti_fraud"
    LOGISTICS = "logistics"


class ContactType(str, enum.Enum):
    DONOR = "donor"
    PARTNER = "partner"
    GOVERNMENT = "government"
    UN_AGENCY = "un_agency"
    INGO = "ingo"
    LOCAL_NGO = "local_ngo"
    MEDIA = "media"
    VENDOR = "vendor"
    CONSULTANT = "consultant"
    COMMUNITY_LEADER = "community_leader"


class ResourceType(str, enum.Enum):
    TEMPLATE = "template"
    GUIDE = "guide"
    FORM = "form"
    SOP = "sop"
    CHECKLIST = "checklist"
    TRAINING_MATERIAL = "training_material"
    REFERENCE = "reference"
    TOOL = "tool"


class LegalDocType(str, enum.Enum):
    MOU = "mou"
    CONTRACT = "contract"
    AGREEMENT = "agreement"
    LICENSE = "license"
    REGISTRATION = "registration"
    TAX_EXEMPTION = "tax_exemption"
    INSURANCE = "insurance"
    LEASE = "lease"


class OrgPolicy(Base):
    __tablename__ = "org_policies"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    category = Column(SAEnum(PolicyCategory), default=PolicyCategory.OPERATIONS)
    version = Column(String(20), default="1.0")
    content = Column(Text)
    summary = Column(Text)
    effective_date = Column(DateTime)
    review_date = Column(DateTime)
    approved_by = Column(String(200))
    is_active = Column(Boolean, default=True)
    attachment_url = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ContactDirectory(Base):
    __tablename__ = "contact_directory"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(300), nullable=False)
    organization = Column(String(300))
    contact_type = Column(SAEnum(ContactType), default=ContactType.PARTNER)
    title = Column(String(200))
    email = Column(String(200))
    phone = Column(String(50))
    phone2 = Column(String(50))
    address = Column(Text)
    city = Column(String(100))
    country = Column(String(100))
    notes = Column(Text)
    is_active = Column(Boolean, default=True)
    tags = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)


class OrgResource(Base):
    __tablename__ = "org_resources"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    resource_type = Column(SAEnum(ResourceType), default=ResourceType.TEMPLATE)
    category = Column(String(100))
    description = Column(Text)
    file_url = Column(String(500))
    content = Column(Text)
    language = Column(String(10), default="ar")
    version = Column(String(20), default="1.0")
    download_count = Column(Integer, default=0)
    is_public = Column(Boolean, default=False)
    tags = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class LegalDocument(Base):
    __tablename__ = "legal_documents"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    doc_type = Column(SAEnum(LegalDocType), default=LegalDocType.CONTRACT)
    party_name = Column(String(300))
    reference_number = Column(String(100))
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    value = Column(Float, default=0)
    currency = Column(String(10), default="USD")
    status = Column(String(50), default="active")
    file_url = Column(String(500))
    notes = Column(Text)
    reminder_days = Column(Integer, default=30)
    created_at = Column(DateTime, default=datetime.utcnow)


class DonorProfile(Base):
    __tablename__ = "donor_profiles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(300), nullable=False)
    acronym = Column(String(50))
    donor_type = Column(String(100))
    country = Column(String(100))
    website = Column(String(300))
    focal_point = Column(String(200))
    email = Column(String(200))
    phone = Column(String(50))
    funding_sectors = Column(JSON, default=list)
    funding_range_min = Column(Float, default=0)
    funding_range_max = Column(Float, default=0)
    currency = Column(String(10), default="USD")
    reporting_requirements = Column(Text)
    application_process = Column(Text)
    notes = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class CountryProfile(Base):
    __tablename__ = "country_profiles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    iso_code = Column(String(3))
    region = Column(String(100))
    capital = Column(String(100))
    population = Column(Integer, default=0)
    currency = Column(String(50))
    languages = Column(JSON, default=list)
    humanitarian_needs = Column(Text)
    coordination_structure = Column(Text)
    key_clusters = Column(JSON, default=list)
    operating_ngos = Column(Integer, default=0)
    crisis_level = Column(String(50))
    hno_year = Column(Integer)
    people_in_need = Column(Integer, default=0)
    people_targeted = Column(Integer, default=0)
    funding_required = Column(Float, default=0)
    funding_received = Column(Float, default=0)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class SectorReference(Base):
    __tablename__ = "sector_references"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    cluster = Column(String(100))
    lead_agency = Column(String(200))
    description = Column(Text)
    standards = Column(JSON, default=list)
    key_indicators = Column(JSON, default=list)
    min_standards = Column(Text)
    guidelines_url = Column(String(500))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class EmergencyContact(Base):
    __tablename__ = "emergency_contacts"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(300), nullable=False)
    role = Column(String(200))
    organization = Column(String(300))
    phone = Column(String(50), nullable=False)
    phone2 = Column(String(50))
    email = Column(String(200))
    location = Column(String(200))
    priority = Column(Integer, default=1)
    available_24h = Column(Boolean, default=False)
    notes = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class CurrencyRate(Base):
    __tablename__ = "currency_rates"
    id = Column(Integer, primary_key=True, index=True)
    from_currency = Column(String(10), nullable=False)
    to_currency = Column(String(10), nullable=False)
    rate = Column(Float, nullable=False)
    source = Column(String(100))
    effective_date = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
