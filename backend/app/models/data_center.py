import enum
from datetime import datetime, timezone
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
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


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
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


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
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


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
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


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
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


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
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


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
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


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
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class CurrencyRate(Base):
    __tablename__ = "currency_rates"
    id = Column(Integer, primary_key=True, index=True)
    from_currency = Column(String(10), nullable=False)
    to_currency = Column(String(10), nullable=False)
    rate = Column(Float, nullable=False)
    source = Column(String(100))
    effective_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


# ── Population Demographics ──────────────────────────────────────────────────

class PopulationCategory(str, enum.Enum):
    IDP = "idp"
    HOST_COMMUNITY = "host_community"
    RETURNEE = "returnee"
    REFUGEE = "refugee"
    ASYLUM_SEEKER = "asylum_seeker"
    NON_DISPLACED = "non_displaced"


class GenderGroup(str, enum.Enum):
    MALE = "male"
    FEMALE = "female"
    TOTAL = "total"


class AgeGroup(str, enum.Enum):
    UNDER_5 = "under_5"
    CHILDREN_5_17 = "5_17"
    ADULTS_18_59 = "18_59"
    ELDERLY_60_PLUS = "60_plus"
    TOTAL = "total"


class PopulationRecord(Base):
    __tablename__ = "population_records"
    id = Column(Integer, primary_key=True, index=True)
    governorate = Column(String(200), nullable=False)
    district = Column(String(200))
    sub_district = Column(String(200))
    category = Column(SAEnum(PopulationCategory), nullable=False)
    gender = Column(SAEnum(GenderGroup), default=GenderGroup.TOTAL)
    age_group = Column(SAEnum(AgeGroup), default=AgeGroup.TOTAL)
    count = Column(Integer, nullable=False, default=0)
    year = Column(Integer, nullable=False)
    quarter = Column(Integer)
    source = Column(String(300))
    methodology = Column(String(200))
    confidence_level = Column(String(50))
    notes = Column(Text)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


# ── Camp / Site Management ───────────────────────────────────────────────────

class CampStatus(str, enum.Enum):
    ACTIVE = "active"
    CLOSED = "closed"
    PLANNED = "planned"
    TRANSITIONAL = "transitional"


class CampSiteProfile(Base):
    __tablename__ = "camp_site_profiles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(300), nullable=False)
    site_id = Column(String(50), unique=True)
    camp_type = Column(String(100))
    status = Column(SAEnum(CampStatus), default=CampStatus.ACTIVE)
    governorate = Column(String(200))
    district = Column(String(200))
    sub_district = Column(String(200))
    latitude = Column(Float)
    longitude = Column(Float)
    capacity = Column(Integer, default=0)
    current_population = Column(Integer, default=0)
    households = Column(Integer, default=0)
    established_date = Column(DateTime)
    managed_by = Column(String(300))
    land_ownership = Column(String(100))
    shelter_types = Column(JSON, default=list)
    available_services = Column(JSON, default=list)
    water_source = Column(String(200))
    electricity_available = Column(Boolean, default=False)
    health_facility_nearby = Column(Boolean, default=False)
    school_nearby = Column(Boolean, default=False)
    protection_concerns = Column(JSON, default=list)
    accessibility = Column(String(200))
    last_assessment_date = Column(DateTime)
    notes = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


# ── Market Studies ───────────────────────────────────────────────────────────

