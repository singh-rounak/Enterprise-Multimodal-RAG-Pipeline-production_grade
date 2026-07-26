from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Centralized application settings using Pydantic's BaseSettings.
    This class reads configuration values from environment variables or a .env file,
    providing a structured way to manage application settings.
    """

    # ==========================
    #       Application
    # ==========================
    app_name: str = "VectorMind"
    app_version: str = "2.0.0"
    environment: str = "development"  # Options: development, staging, production

    # ==========================
    #          API
    # ==========================
    api_prefix: str = "/api/v1"

    # ==========================
    #          CORS
    # ==========================
    cors_origins: list[str] = Field(default_factory=lambda: ["*"])

    # ==========================
    #          Ollama
    # ==========================
    ollama_base_url: str = Field(default="http://localhost:11434")
    llm_model: str = Field(default="phi3:mini")
    llm_request_timeout: int = 120

    # ==========================
    #         Embedding model
    # ==========================
    embedding_model: str = Field(default="sentence-transformers/all-MiniLM-L6-v2")
    embedding_dimension: int = 384

    # ==========================
    #          Qdrant
    # ==========================
    qdrant_host: str = "localhost"
    qdrant_port: int = 6333
    qdrant_collection: str = "documents"

    # ==========================
    #          Uploads
    # ==========================
    upload_dir: str = "uploads"
    max_upload_size_mb: int = 25

    # ==========================
    #          Retrieval
    # ==========================
    retrieval_top_k: int = 5

    # ==========================
    #          Logging
    # ==========================
    log_level: str = "INFO"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    """
    Returns a cached instance of the Settings class.
    This function ensures that the settings are loaded only once and reused
    across the application.
    """
    return Settings()


# Module-level singleton so `from app.core.config import settings` works
# everywhere else in the codebase.
settings = get_settings()
