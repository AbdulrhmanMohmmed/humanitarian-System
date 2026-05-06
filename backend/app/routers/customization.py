import json
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (
    CustomFieldDefinition,
    ReferenceList,
    ReferenceListItem,
    RolePermissionOverride,
    SystemSetting,
    User,
)
from app.auth import get_current_user
from app.permissions import Permission, permission_values_for_user, require_permission, roles_catalog
from app.schemas import (
    CustomFieldIn,
    CustomFieldOut,
    ReferenceListIn,
    ReferenceListItemIn,
    ReferenceListItemOut,
    ReferenceListOut,
    RolePermissionOverrideIn,
    RolePermissionOverrideOut,
    SystemSettingIn,
    SystemSettingOut,
)

router = APIRouter(prefix="/api/customization", tags=["System Customization"])


def _loads(value: str, fallback):
    try:
        return json.loads(value or "")
    except json.JSONDecodeError:
        return fallback


def _setting_out(row: SystemSetting) -> SystemSettingOut:
    return SystemSettingOut(
        id=row.id,
        key=row.key,
        category=row.category,
        label=row.label,
        description=row.description,
        value=_loads(row.value_json, None),
        value_type=row.value_type,
        is_public=row.is_public,
        updated_by=row.updated_by,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


def _item_out(row: ReferenceListItem) -> ReferenceListItemOut:
    return ReferenceListItemOut(
        id=row.id,
        list_id=row.list_id,
        value=row.value,
        label=row.label,
        label_ar=row.label_ar,
        sort_order=row.sort_order,
        metadata=_loads(row.metadata_json, {}),
        is_active=row.is_active,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


def _field_out(row: CustomFieldDefinition) -> CustomFieldOut:
    return CustomFieldOut(
        id=row.id,
        entity_type=row.entity_type,
        field_key=row.field_key,
        label=row.label,
        label_ar=row.label_ar,
        field_type=row.field_type,
        placeholder=row.placeholder,
        help_text=row.help_text,
        is_required=row.is_required,
        is_searchable=row.is_searchable,
        options=_loads(row.options_json, []),
        validation=_loads(row.validation_json, {}),
        display_order=row.display_order,
        is_active=row.is_active,
        created_by=row.created_by,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


def _roles_with_effective_permissions(db: Session):
    roles = [row["role"] for row in roles_catalog()]
    return [
        {"role": role, "permissions": permission_values_for_user(User(role=role), db)}
        for role in roles
    ]


def _seed_defaults(db: Session, current_user: User):
    defaults = [
        SystemSettingIn(key="organization.name", category="identity", label="Organization name", value="Humanitarian Organization", value_type="string", is_public=True),
        SystemSettingIn(key="system.locale", category="localization", label="Default locale", value="ar", value_type="string", is_public=True),
        SystemSettingIn(key="beneficiaries.deduplication.enabled", category="data_quality", label="Beneficiary deduplication", value=True, value_type="boolean"),
        SystemSettingIn(key="reports.default_currency", category="reports", label="Default reporting currency", value="USD", value_type="string", is_public=True),
    ]
    for item in defaults:
        if not db.query(SystemSetting).filter(SystemSetting.key == item.key).first():
            db.add(SystemSetting(
                key=item.key,
                category=item.category,
                label=item.label,
                description=item.description,
                value_json=json.dumps(item.value),
                value_type=item.value_type,
                is_public=item.is_public,
                updated_by=current_user.id,
            ))

    lists = [
        ("sectors", "Sectors", "project"),
        ("governorates", "Governorates", "location"),
        ("complaint_categories", "Complaint categories", "complaint"),
        ("document_categories", "Document categories", "document"),
        ("transaction_categories", "Transaction categories", "transaction"),
        ("visit_types", "Field visit types", "field_visit"),
    ]
    for slug, name, entity_type in lists:
        if not db.query(ReferenceList).filter(ReferenceList.slug == slug).first():
            db.add(ReferenceList(slug=slug, name=name, entity_type=entity_type, is_system=True, created_by=current_user.id))
    db.commit()

    default_items = {
        "sectors": [
            ("health", "Health", "الصحة"),
            ("education", "Education", "التعليم"),
            ("food_security", "Food Security", "الأمن الغذائي"),
            ("wash", "WASH", "المياه والصرف الصحي"),
            ("protection", "Protection", "الحماية"),
            ("shelter", "Shelter", "المأوى"),
        ],
        "governorates": [
            ("sanaa", "Sanaa", "صنعاء"),
            ("aden", "Aden", "عدن"),
            ("taiz", "Taiz", "تعز"),
            ("al_hudaydah", "Al Hudaydah", "الحديدة"),
            ("ibb", "Ibb", "إب"),
            ("hadramout", "Hadramout", "حضرموت"),
            ("marib", "Marib", "مأرب"),
        ],
        "complaint_categories": [
            ("service_quality", "Service quality", "جودة الخدمة"),
            ("staff_behavior", "Staff behavior", "سلوك الموظفين"),
            ("targeting", "Targeting", "الاستهداف"),
            ("distribution", "Distribution", "التوزيع"),
            ("protection", "Protection", "الحماية"),
            ("safeguarding", "Safeguarding", "الحماية من الاستغلال"),
            ("fraud", "Fraud", "احتيال"),
            ("suggestion", "Suggestion", "اقتراح"),
            ("other", "Other", "أخرى"),
        ],
        "document_categories": [
            ("project_proposal", "Project proposal", "مقترح مشروع"),
            ("report", "Report", "تقرير"),
            ("assessment", "Assessment", "تقييم"),
            ("agreement", "Agreement", "اتفاقية"),
            ("budget", "Budget", "ميزانية"),
            ("meeting_minutes", "Meeting minutes", "محضر اجتماع"),
            ("policy", "Policy", "سياسة"),
            ("other", "Other", "أخرى"),
        ],
        "transaction_categories": [
            ("salaries", "Salaries", "رواتب"),
            ("rent", "Rent", "إيجارات"),
            ("procurement", "Procurement", "مشتريات"),
            ("travel", "Travel", "سفر"),
            ("training", "Training", "تدريب"),
            ("equipment", "Equipment", "معدات"),
            ("services", "Services", "خدمات"),
        ],
        "visit_types": [
            ("monitoring", "General monitoring", "مراقبة عامة"),
            ("distribution", "Distribution monitoring", "مراقبة توزيعات"),
            ("pdm", "Post-distribution monitoring", "مراقبة ما بعد التوزيع"),
            ("site_verification", "Site verification", "تحقق من المواقع"),
        ],
    }
    for slug, items in default_items.items():
        reference_list = db.query(ReferenceList).filter(ReferenceList.slug == slug).first()
        if not reference_list:
            continue
        for order, (value, label, label_ar) in enumerate(items, 1):
            exists = db.query(ReferenceListItem).filter(
                ReferenceListItem.list_id == reference_list.id,
                ReferenceListItem.value == value,
            ).first()
            if not exists:
                db.add(ReferenceListItem(
                    list_id=reference_list.id,
                    value=value,
                    label=label,
                    label_ar=label_ar,
                    sort_order=order,
                ))
    db.commit()


@router.post("/bootstrap")
def bootstrap_customization(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.SETTINGS_MANAGE)),
):
    _seed_defaults(db, current_user)
    return {"status": "ok"}


@router.get("/overview")
def overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.SETTINGS_MANAGE)),
):
    _seed_defaults(db, current_user)
    return {
        "settings": [_setting_out(row).model_dump(mode="json") for row in db.query(SystemSetting).order_by(SystemSetting.category, SystemSetting.key).all()],
        "reference_lists": [ReferenceListOut.model_validate(row).model_dump(mode="json") for row in db.query(ReferenceList).order_by(ReferenceList.name).all()],
        "custom_fields": [_field_out(row).model_dump(mode="json") for row in db.query(CustomFieldDefinition).order_by(CustomFieldDefinition.entity_type, CustomFieldDefinition.display_order).all()],
        "roles": _roles_with_effective_permissions(db),
        "overrides": [RolePermissionOverrideOut.model_validate(row).model_dump(mode="json") for row in db.query(RolePermissionOverride).order_by(RolePermissionOverride.role, RolePermissionOverride.permission).all()],
    }


