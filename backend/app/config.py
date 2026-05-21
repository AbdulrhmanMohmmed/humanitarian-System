import os
import sys
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # ── Core ────────────────────────────────────────────────────────────────
    APP_NAME: str = "نظام إدارة العمل الإنساني — HIAOS"
    APP_VERSION: str = "2.0.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")  # development | production

    # ── Database ─────────────────────────────────────────────────────────────
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql+psycopg://hiaos:hiaos@localhost:5432/hiaos")
    DB_POOL_SIZE: int = int(os.getenv("DB_POOL_SIZE", "10"))
    DB_MAX_OVERFLOW: int = int(os.getenv("DB_MAX_OVERFLOW", "20"))
    DB_POOL_TIMEOUT: int = int(os.getenv("DB_POOL_TIMEOUT", "30"))

    # ── Security ─────────────────────────────────────────────────────────────
    SECRET_KEY: str = os.getenv("SECRET_KEY", "CHANGE-THIS-IN-PRODUCTION-USE-256-BIT-RANDOM-KEY")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "30"))
    WEBHOOK_SIGNING_SECRET: str = os.getenv("WEBHOOK_SIGNING_SECRET", "CHANGE-THIS-IN-PRODUCTION")

    # ── PII Encryption ────────────────────────────────────────────────────────
    # 32-byte (256-bit) key for AES-256 encryption of PII data
    # Generate with: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
    PII_ENCRYPTION_KEY: str = os.getenv("PII_ENCRYPTION_KEY", "")

    # ── Rate Limiting ─────────────────────────────────────────────────────────
    RATE_LIMIT_DEFAULT: str = os.getenv("RATE_LIMIT_DEFAULT", "200/minute")
    RATE_LIMIT_AUTH: str = os.getenv("RATE_LIMIT_AUTH", "10/minute")
    RATE_LIMIT_REPORTS: str = os.getenv("RATE_LIMIT_REPORTS", "30/minute")
    RATE_LIMIT_AI: str = os.getenv("RATE_LIMIT_AI", "20/minute")

    # ── CORS ──────────────────────────────────────────────────────────────────
    CORS_ORIGINS: str = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:8000"
    )

    # ── Redis ─────────────────────────────────────────────────────────────────
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    # ── Storage (S3 / MinIO) ──────────────────────────────────────────────────
    S3_ENDPOINT_URL: str = os.getenv("S3_ENDPOINT_URL", "http://localhost:9000")
    S3_BUCKET: str = os.getenv("S3_BUCKET", "humanitarian-system")
    S3_ACCESS_KEY_ID: str = os.getenv("S3_ACCESS_KEY_ID", "minioadmin")
    S3_SECRET_ACCESS_KEY: str = os.getenv("S3_SECRET_ACCESS_KEY", "minioadmin")
    S3_REGION: str = os.getenv("S3_REGION", "us-east-1")

    # ── AI / OpenAI ───────────────────────────────────────────────────────────
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o")
    OPENAI_MAX_TOKENS: int = int(os.getenv("OPENAI_MAX_TOKENS", "2048"))
    AI_ENABLED: bool = bool(os.getenv("OPENAI_API_KEY", ""))

    # ── Keycloak (optional SSO) ───────────────────────────────────────────────
    KEYCLOAK_URL: str = os.getenv("KEYCLOAK_URL", "http://localhost:8080")
    KEYCLOAK_REALM: str = os.getenv("KEYCLOAK_REALM", "humanitarian")
    KEYCLOAK_CLIENT_ID: str = os.getenv("KEYCLOAK_CLIENT_ID", "humanitarian-web")
    SSO_ENABLED: bool = os.getenv("SSO_ENABLED", "false").lower() in {"1", "true", "yes"}

    # ── Feature Flags ─────────────────────────────────────────────────────────
    AUTO_CREATE_TABLES: bool = os.getenv("AUTO_CREATE_TABLES", "true").lower() in {"1", "true", "yes", "on"}
    ENABLE_WEBSOCKETS: bool = os.getenv("ENABLE_WEBSOCKETS", "true").lower() in {"1", "true", "yes"}
    ENABLE_CELERY: bool = os.getenv("ENABLE_CELERY", "false").lower() in {"1", "true", "yes"}
    ENABLE_METRICS: bool = os.getenv("ENABLE_METRICS", "true").lower() in {"1", "true", "yes"}

    # ── Logging ───────────────────────────────────────────────────────────────
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    LOG_FORMAT: str = os.getenv("LOG_FORMAT", "json")  # json | text

    # ── Celery ────────────────────────────────────────────────────────────────
    CELERY_BROKER_URL: str = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/1")
    CELERY_RESULT_BACKEND: str = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/2")

    # ── Modules (Modular SaaS) ────────────────────────────────────────────────
    # List of modules to enable. If empty, only 'core' is enabled.
    # Available: meal, projects, finance, hr, inventory, data_collection, beneficiaries, documents, integrations
    # ── Email / SMTP ─────────────────────────────────────────────────────────
    SMTP_HOST: str = os.getenv("SMTP_HOST", "")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM: str = os.getenv("SMTP_FROM", "noreply@hiaos.org")

    # ── KoBoToolbox Integration ──────────────────────────────────────────────
    KOBO_API_URL: str = os.getenv("KOBO_API_URL", "https://kf.kobotoolbox.org/api/v2")
    KOBO_API_TOKEN: str = os.getenv("KOBO_API_TOKEN", "")

    ENABLED_MODULES: str = os.getenv(
        "ENABLED_MODULES",
        "core,meal,projects,finance,hr,inventory,data_collection,beneficiaries,documents,integrations,procurement,grants,gis,logistics,payroll,ai_hub,strategic,risk,partners,financial_engine,communications,security,accounting,meal_advanced,hr_advanced,supply_chain,standards,protection,emergency,camps,nutrition,wash,education,livelihoods,early_warning,bulk,search,geographic"
    )

    @property
    def DEBUG(self) -> bool:
        return not self.is_production

    @property
    def enabled_modules_list(self) -> list[str]:
        mods = [m.strip().lower() for m in self.ENABLED_MODULES.split(",") if m.strip()]
        if "core" not in mods:
            mods.append("core")
        return mods

    def is_module_enabled(self, module_name: str) -> bool:
        return module_name.lower() in self.enabled_modules_list

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    @property
    def is_sqlite(self) -> bool:
        return self.DATABASE_URL.startswith("sqlite")

    def validate_production_secrets(self) -> None:
        """Abort startup if running in production with default/weak secrets."""
        if not self.is_production:
            return

        dangerous_defaults = {
            "SECRET_KEY": ["CHANGE-THIS-IN-PRODUCTION-USE-256-BIT-RANDOM-KEY", "humanitarian-system-secret-key-change-in-production"],
            "WEBHOOK_SIGNING_SECRET": ["CHANGE-THIS-IN-PRODUCTION", "change-in-production"],
        }
        for field, defaults in dangerous_defaults.items():
            val = getattr(self, field, "")
            if val in defaults:
                print(
                    f"\n🔴 FATAL: {field} is using an insecure default value in production!\n"
                    "Set a strong random value in your .env file and restart.\n",
                    file=sys.stderr,
                )
                sys.exit(1)

        if self.is_sqlite:
            print(
                "\n🔴 FATAL: SQLite is not supported in production. "
                "Set DATABASE_URL to a PostgreSQL connection string.\n",
                file=sys.stderr,
            )
            sys.exit(1)

    class Config:
        env_file = ".env"


settings = Settings()
settings.validate_production_secrets()
