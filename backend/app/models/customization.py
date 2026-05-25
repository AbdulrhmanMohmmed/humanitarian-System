from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint

from app.database import Base


class SystemSetting(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(120), unique=True, nullable=False, index=True)
    category = Column(String(80), default="general", index=True)
    label = Column(String(255), nullable=False)
    description = Column(Text)
    value_json = Column(Text, nullable=False, default="null")
    value_type = Column(String(40), default="string")
    is_public = Column(Boolean, default=False)
    updated_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class ReferenceList(Base):
    __tablename__ = "reference_lists"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(120), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    entity_type = Column(String(100))
    is_system = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class ReferenceListItem(Base):
    __tablename__ = "reference_list_items"
    __table_args__ = (UniqueConstraint("list_id", "value", name="uq_reference_item_value"),)

    id = Column(Integer, primary_key=True, index=True)
    list_id = Column(Integer, ForeignKey("reference_lists.id"), nullable=False, index=True)
    value = Column(String(160), nullable=False)
    label = Column(String(255), nullable=False)
    label_ar = Column(String(255))
    sort_order = Column(Integer, default=0)
    metadata_json = Column(Text, default="{}")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class CustomFieldDefinition(Base):
    __tablename__ = "custom_field_definitions"
    __table_args__ = (UniqueConstraint("entity_type", "field_key", name="uq_custom_field_entity_key"),)

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String(100), nullable=False, index=True)
    field_key = Column(String(120), nullable=False)
    label = Column(String(255), nullable=False)
    label_ar = Column(String(255))
    field_type = Column(String(40), default="text")
    placeholder = Column(String(255))
    help_text = Column(Text)
    is_required = Column(Boolean, default=False)
    is_searchable = Column(Boolean, default=False)
    options_json = Column(Text, default="[]")
    validation_json = Column(Text, default="{}")
    display_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class RolePermissionOverride(Base):
    __tablename__ = "role_permission_overrides"
    __table_args__ = (UniqueConstraint("role", "permission", name="uq_role_permission_override"),)

    id = Column(Integer, primary_key=True, index=True)
    role = Column(String(80), nullable=False, index=True)
    permission = Column(String(120), nullable=False, index=True)
    effect = Column(String(20), nullable=False, default="allow")
    reason = Column(Text)
    updated_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
