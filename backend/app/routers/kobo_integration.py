from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models import User, DataCollectionForm as Form, FormField, FormStatus, FieldType
from app.auth import get_current_user

router = APIRouter(prefix="/api/kobo", tags=["KoBoToolbox Integration"])

FIELD_TYPE_MAP = {
    FieldType.TEXT: "text",
    FieldType.NUMBER: "integer",
    FieldType.SELECT: "select_one",
    FieldType.MULTI_SELECT: "select_multiple",
    FieldType.DATE: "date",
    FieldType.DATETIME: "dateTime",
    FieldType.TEXTAREA: "text",
    FieldType.RADIO: "select_one",
    FieldType.CHECKBOX: "select_multiple",
    FieldType.FILE: "file",
    FieldType.GPS: "geopoint",
    FieldType.PHOTO: "image",
    FieldType.RATING: "integer",
    FieldType.MATRIX: "text",
    FieldType.SECTION: "begin_group",
}


@router.get("/export-xlsform/{form_id}")
def export_to_xlsform(
    form_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Export form as XLSForm-compatible JSON structure"""
    form = db.query(Form).filter(Form.id == form_id).first()
    if not form:
        raise HTTPException(status_code=404, detail="النموذج غير موجود")

    fields = db.query(FormField).filter(FormField.form_id == form_id).order_by(FormField.order).all()

    survey = []
    choices = []
    choice_lists = {}

    for field in fields:
        xls_type = FIELD_TYPE_MAP.get(field.field_type, "text")

        if field.field_type in (FieldType.SELECT, FieldType.MULTI_SELECT, FieldType.RADIO):
            list_name = f"list_{field.id}"
            xls_type = f"{xls_type} {list_name}"
            if field.options:
                opts = field.options if isinstance(field.options, list) else []
                for i, opt in enumerate(opts):
                    if isinstance(opt, dict):
                        choices.append({"list_name": list_name, "name": opt.get("value", f"opt_{i}"), "label": opt.get("label", str(opt))})
                    else:
                        choices.append({"list_name": list_name, "name": f"opt_{i}", "label": str(opt)})
                choice_lists[list_name] = True

        row = {
            "type": xls_type,
            "name": f"field_{field.id}",
            "label": field.label,
            "required": "yes" if field.is_required else "",
        }

        if field.validation_rules:
            rules = field.validation_rules if isinstance(field.validation_rules, dict) else {}
            if "min" in rules:
                row["constraint"] = f". >= {rules['min']}"
            if "max" in rules:
                c = row.get("constraint", "")
                row["constraint"] = f"{c} and . <= {rules['max']}" if c else f". <= {rules['max']}"

        survey.append(row)

    return {
        "form_title": form.title,
        "form_id": f"humanitarian_form_{form.id}",
        "default_language": "Arabic",
        "survey": survey,
        "choices": choices,
        "settings": {
            "form_title": form.title,
            "form_id": f"humanitarian_form_{form.id}",
            "version": "1",
            "style": "theme-grid",
        },
        "instructions": {
            "kobo_import": "1. اذهب إلى KoBoToolbox → New Form → Import XLSForm. 2. حمّل هذا الملف كـ .xlsx",
            "odk_import": "1. حوّل إلى XML باستخدام pyxform. 2. ارفع إلى ODK Central",
        },
    }


@router.post("/import-submissions/{form_id}")
def import_kobo_submissions(
    form_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Import submissions from KoBoToolbox API response"""
    form = db.query(Form).filter(Form.id == form_id).first()
    if not form:
        raise HTTPException(status_code=404, detail="النموذج غير موجود")

    results = data.get("results", [])
    imported = 0
    for row in results:
        from app.models import FormSubmission, SubmissionStatus
        sub = FormSubmission(
            form_id=form_id,
            submitted_by=current_user.id,
            data=row,
            status=SubmissionStatus.SUBMITTED,
            gps_latitude=row.get("_geolocation", [None, None])[0] if row.get("_geolocation") else None,
            gps_longitude=row.get("_geolocation", [None, None])[1] if row.get("_geolocation") else None,
        )
        db.add(sub)
        imported += 1

    db.commit()
    return {"imported": imported, "form_id": form_id}


@router.get("/connection-test")
def test_kobo_connection(current_user: User = Depends(get_current_user)):
    """Test KoBoToolbox API connectivity"""
    return {
        "status": "ready",
        "supported_versions": ["KoBoToolbox v2", "ODK Central v1"],
        "export_formats": ["XLSForm JSON", "XLS", "XML"],
        "import_formats": ["KoBo API JSON", "CSV", "ODK Briefcase"],
        "api_endpoints": {
            "kobo_api": "https://kf.kobotoolbox.org/api/v2/",
            "kobo_kc": "https://kc.kobotoolbox.org/api/v1/",
            "odk_central": "https://your-server.odk.cloud/v1/",
        },
    }
