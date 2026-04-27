import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "نظام إدارة العمل الإنساني"
    DATABASE_URL: str = "sqlite:///./humanitarian.db"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "humanitarian-system-secret-key-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

settings = Settings()
