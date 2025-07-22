"""
Application settings and configuration
"""

import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator


class Settings(BaseSettings):
    """Application settings"""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )
    
    # Environment
    ENVIRONMENT: str = Field(default="development", description="Environment name")
    DEBUG: bool = Field(default=True, description="Debug mode")
    SECRET_KEY: str = Field(default="your-secret-key-change-in-production", description="Secret key for JWT")
    ALGORITHM: str = Field(default="HS256", description="JWT algorithm")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30, description="JWT token expiration")
    
    # Supabase Configuration
    SUPABASE_URL: str = Field(..., description="Supabase project URL")
    SUPABASE_KEY: str = Field(..., description="Supabase anon key")
    SUPABASE_SERVICE_KEY: str = Field(..., description="Supabase service role key")
    
    # OpenAI Configuration
    OPENAI_API_KEY: str = Field(..., description="OpenAI API key")
    OPENAI_MODEL: str = Field(default="gpt-4o-mini", description="OpenAI model to use")
    OPENAI_MAX_TOKENS: int = Field(default=2000, description="Max tokens for OpenAI responses")
    OPENAI_TEMPERATURE: float = Field(default=0.1, description="OpenAI temperature")
    
    # File Upload Configuration
    MAX_FILE_SIZE: int = Field(default=52428800, description="Max file size in bytes (50MB)")
    UPLOAD_DIR: str = Field(default="./uploads", description="Local upload directory")
    ALLOWED_FILE_TYPES: str = Field(
        default="pdf,docx,doc", 
        description="Allowed file extensions (comma-separated)"
    )
    
    # CORS Configuration
    ALLOWED_ORIGINS: str = Field(
        default="http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001,https://brokerai.speats.ch",
        description="Allowed CORS origins (comma-separated)"
    )
    
    # Database Configuration
    DATABASE_POOL_SIZE: int = Field(default=10, description="Database connection pool size")
    DATABASE_MAX_OVERFLOW: int = Field(default=20, description="Database max overflow connections")
    
    # Redis Configuration (for future caching)
    REDIS_URL: str = Field(default="redis://localhost:6379/0", description="Redis URL")
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = Field(default=60, description="API rate limit per minute")
    OPENAI_RATE_LIMIT_PER_MINUTE: int = Field(default=10, description="OpenAI API rate limit per minute")
    
    # Logging
    LOG_LEVEL: str = Field(default="INFO", description="Logging level")
    LOG_FORMAT: str = Field(
        default="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        description="Log format"
    )
    
    # Storage Configuration
    SUPABASE_STORAGE_BUCKET: str = Field(default="polizze", description="Supabase storage bucket name")
    
    # AI Analysis Configuration
    AI_CONFIDENCE_THRESHOLD: float = Field(default=0.7, description="Minimum AI confidence threshold")
    AI_RETRY_ATTEMPTS: int = Field(default=3, description="Number of retry attempts for AI calls")
    AI_RETRY_DELAY: float = Field(default=1.0, description="Delay between AI retry attempts")
    
    # Pagination
    DEFAULT_PAGE_SIZE: int = Field(default=20, description="Default pagination page size")
    MAX_PAGE_SIZE: int = Field(default=100, description="Maximum pagination page size")
    
    # Stripe Configuration
    STRIPE_SECRET_KEY: str = Field(..., description="Stripe secret key")
    STRIPE_PUBLISHABLE_KEY: str = Field(..., description="Stripe publishable key")
    STRIPE_WEBHOOK_SECRET: str = Field(..., description="Stripe webhook secret")
    
    # Autumn Billing
    AUTUMN_SECRET_KEY: str = Field(..., description="Autumn API secret key")
    
    @property
    def allowed_origins_list(self) -> List[str]:
        """Get ALLOWED_ORIGINS as a list"""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(',') if origin.strip()]
    
    @property
    def allowed_file_types_list(self) -> List[str]:
        """Get ALLOWED_FILE_TYPES as a list"""
        return [file_type.strip() for file_type in self.ALLOWED_FILE_TYPES.split(',') if file_type.strip()]
        
    def get_database_url(self) -> str:
        """Get database URL for Supabase"""
        return f"{self.SUPABASE_URL}/rest/v1/"
    
    def get_storage_url(self) -> str:
        """Get storage URL for Supabase"""
        return f"{self.SUPABASE_URL}/storage/v1/"
    
    def is_production(self) -> bool:
        """Check if running in production"""
        return self.ENVIRONMENT.lower() == "production"
    
    def is_development(self) -> bool:
        """Check if running in development"""
        return self.ENVIRONMENT.lower() == "development"


# Create settings instance
settings = Settings()
