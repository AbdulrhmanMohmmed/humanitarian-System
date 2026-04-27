import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.database import engine, Base
from app.routers import auth, beneficiaries, projects, finance, hr, inventory, monitoring, cash, dashboard, data_collection, reports, documents, accountability, learning, logframe, analytics
from app.seed import seed_database

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="نظام إدارة العمل الإنساني",
    description="نظام متكامل لإدارة منظمات العمل الإنساني في اليمن",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(beneficiaries.router)
app.include_router(projects.router)
app.include_router(finance.router)
app.include_router(hr.router)
app.include_router(inventory.router)
app.include_router(monitoring.router)
app.include_router(cash.router)
app.include_router(data_collection.router)
app.include_router(reports.router)
app.include_router(documents.router)
app.include_router(accountability.router)
app.include_router(learning.router)
app.include_router(logframe.router)
app.include_router(analytics.router)

# Serve frontend static files
FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")
if os.path.exists(FRONTEND_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIR, "assets")), name="assets")

    @app.get("/{path:path}")
    async def serve_frontend(path: str):
        file_path = os.path.join(FRONTEND_DIR, path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))
else:
    @app.get("/")
    def root():
        return {"message": "نظام إدارة العمل الإنساني - اليمن", "version": "1.0.0"}


@app.on_event("startup")
def startup():
    seed_database()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
