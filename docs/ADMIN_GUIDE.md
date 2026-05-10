# HIAOS Administrator Guide
# دليل المسؤول — نظام HIAOS

## System Requirements

### Development
- Python 3.11+
- Node.js 20+
- PostgreSQL 15+ (recommended) or SQLite (dev only)
- Redis 7+ (optional, for caching/celery)

### Production
- PostgreSQL 15+ (required)
- Redis 7+
- MinIO or S3-compatible storage
- 2+ CPU cores, 4GB+ RAM

## Installation

### Quick Start (Development)
```bash
# Clone
git clone https://github.com/AbdulrhmanMohmmed/humanitarian-System.git
cd humanitarian-System

# Backend
cd backend
pip install -r requirements.txt
cp .env.example .env  # Edit with your settings
python main.py

# Frontend (in new terminal)
cd frontend
npm install
npm run dev
```

### Docker Compose (Recommended)
```bash
docker-compose up -d
```

Services:
- Backend: http://localhost:8000
- Frontend: http://localhost:5173
- PostgreSQL: localhost:5432
- Redis: localhost:6379
- MinIO: http://localhost:9000

### Kubernetes
```bash
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/monitoring.yaml
kubectl apply -f k8s/backup-cronjob.yaml
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql+psycopg://...` | Database connection |
| `SECRET_KEY` | (change!) | JWT signing key |
| `ENVIRONMENT` | `development` | `development` or `production` |
| `AUTO_CREATE_TABLES` | `true` | Auto-create DB tables (disable in prod) |
| `OPENAI_API_KEY` | (empty) | OpenAI API key for AI features |
| `SMTP_HOST` | (empty) | SMTP server for email |
| `SMTP_PORT` | `587` | SMTP port |
| `ENABLED_MODULES` | all | Comma-separated module list |

### Module Management
Enable/disable modules via `ENABLED_MODULES`:
```env
ENABLED_MODULES=core,meal,projects,finance,hr,beneficiaries
```

Available modules: core, meal, projects, finance, hr, inventory, data_collection, beneficiaries, documents, integrations, procurement, grants, logistics, payroll, ai_hub, strategic, risk, partners, financial_engine, communications, security, accounting, meal_advanced, hr_advanced, supply_chain, standards, protection, emergency, camps, nutrition, wash, education, livelihoods, early_warning, bulk, search

## Database Management

### Migrations
```bash
cd backend
alembic upgrade head      # Apply all migrations
alembic downgrade -1      # Rollback one migration
alembic history           # View migration history
```

### Backup (Manual)
```bash
pg_dump -U hiaos hiaos | gzip > backup_$(date +%Y%m%d).sql.gz
```

### Restore
```bash
gunzip -c backup_20260507.sql.gz | psql -U hiaos hiaos
```

## Security

### Production Checklist
- [ ] Change `SECRET_KEY` to a random 256-bit value
- [ ] Change `WEBHOOK_SIGNING_SECRET`
- [ ] Set `ENVIRONMENT=production`
- [ ] Set `AUTO_CREATE_TABLES=false`
- [ ] Enable HTTPS (SSL/TLS) via reverse proxy
- [ ] Configure `CORS_ORIGINS` to your domain only
- [ ] Enable MFA for all admin accounts
- [ ] Set up database backups (daily)
- [ ] Configure IP whitelist for admin access
- [ ] Set up monitoring (Prometheus + Grafana)

### Default Credentials
- Admin: `admin` / `Admin123!`
- **Change immediately in production!**

## Monitoring

### Health Checks
- Liveness: `GET /health`
- Readiness: `GET /health/ready`
- Metrics: `GET /metrics`

### Grafana Dashboards
After deploying monitoring stack, access Grafana at port 3000.

## Roles & Permissions
| Role | Access |
|------|--------|
| ADMIN | Full access |
| MANAGER | Projects, Finance, HR, Reports |
| COORDINATOR | Projects, Beneficiaries, MEAL |
| FIELD_OFFICER | Data collection, Distributions |
| FINANCE_OFFICER | Finance, Grants, Accounting |
| VIEWER | Read-only |