@router.get("/runtime")
def runtime_customization(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lists = db.query(ReferenceList).filter(ReferenceList.is_active == True).order_by(ReferenceList.name).all()  # noqa: E712
    fields = db.query(CustomFieldDefinition).filter(CustomFieldDefinition.is_active == True).order_by(  # noqa: E712
        CustomFieldDefinition.entity_type,
        CustomFieldDefinition.display_order,
    ).all()
    return {
        "reference_lists": [
            {
                **ReferenceListOut.model_validate(row).model_dump(mode="json"),
                "items": [_item_out(item).model_dump(mode="json") for item in db.query(ReferenceListItem).filter(
                    ReferenceListItem.list_id == row.id,
                    ReferenceListItem.is_active == True,  # noqa: E712
                ).order_by(ReferenceListItem.sort_order, ReferenceListItem.label).all()],
            }
            for row in lists
        ],
        "custom_fields": [_field_out(row).model_dump(mode="json") for row in fields],
    }


@router.get("/settings", response_model=list[SystemSettingOut])
def list_settings(
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.SETTINGS_MANAGE)),
):
    query = db.query(SystemSetting)
    if category:
        query = query.filter(SystemSetting.category == category)
    return [_setting_out(row) for row in query.order_by(SystemSetting.category, SystemSetting.key).all()]


