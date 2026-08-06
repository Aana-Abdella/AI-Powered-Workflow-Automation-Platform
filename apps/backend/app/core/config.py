from functools import lru_cache
from typing import Annotated, List

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=False)

    app_name: str = "FlowForge FastAPI"
    env: str = Field(default="development", alias="ENV")
    api_v1_prefix: str = "/api"
    backend_public_url: str = Field(default="http://localhost:4000", alias="BACKEND_PUBLIC_URL")

    database_url: str = Field(alias="DATABASE_URL")
    redis_url: str = Field(alias="REDIS_URL")

    jwt_secret: str = Field(alias="JWT_SECRET")
    jwt_refresh_secret: str = Field(alias="JWT_REFRESH_SECRET")
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7

    openai_api_key: str | None = Field(default=None, alias="OPENAI_API_KEY")
    openai_model: str = "gpt-4o-mini"

    cors_origins: Annotated[List[str], NoDecode] = Field(
        default=["http://localhost:3000"], alias="CORS_ORIGINS"
    )

    auth_rate_limit: str = "10/minute"
    webhook_rate_limit: str = "60/minute"
    api_rate_limit: str = "120/minute"

    free_plan_limit: int = 100
    admin_seed_email: str = "admin@flowforge.local"
    admin_seed_password: str = "Admin@12345"

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: str | List[str]) -> List[str]:
        if isinstance(value, str):
            if not value:
                return []
            return [item.strip() for item in value.split(",") if item.strip()]
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()
