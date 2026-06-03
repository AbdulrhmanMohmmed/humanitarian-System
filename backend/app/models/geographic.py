"""Geographic models for PostGIS spatial data support."""
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, Boolean, Enum as SAEnum
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class BoundaryLevel(str, enum.Enum):
    COUNTRY = "country"
    GOVERNORATE = "governorate"
    DISTRICT = "district"
    SUBDISTRICT = "subdistrict"
    VILLAGE = "village"


class LocationType(str, enum.Enum):
    OFFICE = "office"
    WAREHOUSE = "warehouse"
    DISTRIBUTION_POINT = "distribution_point"
    HEALTH_FACILITY = "health_facility"
    SCHOOL = "school"
    CAMP = "camp"
    WATER_POINT = "water_point"
    SHELTER = "shelter"


class AdminBoundary(Base):
    """Administrative boundary (governorate, district, etc.)."""
    __tablename__ = "admin_boundaries"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    name_ar = Column(String(255))
    code = Column(String(50), unique=True, index=True)
    level = Column(SAEnum(BoundaryLevel), nullable=False)
    parent_id = Column(Integer, ForeignKey("admin_boundaries.id"), nullable=True)
    latitude = Column(Float)
    longitude = Column(Float)
    bbox_north = Column(Float)
    bbox_south = Column(Float)
    bbox_east = Column(Float)
    bbox_west = Column(Float)
    population = Column(Integer, default=0)
    area_sq_km = Column(Float, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    parent = relationship("AdminBoundary", remote_side=[id], backref="children")
    locations = relationship("Location", back_populates="admin_boundary")


class Location(Base):
    """Physical location with coordinates."""
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    location_type = Column(SAEnum(LocationType), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    altitude = Column(Float, nullable=True)
    accuracy = Column(Float, nullable=True)
    address = Column(Text)
    admin_boundary_id = Column(Integer, ForeignKey("admin_boundaries.id"), nullable=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    metadata_json = Column(Text, default="{}")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    admin_boundary = relationship("AdminBoundary", back_populates="locations")


class SpatialQuery(Base):
    """Saved spatial queries for beneficiary mapping."""
    __tablename__ = "spatial_queries"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    query_type = Column(String(50))
    center_lat = Column(Float)
    center_lng = Column(Float)
    radius_km = Column(Float)
    filter_criteria = Column(Text, default="{}")
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
