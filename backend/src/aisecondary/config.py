"""Application configuration loaded from environment variables."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import Field, computed_field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Centralized configuration for the Tornado application."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "AISecretary"
    debug: bool = False
    host: str = "0.0.0.0"
    port: int = Field(default=8787, alias="APP_PORT")

    postgres_host: str = Field(default="localhost", alias="POSTGRES_HOST")
    postgres_port: int = Field(default=5432, alias="POSTGRES_PORT")
    postgres_db: str = Field(default="aisecretary_db", alias="POSTGRES_DB")
    postgres_user: str = Field(default="postgres", alias="POSTGRES_USER")
    postgres_password: str = Field(default="postgres", alias="POSTGRES_PASSWORD")

    database_ai_url: str | None = Field(default=None, alias="DATABASE_AI_URL")

    cors_allow_origins: list[str] = Field(default_factory=lambda: ["*"], alias="CORS_ALLOW_ORIGINS")
    cors_allow_headers: str = Field(
        default="Content-Type, Authorization, X-Requested-With", alias="CORS_ALLOW_HEADERS"
    )
    cors_allow_methods: str = Field(
        default="GET, POST, PUT, PATCH, DELETE, OPTIONS", alias="CORS_ALLOW_METHODS"
    )
    cors_allow_credentials: bool = Field(default=True, alias="CORS_ALLOW_CREDENTIALS")

    jwt_secret: str = Field(alias="JWT_SECRET")
    jwt_exp_minutes: int = Field(default=60, alias="JWT_EXP_MINUTES")

    echo: bool = Field(default=False, alias="SQL_ECHO")

    @computed_field  # type: ignore[misc]
    @property
    def database_url(self) -> str:
        if self.database_ai_url:
            return self.database_ai_url
        return (
            f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @field_validator("cors_allow_origins", mode="before")
    @classmethod
    def _split_origins(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, str):
            entries = [origin.strip() for origin in value.split(",")]
            return [origin for origin in entries if origin]
        return value


@lru_cache
def get_settings() -> Settings:
    """Load settings once and cache for reuse."""
    env_path = Path(__file__).resolve().parents[3] / ".env"
    if env_path.exists():
        return Settings(_env_file=env_path)
    return Settings()


settings = get_settings()
