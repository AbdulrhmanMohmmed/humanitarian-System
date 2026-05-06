# Database migrations

This project now uses Alembic to track schema changes for PostgreSQL/PostGIS and SQLite development databases.

Useful commands from the `backend` directory:

```powershell
python -m alembic current
python -m alembic revision --autogenerate -m "describe change"
python -m alembic upgrade head
```

The existing local database is stamped at `0001_baseline`. New structural changes should be introduced as Alembic revisions instead of relying on automatic table creation.
