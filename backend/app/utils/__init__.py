"""
Utilities module
"""

from .exceptions import (
    CustomException,
    ValidationError,
    NotFoundError,
    DatabaseError,
    FileProcessingError,
    AIServiceError,
    AuthenticationError,
    AuthorizationError,
    RateLimitError,
    ConfigurationError,
    ExternalServiceError,
    BusinessLogicError,
    raise_not_found,
    raise_validation_error,
    raise_database_error,
    raise_file_processing_error,
    raise_ai_service_error,
    raise_business_logic_error
)

__all__ = [
    "CustomException",
    "ValidationError",
    "NotFoundError",
    "DatabaseError",
    "FileProcessingError",
    "AIServiceError",
    "AuthenticationError",
    "AuthorizationError",
    "RateLimitError",
    "ConfigurationError",
    "ExternalServiceError",
    "BusinessLogicError",
    "raise_not_found",
    "raise_validation_error",
    "raise_database_error",
    "raise_file_processing_error",
    "raise_ai_service_error",
    "raise_business_logic_error"
]
