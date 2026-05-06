from fastapi import APIRouter, Depends

from app.auth import get_current_user
from app.config import settings
from app.models import User

router = APIRouter(prefix="/api/system", tags=["System Architecture"])


@router.get("/architecture")
def architecture_status(current_user: User = Depends(get_current_user)):
    database_engine = "PostgreSQL/PostGIS ready" if settings.DATABASE_URL.startswith("postgresql") else "SQLite local fallback"
    return {
        "current_runtime": {
            "frontend": "React + Vite",
            "backend": "FastAPI / Python",
            "database": database_engine,
            "api_style": "REST first",
        },
        "production_stack": {
            "database": "PostgreSQL + PostGIS",
            "cache_and_queue": "Redis + Celery",
            "file_storage": "S3-compatible storage via MinIO/S3",
            "identity": "Keycloak profile ready for enterprise SSO",
            "analytics": "PostgreSQL materialized views first, ClickHouse profile for scale",
            "deployment": "Docker Compose now, Kubernetes later for enterprise deployments",
        },
        "configured_endpoints": {
            "database_url": settings.DATABASE_URL.split("@")[-1] if "@" in settings.DATABASE_URL else settings.DATABASE_URL,
            "redis_url": settings.REDIS_URL,
            "s3_endpoint_url": settings.S3_ENDPOINT_URL,
            "s3_bucket": settings.S3_BUCKET,
            "keycloak_url": settings.KEYCLOAK_URL,
            "keycloak_realm": settings.KEYCLOAK_REALM,
        },
        "decision": "Keep FastAPI/React as the product core and upgrade infrastructure progressively instead of a risky rewrite to NestJS/Next.js.",
    }
