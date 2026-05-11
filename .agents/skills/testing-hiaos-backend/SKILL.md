---
name: testing-hiaos-backend
description: End-to-end API testing for the HIAOS humanitarian system backend. Use when verifying backend API changes, new modules, or service logic.
---

# Testing HIAOS Backend API

## Prerequisites

- Python 3.11+ with `pyotp` installed (for MFA TOTP verification)
- Backend dependencies: `cd backend && pip install -r requirements.txt`

## Starting the Server

```bash
cd backend
DATABASE_URL=sqlite:///./test_e2e.db PYTHONPATH=. python -c "
from app.database import engine, Base
from app.models import *
Base.metadata.create_all(bind=engine)
print('Tables created')
"
DATABASE_URL=sqlite:///./test_e2e.db PYTHONPATH=. uvicorn main:app --host 0.0.0.0 --port 8000 &
```

Wait ~3 seconds, then verify with:
```bash
curl -s http://localhost:8000/health
# Expect: {"status":"healthy","version":"2.0.0",...}
```

**Important**: The health endpoint is at `/health` (not `/api/v1/health`).

## Authentication

Default admin credentials: `admin` / `admin123` (seeded via `seed_database()`).

```bash
export TOKEN=$(curl -s http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | \
  python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")
```

All authenticated endpoints require: `-H "Authorization: Bearer $TOKEN"`

## API Base URL

- Canonical: `http://localhost:8000/api/v1/`
- Backward compat: `http://localhost:8000/api/`

## Key Testing Patterns

### MFA/TOTP
```bash
# Setup
curl -s http://localhost:8000/api/v1/mfa/setup -H "Authorization: Bearer $TOKEN" -X POST
# Returns: {secret, qr_uri, backup_codes[8]}

# Confirm (generate TOTP code from secret)
TOTP_CODE=$(python3 -c "import pyotp; print(pyotp.TOTP('SECRET_HERE').now())")
curl -s http://localhost:8000/api/v1/mfa/confirm -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -d "{\"code\":\"$TOTP_CODE\"}" -X POST
```

### Accounting (Double-Entry)
```bash
# Seed chart of accounts (idempotent — returns 0 if already seeded)
curl -s http://localhost:8000/api/v1/accounting/accounts/seed -H "Authorization: Bearer $TOKEN" -X POST

# Create journal entry — field is "date" NOT "entry_date"
curl -s http://localhost:8000/api/v1/accounting/journal-entries \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"reference":"JE-001","date":"2026-01-01","description":"Test","lines":[{"account_id":2,"debit":1000,"credit":0},{"account_id":12,"debit":0,"credit":1000}]}' -X POST
# Unbalanced entries return HTTP 400

# Trial balance — returns a LIST of account dicts, not a single object
curl -s http://localhost:8000/api/v1/accounting/trial-balance -H "Authorization: Bearer $TOKEN"
```

### Nutrition Screening
```bash
# Classification logic: muac<115→sam, muac<125→mam, else→normal
curl -s http://localhost:8000/api/v1/nutrition/screenings \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"beneficiary_id":1,"screening_date":"2026-01-01","muac":110}' -X POST
# Returns: {id, classification:"sam", referred:true}
```

### Early Warning (Auto-Alert)
```bash
# Create indicator with thresholds
curl -s http://localhost:8000/api/v1/early-warning/indicators \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Test","category":"food","threshold_warning":50,"threshold_critical":80}' -X POST

# Update value to breach threshold → auto-creates alert
curl -s http://localhost:8000/api/v1/early-warning/indicators/1/value \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"value":60}' -X PUT

# Check alerts
curl -s http://localhost:8000/api/v1/early-warning/alerts -H "Authorization: Bearer $TOKEN"
```

### Search
```bash
# min_length=2 enforced on query param
curl -s "http://localhost:8000/api/v1/search/?q=term" -H "Authorization: Bearer $TOKEN"
# Returns: {query, total, results: [{type, id, title, subtitle}]}
```

### Bulk Export
```bash
curl -s "http://localhost:8000/api/v1/bulk/export/beneficiaries?format=json" -H "Authorization: Bearer $TOKEN"
# Returns JSON array. Soft-deleted records are automatically excluded.
# Supported entities: beneficiaries, projects, grants, transactions
```

## Running Unit Tests

```bash
cd backend && PYTHONPATH=. DATABASE_URL=sqlite:///./test.db pytest tests/ -v
# Expect: 33 tests passing
```

## Common Gotchas

1. **Accounting schema**: The journal entry field is `date` (Python `date` type), NOT `entry_date`
2. **Trial balance**: Returns a `list[dict]`, not a single dict with totals
3. **Health endpoint**: At `/health`, not under `/api/v1/`
4. **Search min length**: Query param `q` requires at least 2 characters (422 otherwise)
5. **Beneficiary model**: Has `first_name` and `last_name` — NOT `full_name` or `email`
6. **Seed idempotency**: `accounts/seed` returns `{seeded: 0}` if already seeded
7. **Database**: Uses SQLite for testing (override with `DATABASE_URL` env var); production uses PostgreSQL

## Devin Secrets Needed

None required for local testing. Admin credentials are seeded automatically.
