# HIAOS Developer Guide
# دليل المطور — نظام HIAOS

## Architecture Overview

```
backend/
├── app/
│   ├── auth.py              # JWT authentication + RBAC
│   ├── config.py             # Settings (pydantic-settings)
│   ├── database.py           # SQLAlchemy engine + session
│   ├── events.py             # EventBus for decoupled modules
│   ├── pagination.py         # Server-side pagination
│   ├── models/               # SQLAlchemy models
│   │   ├── user.py           # User model (6 roles)
│   │   ├── finance.py        # Grant, Transaction
│   │   ├── accounting.py     # Chart of Accounts, Journal Entries
│   │   ├── security.py       # MFA, API Keys, Sessions
│   │   ├── new_modules.py    # Protection, Emergency, WASH, etc.
│   │   └── ...
│   ├── routers/              # FastAPI route handlers
│   ├── services/             # Business logic layer
│   ├── schemas/              # Pydantic request/response schemas
│   └── middleware/           # Error handling, security headers, logging
├── alembic/                  # Database migrations
├── tests/                    # pytest test suite
└── main.py                   # Application entry point

frontend/
├── src/
│   ├── main.jsx              # App entry + QueryClientProvider + i18n
│   ├── lib/
│   │   ├── queryClient.js    # TanStack Query configuration
│   │   └── i18n.js           # i18next setup (ar/en/fr)
│   ├── hooks/useApi.js       # Generic data-fetching hooks
│   ├── locales/              # Translation files
│   └── pages/                # React page components
└── vite.config.js            # Vite + test configuration
```

## Coding Standards

### Backend (Python)
- **Service Layer Pattern**: Business logic in `services/`, routers are thin handlers
- **Models**: SQLAlchemy declarative with type hints
- **Schemas**: Pydantic v2 BaseModel for request/response
- **Pagination**: Use `PaginationParams` + `paginate()` from `app.pagination`
- **Soft Delete**: Apply `SoftDeleteMixin` to sensitive entities
- **Error Handling**: Use `HTTPException` with Arabic error messages

### Frontend (React)
- **State Management**: TanStack Query (staleTime: 5min, gcTime: 30min)
- **i18n**: i18next with `useTranslation()` hook
- **Styling**: Tailwind CSS v4 with RTL support
- **Routing**: React Router v7 with lazy loading

## Adding a New Module

### 1. Create Model
```python
# backend/app/models/my_module.py
from sqlalchemy import Column, Integer, String
from app.database import Base

class MyEntity(Base):
    __tablename__ = "my_entities"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
```

### 2. Register in `models/__init__.py`
```python
from .my_module import MyEntity
```

### 3. Create Router
```python
# backend/app/routers/my_module.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.auth import get_current_user
from app.database import get_db
from app.pagination import PaginationParams, paginate

router = APIRouter(prefix="/my-module", tags=["My Module"])

@router.get("/")
def list_items(params: PaginationParams = Depends(), db: Session = Depends(get_db)):
    return paginate(db.query(MyEntity), params)
```

### 4. Register in `main.py`
```python
# Add to imports
from app.routers import my_module

# Add to MODULE_MAP
"my_module": [my_module.router],
```

### 5. Add to `ENABLED_MODULES` in config
```python
ENABLED_MODULES: str = "...,my_module"
```

### 6. Create Alembic Migration
```bash
cd backend
alembic revision --autogenerate -m "Add my_module tables"
```

## Testing

### Backend
```bash
cd backend
DATABASE_URL=sqlite:///./test.db pytest tests/ -v
```

### Frontend
```bash
cd frontend
npm run test        # Single run
npm run test:watch  # Watch mode
```

## API Conventions
- All list endpoints: paginated (page, page_size)
- All mutations: require JWT authentication
- Error responses: `{"detail": "Arabic error message"}`
- Date format: ISO 8601
- Currency: ISO 4217 codes
- IATI compliance: `/iati/activities.xml`

## Git Workflow
1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes with small, focused commits
3. Run tests: `pytest tests/ -v`
4. Create PR against `main`
5. Wait for CI to pass
6. Request review

## Useful Commands
```bash
# Run backend
cd backend && python main.py

# Run frontend
cd frontend && npm run dev

# Run all tests
cd backend && pytest tests/ -v && cd ../frontend && npm run test

# Generate migration
cd backend && alembic revision --autogenerate -m "description"

# Apply migrations
cd backend && alembic upgrade head
```
