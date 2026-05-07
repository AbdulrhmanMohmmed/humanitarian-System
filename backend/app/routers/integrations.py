from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Project, Indicator, Beneficiary, Distribution, DistributionItem, Complaint
from app.auth import get_current_user
from sqlalchemy import func

router = APIRouter(prefix="/integrations", tags=["External Integrations"])


@router.get("/power-bi/dataset/{project_id}")
def export_power_bi_dataset(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Export project data in Power BI-ready format"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        return {"error": "المشروع غير موجود"}

    indicators = db.query(Indicator).filter(Indicator.project_id == project_id).all()

    return {
        "dataset_name": f"MEAL_{project.code}_{project.name}",
        "tables": {
            "project_info": {
                "columns": ["project_id", "name", "sector", "status", "start_date", "end_date", "budget", "spent"],
                "rows": [[project.id, project.name, project.sector, project.status.value if project.status else None,
                          str(project.start_date), str(project.end_date), project.budget, project.spent]],
            },
            "indicators": {
                "columns": ["indicator_id", "name", "type", "target", "actual", "achievement_pct"],
                "rows": [
                    [i.id, i.name, i.type.value if i.type else None,
                     i.target_value, i.actual_value,
                     round(i.actual_value / i.target_value * 100, 1) if i.target_value and i.actual_value else 0]
                    for i in indicators
                ],
            },
        },
        "refresh_url": f"/api/integrations/power-bi/dataset/{project_id}",
        "format": "Power BI REST API compatible",
    }


@router.get("/activity-info/export/{project_id}")
def export_activity_info(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Export data in ActivityInfo-compatible format"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        return {"error": "المشروع غير موجود"}

    indicators = db.query(Indicator).filter(Indicator.project_id == project_id).all()

    return {
        "database_name": project.name,
        "activities": [
            {
                "name": project.name,
                "reporting_frequency": "monthly",
                "indicators": [
                    {
                        "name": ind.name,
                        "category": ind.type.value if ind.type else "output",
                        "units": ind.unit or "عدد",
                        "aggregation": "SUM",
                    }
                    for ind in indicators
                ],
            }
        ],
        "format": "ActivityInfo v4 API compatible",
        "instructions": "استخدم هذا الملف للاستيراد في ActivityInfo عبر: Database Settings → Import",
    }


@router.get("/ocha-3w/export")
def export_ocha_3w(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Export 3W (Who, What, Where) data for OCHA reporting"""
    projects = db.query(Project).all()
    rows = []
    for p in projects:
        indicators = db.query(Indicator).filter(Indicator.project_id == p.id).all()
        ben_count = db.query(func.count(func.distinct(DistributionItem.beneficiary_id))).join(
            Distribution, DistributionItem.distribution_id == Distribution.id
        ).filter(Distribution.project_id == p.id).scalar() or 0

        rows.append({
            "organization": "المنظمة",
            "implementing_partner": p.donor or "",
            "cluster_sector": p.sector or "",
            "activity": p.name,
            "admin1": p.governorate or "",
            "admin2": p.district or "",
            "beneficiaries_reached": ben_count,
            "target_beneficiaries": p.target_beneficiaries or 0,
            "start_date": str(p.start_date) if p.start_date else "",
            "end_date": str(p.end_date) if p.end_date else "",
            "status": p.status.value if p.status else "",
        })

    return {
        "format": "OCHA 3W Template",
        "total_projects": len(rows),
        "data": rows,
        "columns": ["organization", "implementing_partner", "cluster_sector", "activity",
                     "admin1", "admin2", "beneficiaries_reached", "target_beneficiaries",
                     "start_date", "end_date", "status"],
    }


@router.get("/csv-export/{entity}")
def export_csv_data(
    entity: str,
    project_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Export any entity as CSV-ready JSON"""
    if entity == "beneficiaries":
        query = db.query(Beneficiary)
        items = query.all()
        return {
            "entity": entity,
            "columns": ["id", "national_id", "first_name", "last_name", "gender", "governorate", "district", "village", "household_size", "vulnerability_score", "status"],
            "rows": [
                [b.id, b.national_id, b.first_name, b.last_name,
                 b.gender.value if b.gender else None, b.governorate, b.district, b.village,
                 b.household_size, b.vulnerability_score, b.status.value if b.status else None]
                for b in items
            ],
            "total": len(items),
        }
    elif entity == "indicators":
        query = db.query(Indicator)
        if project_id:
            query = query.filter(Indicator.project_id == project_id)
        items = query.all()
        return {
            "entity": entity,
            "columns": ["id", "name", "type", "unit", "target", "actual", "achievement_pct", "project_id"],
            "rows": [
                [i.id, i.name, i.type.value if i.type else None, i.unit,
                 i.target_value, i.actual_value,
                 round(i.actual_value / i.target_value * 100, 1) if i.target_value and i.actual_value else 0,
                 i.project_id]
                for i in items
            ],
            "total": len(items),
        }
    elif entity == "complaints":
        query = db.query(Complaint)
        if project_id:
            query = query.filter(Complaint.project_id == project_id)
        items = query.all()
        return {
            "entity": entity,
            "columns": ["id", "reference_number", "category", "channel", "status", "priority", "governorate", "created_at"],
            "rows": [
                [c.id, c.reference_number, c.category.value if c.category else None,
                 c.channel.value if c.channel else None, c.status.value if c.status else None,
                 c.priority.value if c.priority else None, c.complainant_location,
                 c.created_at.isoformat() if c.created_at else None]
                for c in items
            ],
            "total": len(items),
        }
    else:
        return {"error": f"الكيان '{entity}' غير مدعوم", "supported": ["beneficiaries", "indicators", "complaints"]}


@router.get("/status")
def integration_status(current_user: User = Depends(get_current_user)):
    """Check status of all integrations"""
    return {
        "integrations": [
            {"name": "KoBoToolbox", "status": "ready", "endpoint": "/api/kobo/", "features": ["تصدير XLSForm", "استيراد استجابات"]},
            {"name": "Power BI", "status": "ready", "endpoint": "/api/integrations/power-bi/", "features": ["تصدير بيانات", "تحديث تلقائي"]},
            {"name": "ActivityInfo", "status": "ready", "endpoint": "/api/integrations/activity-info/", "features": ["تصدير أنشطة ومؤشرات"]},
            {"name": "OCHA 3W", "status": "ready", "endpoint": "/api/integrations/ocha-3w/", "features": ["تقرير 3W"]},
            {"name": "CSV Export", "status": "ready", "endpoint": "/api/integrations/csv-export/", "features": ["تصدير أي كيان"]},
        ],
    }
