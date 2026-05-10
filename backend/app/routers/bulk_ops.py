"""Bulk Operations API — import, export, batch update for multiple entities."""
import csv
import io
import json
from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import User, Beneficiary, Project, Grant, Transaction

router = APIRouter(prefix="/bulk", tags=["العمليات المجمعة"])

ENTITY_MAP = {
    "beneficiaries": Beneficiary,
    "projects": Project,
    "grants": Grant,
    "transactions": Transaction,
}


@router.post("/import/{entity_type}")
async def bulk_import(
    entity_type: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Import records from CSV file."""
    if entity_type not in ENTITY_MAP:
        raise HTTPException(400, f"Unsupported entity: {entity_type}")

    model = ENTITY_MAP[entity_type]
    content = await file.read()
    text = content.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text))

    created = 0
    errors = []
    for i, row in enumerate(reader, start=2):
        try:
            # Filter only valid columns
            valid_cols = {c.name for c in model.__table__.columns}
            clean = {k: v for k, v in row.items() if k in valid_cols and k != "id"}
            obj = model(**clean)
            db.add(obj)
            created += 1
        except Exception as e:
            errors.append({"row": i, "error": str(e)})

    db.commit()
    return {"created": created, "errors": errors}


@router.get("/export/{entity_type}")
def bulk_export(
    entity_type: str,
    format: str = "csv",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Export records as CSV or JSON."""
    if entity_type not in ENTITY_MAP:
        raise HTTPException(400, f"Unsupported entity: {entity_type}")

    model = ENTITY_MAP[entity_type]
    query = db.query(model)
    if hasattr(model, "deleted_at"):
        query = query.filter(model.deleted_at.is_(None))
    records = query.all()

    columns = [c.name for c in model.__table__.columns]

    if format == "json":
        data = []
        for r in records:
            row = {}
            for col in columns:
                val = getattr(r, col, None)
                row[col] = str(val) if val is not None else None
            data.append(row)
        return data

    # CSV export
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=columns)
    writer.writeheader()
    for r in records:
        row = {}
        for col in columns:
            val = getattr(r, col, None)
            row[col] = str(val) if val is not None else ""
        writer.writerow(row)

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={entity_type}_export.csv"},
    )
