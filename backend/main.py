import os
import time
from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.database import engine, Base
from app.config import settings
from app.middleware.logging import RequestLoggingMiddleware
from app.middleware.error_handler import register_error_handlers
from app.websocket import router as ws_router

# ── Import all routers ────────────────────────────────────────────────────────
from app.routers import (
    auth, beneficiaries, projects, finance, hr, inventory, monitoring,
    cash, dashboard, data_collection, reports, documents, accountability,
    learning, logframe, analytics, risks, meal_plan, safeguarding,
    activities, needs_assessment, notifications, executive, iptt,
    field_visits, recommendations, compliance, audit, sector_indicators,
    assessment_tools, offline_sync, kobo_integration, ai_assistant,
    yemen_locations, scheduled_reports, remote_monitoring, feedback_loop,
    integrations, operating, strategic_review, phase_one,
    system_architecture, customization, procurement, grants, logistics,
    hr_payroll, ai_hub, strategic,
    financial_engine, risk_management, partners,
    communications,
)
from app.seed import seed_database

# ── Rate Limiter ──────────────────────────────────────────────────────────────

limiter = Limiter(key_func=get_remote_address, default_limits=[settings.RATE_LIMIT_DEFAULT])

# ── Startup / Shutdown ────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown logic."""
    # Startup
    if settings.AUTO_CREATE_TABLES:
        Base.metadata.create_all(bind=engine)
    seed_database()
    yield
    # Shutdown (nothing needed for now)

# ── FastAPI App ───────────────────────────────────────────────────────────────

app = FastAPI(
    title="HIAOS — Humanitarian Intelligence & Accountability OS",
    description=(
        "نظام متكامل لإدارة منظمات العمل الإنساني\n\n"
        "**Version 2.0** — Professional Edition\n\n"
        "Features: MEAL, CFM, Finance, HR, Inventory, AI Advisor, Real-time Notifications"
    ),
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── Middleware Stack ──────────────────────────────────────────────────────────

# 0. Unified error handlers (validation, DB errors, unhandled exceptions)
register_error_handlers(app)

# 1. Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# 2. Structured request logging
app.add_middleware(RequestLoggingMiddleware)

# 3. CORS — explicit methods and headers (not wildcard)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=[
        "Authorization",
        "Content-Type",
        "Accept",
        "Accept-Language",
        "X-Request-ID",
        "X-Requested-With",
    ],
    expose_headers=["X-Request-ID", "Content-Disposition"],
)

# ── WebSocket ─────────────────────────────────────────────────────────────────

if settings.ENABLE_WEBSOCKETS:
    app.include_router(ws_router)

# ── API Routers (v1) Modular ──────────────────────────────────────────────────
# Mapping routers to modules
MODULE_MAP = {
    "core": [
        auth.router, dashboard.router, notifications.router, yemen_locations.router,
        customization.router, system_architecture.router
    ],
    "meal": [
        monitoring.router, accountability.router, learning.router, logframe.router,
        analytics.router, risks.router, meal_plan.router, safeguarding.router,
        activities.router, needs_assessment.router, executive.router, iptt.router,
        field_visits.router, recommendations.router, compliance.router, audit.router,
        sector_indicators.router, assessment_tools.router, remote_monitoring.router,
        feedback_loop.router, ai_assistant.router, scheduled_reports.router, reports.router
    ],
    "projects": [
        projects.router, phase_one.router, strategic_review.router, operating.router
    ],
    "finance": [finance.router, cash.router, grants.router],
    "hr": [hr.router],
    "inventory": [inventory.router],
    "procurement": [procurement.router],
    "grants": [grants.router],
    "logistics": [logistics.router],
    "payroll": [hr_payroll.router],
    "ai_hub": [ai_hub.router],
    "strategic": [strategic.router],
    "financial_engine": [financial_engine.router],
    "risk": [risk_management.router],
    "partners": [partners.router],
    "communications": [communications.router],
    "gis": [projects.router],  # GIS currently uses project data
    "data_collection": [data_collection.router, kobo_integration.router, offline_sync.router],
    "beneficiaries": [beneficiaries.router],
    "documents": [documents.router],
    "integrations": [integrations.router],
}

# ── Versioned API mounting ─────────────────────────────────────────────────────
# All module routers are mounted under /api/v1/ (canonical)
# and also under /api/ for backward compatibility.

api_v1 = APIRouter(prefix="/api/v1")
api_compat = APIRouter(prefix="/api")

for module_name, routers in MODULE_MAP.items():
    if settings.is_module_enabled(module_name):
        for router in routers:
            api_v1.include_router(router)
            api_compat.include_router(router)

app.include_router(api_v1)
app.include_router(api_compat)

# ── Health & Status Endpoints ─────────────────────────────────────────────────

@app.get("/health", tags=["System"], summary="Health Check")
async def health_check():
    """Liveness probe — returns 200 if app is running."""
    return {
        "status": "healthy",
        "version": "2.0.0",
        "environment": settings.ENVIRONMENT,
        "ai_enabled": settings.AI_ENABLED,
        "websockets_enabled": settings.ENABLE_WEBSOCKETS,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }


@app.get("/health/ready", tags=["System"], summary="Readiness Probe")
async def readiness_check():
    """Readiness probe — checks DB connectivity."""
    from app.database import SessionLocal
    from sqlalchemy import text
    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
        db_ok = True
    except Exception as e:
        db_ok = False
    finally:
        db.close()

    if not db_ok:
        return JSONResponse(status_code=503, content={"status": "not_ready", "db": "unavailable"})

    return {"status": "ready", "db": "ok"}


@app.get("/metrics", tags=["System"], summary="Basic Metrics")
async def basic_metrics():
    """Basic Prometheus-compatible metrics (requires no external library)."""
    from app.database import SessionLocal
    from app.models import User, Project, Beneficiary

    if settings.ENABLE_WEBSOCKETS:
        from app.websocket import manager
        online_users = manager.online_count()
    else:
        online_users = 0

    db = SessionLocal()
    try:
        return {
            "users_total": db.query(User).count(),
            "projects_total": db.query(Project).count(),
            "beneficiaries_total": db.query(Beneficiary).count(),
            "online_users": online_users,
        }
    finally:
        db.close()


@app.get("/api", tags=["System"])
@limiter.limit("30/minute")
async def api_root(request: Request):
    return {
        "status": "ok",
        "name": "HIAOS API",
        "version": "2.0.0",
        "docs": "/docs",
        "health": "/health",
    }

# ── Frontend Static Files ─────────────────────────────────────────────────────

FRONTEND_DIR = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), "frontend", "dist"
)

if os.path.exists(FRONTEND_DIR):
    app.mount(
        "/assets",
        StaticFiles(directory=os.path.join(FRONTEND_DIR, "assets")),
        name="assets",
    )

    @app.get("/{path:path}")
    async def serve_frontend(path: str):
        file_path = os.path.join(FRONTEND_DIR, path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))

# ── Development Entry Point ────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.ENVIRONMENT == "development",
        log_level=settings.LOG_LEVEL.lower(),
    )
