from sqlalchemy import inspect, text

from app.database import engine


def ensure_runtime_columns() -> None:
    if not engine.url.drivername.startswith("sqlite"):
        return

    required = {
        "beneficiaries": {"custom_values_json": "TEXT DEFAULT '{}'"},
        "projects": {"custom_values_json": "TEXT DEFAULT '{}'"},
        "activities": {"custom_values_json": "TEXT DEFAULT '{}'"},
        "indicators": {"custom_values_json": "TEXT DEFAULT '{}'"},
        "complaints": {"custom_values_json": "TEXT DEFAULT '{}'"},
        "field_visits": {"custom_values_json": "TEXT DEFAULT '{}'"},
        "documents": {"custom_values_json": "TEXT DEFAULT '{}'"},
        "grants": {"custom_values_json": "TEXT DEFAULT '{}'"},
        "transactions": {"custom_values_json": "TEXT DEFAULT '{}'"},
    }

    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())
    with engine.begin() as connection:
        for table, columns in required.items():
            if table not in existing_tables:
                continue
            existing_columns = {column["name"] for column in inspector.get_columns(table)}
            for column, definition in columns.items():
                if column not in existing_columns:
                    connection.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {definition}"))
