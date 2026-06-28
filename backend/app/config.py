from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    app_name: str = "AgentHub AI"
    app_version: str = "0.1.0"
    debug: bool = False
    host: str = "0.0.0.0"
    port: int = 8000
    # Comma-separated in env, e.g. CORS_ORIGINS=http://localhost:3000,https://example.com
    # Defaults cover the Next.js dev server (3000) and common alt ports.
    cors_origins: str = (
        "http://localhost:3000,http://127.0.0.1:3000,"
        "http://localhost:3001,http://127.0.0.1:3001"
    )

    aicoo_api_key: str | None = None
    aicoo_base_url: str = "https://www.aicoo.io"
    supabase_url: str | None = None
    supabase_service_role_key: str | None = None
    ai_api_key: str | None = None
    openai_api_key: str | None = None
    groq_api_key: str | None = None
    database_url: str | None = None


settings = Settings()
