"""Configuration management using Pydantic BaseSettings."""

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )
    
    # Application
    app_name: str = Field(default="DTQ")
    environment: str = Field(default="development")
    
    # Redis
    redis_url: str = Field(default="redis://localhost:6379/0")
    
    # Stream names
    job_stream: str = Field(default="dtq:jobs")
    dlq_stream: str = Field(default="dtq:dlq")
    job_events_stream: str = Field(default="dtq:job-events")
    
    # Consumer group
    consumer_group: str = Field(default="dtq:workers")
    
    # Retry configuration
    max_retries: int = Field(default=3)
    initial_backoff_ms: int = Field(default=1000)
    max_backoff_ms: int = Field(default=300000)  # 5 minutes


# Global settings instance
settings = Settings()

