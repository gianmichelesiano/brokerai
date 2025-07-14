"""
Custom exceptions for the application
"""

from typing import Optional, Any


class CustomException(Exception):
    """Base custom exception class"""
    
    def __init__(
        self,
        message: str,
        status_code: int = 500,
        detail: Optional[str] = None,
        error_code: Optional[str] = None
    ):
        self.message = message
        self.status_code = status_code
        self.detail = detail
        self.error_code = error_code
        super().__init__(self.message)


class ValidationError(CustomException):
    """Validation error exception"""
    
    def __init__(self, message: str, detail: Optional[str] = None):
        super().__init__(
            message=message,
            status_code=422,
            detail=detail,
            error_code="VALIDATION_ERROR"
        )


class NotFoundError(CustomException):
    """Resource not found exception"""
    
    def __init__(self, resource: str, identifier: Any = None):
        message = f"{resource} non trovato"
        if identifier:
            message += f" (ID: {identifier})"
        
        super().__init__(
            message=message,
            status_code=404,
            detail=f"La risorsa '{resource}' richiesta non esiste",
            error_code="NOT_FOUND"
        )


class DatabaseError(CustomException):
    """Database operation error"""
    
    def __init__(self, message: str, detail: Optional[str] = None):
        super().__init__(
            message=f"Errore database: {message}",
            status_code=500,
            detail=detail,
            error_code="DATABASE_ERROR"
        )


class FileProcessingError(CustomException):
    """File processing error"""
    
    def __init__(self, message: str, detail: Optional[str] = None):
        super().__init__(
            message=f"Errore elaborazione file: {message}",
            status_code=400,
            detail=detail,
            error_code="FILE_PROCESSING_ERROR"
        )


class AIServiceError(CustomException):
    """AI service error"""
    
    def __init__(self, message: str, detail: Optional[str] = None):
        super().__init__(
            message=f"Errore servizio AI: {message}",
            status_code=503,
            detail=detail,
            error_code="AI_SERVICE_ERROR"
        )


class AuthenticationError(CustomException):
    """Authentication error"""
    
    def __init__(self, message: str = "Autenticazione richiesta"):
        super().__init__(
            message=message,
            status_code=401,
            detail="Credenziali non valide o token scaduto",
            error_code="AUTHENTICATION_ERROR"
        )


class AuthorizationError(CustomException):
    """Authorization error"""
    
    def __init__(self, message: str = "Accesso non autorizzato"):
        super().__init__(
            message=message,
            status_code=403,
            detail="Non hai i permessi necessari per questa operazione",
            error_code="AUTHORIZATION_ERROR"
        )


class RateLimitError(CustomException):
    """Rate limit exceeded error"""
    
    def __init__(self, message: str = "Limite di richieste superato"):
        super().__init__(
            message=message,
            status_code=429,
            detail="Troppe richieste. Riprova più tardi",
            error_code="RATE_LIMIT_ERROR"
        )


class ConfigurationError(CustomException):
    """Configuration error"""
    
    def __init__(self, message: str, detail: Optional[str] = None):
        super().__init__(
            message=f"Errore configurazione: {message}",
            status_code=500,
            detail=detail,
            error_code="CONFIGURATION_ERROR"
        )


class ExternalServiceError(CustomException):
    """External service error"""
    
    def __init__(self, service: str, message: str, detail: Optional[str] = None):
        super().__init__(
            message=f"Errore servizio esterno ({service}): {message}",
            status_code=503,
            detail=detail,
            error_code="EXTERNAL_SERVICE_ERROR"
        )


class BusinessLogicError(CustomException):
    """Business logic error"""
    
    def __init__(self, message: str, detail: Optional[str] = None):
        super().__init__(
            message=message,
            status_code=400,
            detail=detail,
            error_code="BUSINESS_LOGIC_ERROR"
        )


# Utility functions for common error scenarios
def raise_not_found(resource: str, identifier: Any = None) -> None:
    """Raise NotFoundError"""
    raise NotFoundError(resource, identifier)


def raise_validation_error(message: str, detail: Optional[str] = None) -> None:
    """Raise ValidationError"""
    raise ValidationError(message, detail)


def raise_database_error(message: str, detail: Optional[str] = None) -> None:
    """Raise DatabaseError"""
    raise DatabaseError(message, detail)


def raise_file_processing_error(message: str, detail: Optional[str] = None) -> None:
    """Raise FileProcessingError"""
    raise FileProcessingError(message, detail)


def raise_ai_service_error(message: str, detail: Optional[str] = None) -> None:
    """Raise AIServiceError"""
    raise AIServiceError(message, detail)


def raise_business_logic_error(message: str, detail: Optional[str] = None) -> None:
    """Raise BusinessLogicError"""
    raise BusinessLogicError(message, detail)