@router.post("/settings", response_model=SystemSettingOut)
def upsert_setting(
    data: SystemSettingIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.SETTINGS_MANAGE)),
):
    row = db.query(SystemSetting).filter(SystemSetting.key == data.key).first()
    payload = data.model_dump(exclude={"value"})
    if row:
        for key, value in payload.items():
            setattr(row, key, value)
    else:
        row = SystemSetting(**payload)
        db.add(row)
    row.value_json = json.dumps(data.value, ensure_ascii=False)
    row.updated_by = current_user.id
    db.commit()
    db.refresh(row)
    return _setting_out(row)


@router.get("/reference-lists", response_model=list[ReferenceListOut])
def list_reference_lists(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.SETTINGS_MANAGE)),
):
    return db.query(ReferenceList).order_by(ReferenceList.name).all()


@router.post("/reference-lists", response_model=ReferenceListOut)
def upsert_reference_list(
    data: ReferenceListIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.SETTINGS_MANAGE)),
):
    row = db.query(ReferenceList).filter(ReferenceList.slug == data.slug).first()
    if row:
        for key, value in data.model_dump().items():
            setattr(row, key, value)
    else:
        row = ReferenceList(**data.model_dump(), created_by=current_user.id)
        db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.get("/reference-lists/{list_id}/items", response_model=list[ReferenceListItemOut])
def list_reference_items(
    list_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.SETTINGS_MANAGE)),
):
    return [_item_out(row) for row in db.query(ReferenceListItem).filter(ReferenceListItem.list_id == list_id).order_by(ReferenceListItem.sort_order, ReferenceListItem.label).all()]


@router.post("/reference-lists/{list_id}/items", response_model=ReferenceListItemOut)
def upsert_reference_item(
    list_id: int,
    data: ReferenceListItemIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.SETTINGS_MANAGE)),
):
    if not db.query(ReferenceList).filter(ReferenceList.id == list_id).first():
        raise HTTPException(status_code=404, detail="Reference list not found")
    row = db.query(ReferenceListItem).filter(ReferenceListItem.list_id == list_id, ReferenceListItem.value == data.value).first()
    payload = data.model_dump(exclude={"metadata"})
    if row:
        for key, value in payload.items():
            setattr(row, key, value)
    else:
        row = ReferenceListItem(list_id=list_id, **payload)
        db.add(row)
    row.metadata_json = json.dumps(data.metadata, ensure_ascii=False)
    db.commit()
    db.refresh(row)
    return _item_out(row)


@router.get("/custom-fields", response_model=list[CustomFieldOut])
def list_custom_fields(
    entity_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.SETTINGS_MANAGE)),
):
    query = db.query(CustomFieldDefinition)
    if entity_type:
        query = query.filter(CustomFieldDefinition.entity_type == entity_type)
    return [_field_out(row) for row in query.order_by(CustomFieldDefinition.entity_type, CustomFieldDefinition.display_order).all()]


@router.post("/custom-fields", response_model=CustomFieldOut)
def upsert_custom_field(
    data: CustomFieldIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.SETTINGS_MANAGE)),
):
    row = db.query(CustomFieldDefinition).filter(
        CustomFieldDefinition.entity_type == data.entity_type,
        CustomFieldDefinition.field_key == data.field_key,
    ).first()
    payload = data.model_dump(exclude={"options", "validation"})
    if row:
        for key, value in payload.items():
            setattr(row, key, value)
    else:
        row = CustomFieldDefinition(**payload, created_by=current_user.id)
        db.add(row)
    row.options_json = json.dumps(data.options, ensure_ascii=False)
    row.validation_json = json.dumps(data.validation, ensure_ascii=False)
    db.commit()
    db.refresh(row)
    return _field_out(row)


@router.get("/roles/matrix")
def roles_matrix(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.SETTINGS_MANAGE)),
):
    return {
        "permissions": [permission.value for permission in Permission],
        "roles": _roles_with_effective_permissions(db),
        "overrides": [RolePermissionOverrideOut.model_validate(row).model_dump(mode="json") for row in db.query(RolePermissionOverride).all()],
    }


@router.post("/roles/overrides", response_model=RolePermissionOverrideOut)
def upsert_role_override(
    data: RolePermissionOverrideIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.SETTINGS_MANAGE)),
):
    if data.effect not in {"allow", "deny"}:
        raise HTTPException(status_code=400, detail="effect must be allow or deny")
    row = db.query(RolePermissionOverride).filter(
        RolePermissionOverride.role == data.role,
        RolePermissionOverride.permission == data.permission,
    ).first()
    if row:
        row.effect = data.effect
        row.reason = data.reason
    else:
        row = RolePermissionOverride(**data.model_dump())
        db.add(row)
    row.updated_by = current_user.id
    db.commit()
    db.refresh(row)
    return row