class MarketStudy(Base):
    __tablename__ = "market_studies"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    study_type = Column(String(100))
    governorate = Column(String(200))
    district = Column(String(200))
    assessment_date = Column(DateTime)
    market_name = Column(String(300))
    market_functionality = Column(String(100))
    main_commodities = Column(JSON, default=list)
    supply_chain_status = Column(String(200))
    price_trends = Column(String(200))
    access_constraints = Column(JSON, default=list)
    recommendations = Column(Text)
    methodology = Column(String(200))
    sample_size = Column(Integer, default=0)
    conducted_by = Column(String(300))
    report_url = Column(String(500))
    notes = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class CommodityPrice(Base):
    __tablename__ = "commodity_prices"
    id = Column(Integer, primary_key=True, index=True)
    commodity_name = Column(String(200), nullable=False)
    commodity_category = Column(String(100))
    unit = Column(String(50), nullable=False)
    price = Column(Float, nullable=False)
    currency = Column(String(10), default="YER")
    governorate = Column(String(200))
    district = Column(String(200))
    market_name = Column(String(300))
    collection_date = Column(DateTime, nullable=False)
    price_previous = Column(Float)
    price_change_pct = Column(Float)
    source = Column(String(300))
    is_meb_item = Column(Boolean, default=False)
    notes = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class MEBBasket(Base):
    __tablename__ = "meb_baskets"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(300), nullable=False)
    basket_type = Column(String(100))
    governorate = Column(String(200))
    district = Column(String(200))
    calculation_date = Column(DateTime)
    total_cost = Column(Float, nullable=False, default=0)
    currency = Column(String(10), default="YER")
    household_size = Column(Integer, default=7)
    items = Column(JSON, default=list)
    previous_cost = Column(Float)
    cost_change_pct = Column(Float)
    methodology = Column(String(200))
    source = Column(String(300))
    notes = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


# ── Needs Assessments ────────────────────────────────────────────────────────

class SeverityLevel(str, enum.Enum):
    MINIMAL = "1_minimal"
    STRESS = "2_stress"
    SEVERE = "3_severe"
    EXTREME = "4_extreme"
    CATASTROPHIC = "5_catastrophic"


class NeedsAssessmentRecord(Base):
    __tablename__ = "needs_assessment_records"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    assessment_type = Column(String(100))
    sector = Column(String(100))
    governorate = Column(String(200))
    district = Column(String(200))
    sub_district = Column(String(200))
    assessment_date = Column(DateTime)
    severity = Column(SAEnum(SeverityLevel))
    people_in_need = Column(Integer, default=0)
    people_targeted = Column(Integer, default=0)
    people_reached = Column(Integer, default=0)
    households_assessed = Column(Integer, default=0)
    key_findings = Column(Text)
    priority_needs = Column(JSON, default=list)
    gaps_identified = Column(JSON, default=list)
    recommendations = Column(Text)
    data_sources = Column(JSON, default=list)
    methodology = Column(String(200))
    conducted_by = Column(String(300))
    report_url = Column(String(500))
    hno_year = Column(Integer)
    ipc_phase = Column(String(50))
    notes = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


# ── Sector Facilities ────────────────────────────────────────────────────────

class FacilityStatus(str, enum.Enum):
    FUNCTIONAL = "functional"
    PARTIALLY_FUNCTIONAL = "partially_functional"
    NON_FUNCTIONAL = "non_functional"
    DESTROYED = "destroyed"
    UNDER_CONSTRUCTION = "under_construction"


class FacilityType(str, enum.Enum):
    HEALTH_CENTER = "health_center"
    HOSPITAL = "hospital"
    SCHOOL = "school"
    WATER_POINT = "water_point"
    NUTRITION_CENTER = "nutrition_center"
    PROTECTION_CENTER = "protection_center"
    DISTRIBUTION_POINT = "distribution_point"
    SHELTER = "shelter"
    WASH_FACILITY = "wash_facility"
    LIVELIHOOD_CENTER = "livelihood_center"


class SectorFacility(Base):
    __tablename__ = "sector_facilities"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(300), nullable=False)
    facility_type = Column(SAEnum(FacilityType), nullable=False)
    status = Column(SAEnum(FacilityStatus), default=FacilityStatus.FUNCTIONAL)
    governorate = Column(String(200))
    district = Column(String(200))
    sub_district = Column(String(200))
    latitude = Column(Float)
    longitude = Column(Float)
    capacity = Column(Integer, default=0)
    current_utilization = Column(Integer, default=0)
    managed_by = Column(String(300))
    supported_by = Column(JSON, default=list)
    services_provided = Column(JSON, default=list)
    staff_count = Column(Integer, default=0)
    operating_hours = Column(String(100))
    beneficiaries_served = Column(Integer, default=0)
    catchment_population = Column(Integer, default=0)
    last_assessment_date = Column(DateTime)
    challenges = Column(JSON, default=list)
    needs = Column(JSON, default=list)
    notes = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
