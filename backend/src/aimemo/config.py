import json
from pathlib import Path
from functools import lru_cache
from typing import List, Optional

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


ENV_PATH = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=str(ENV_PATH), extra="ignore")

    host: str = Field("0.0.0.0", alias="APP_HOST")
    port: int = Field(8799, alias="APP_PORT")
    debug: bool = Field(False, alias="DEBUG")
    auto_create_db: bool = Field(True, alias="AUTO_CREATE_DB")

    database_url: str = Field(..., alias="DATABASE_URL")
    jwt_secret: str = Field(..., alias="JWT_SECRET")
    jwt_algorithm: str = Field("HS256", alias="JWT_ALGORITHM")
    jwt_expires_minutes: int = Field(60 * 24 * 7, alias="JWT_EXPIRES_MINUTES")

    cors_allow_origins: List[str] = Field(
        default_factory=lambda: [
            "http://localhost:8090",
            "http://localhost:8091",
            "http://localhost:8092",
        ],
        alias="CORS_ALLOW_ORIGINS",
    )

    google_client_id: Optional[str] = Field(None, alias="GOOGLE_CLIENT_ID")
    apple_client_id: Optional[str] = Field(None, alias="APPLE_CLIENT_ID")

    @staticmethod
    def _parse_list(value):
        if value is None:
            return []
        if isinstance(value, list):
            return value
        if isinstance(value, str):
            raw = value.strip()
            if not raw:
                return []
            if raw.startswith("["):
                return json.loads(raw)
            return [item.strip() for item in raw.split(",") if item.strip()]
        return value

    @field_validator("cors_allow_origins", mode="before")
    @classmethod
    def validate_cors_allow_origins(cls, value):
        return cls._parse_list(value)

    @field_validator("database_url", mode="before")
    @classmethod
    def validate_database_url(cls, value):
        if not isinstance(value, str):
            return value
        if value.startswith("postgresql://"):
            return "postgresql+asyncpg://" + value[len("postgresql://") :]
        if value.startswith("postgres://"):
            return "postgresql+asyncpg://" + value[len("postgres://") :]
        if "psycopg2" in value:
            raise ValueError("Use postgresql+asyncpg:// (psycopg2 is not supported on Python 3.13)")
        return value


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    settings = Settings()
    settings.cors_allow_origins = Settings._parse_list(settings.cors_allow_origins)
    return settings


settings = get_settings()
