"""
Authentication routes
"""

import logging
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, Depends, Header
from fastapi.responses import JSONResponse
from app.services.auth_service import get_auth_service, AuthService
from app.models.users import (
    LoginRequest, RegisterRequest, PasswordResetRequest, 
    PasswordUpdateRequest, EmailVerificationRequest, RefreshTokenRequest
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register")
async def register(
    request: RegisterRequest,
    auth_service: AuthService = Depends(get_auth_service)
) -> Dict[str, Any]:
    """
    Register a new user
    """
    try:
        result = await auth_service.register_user(request)
        
        if result["success"]:
            return {
                "message": result["message"],
                "user": result.get("user"),
                "session": result.get("session")
            }
        else:
            raise HTTPException(
                status_code=400,
                detail=result["error"]
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Registration endpoint error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Errore interno del server durante la registrazione"
        )


@router.post("/login")
async def login(
    request: LoginRequest,
    auth_service: AuthService = Depends(get_auth_service)
) -> Dict[str, Any]:
    """
    Login user
    """
    try:
        result = await auth_service.login_user(request)
        
        if result["success"]:
            return {
                "message": result["message"],
                "user": result["user"],
                "session": result.get("session"),
                "access_token": result.get("access_token"),
                "refresh_token": result.get("refresh_token"),
                "token_type": "bearer"
            }
        else:
            raise HTTPException(
                status_code=401,
                detail=result["error"]
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Login endpoint error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Errore interno del server durante il login"
        )


@router.post("/logout")
async def logout(
    authorization: str = Header(None),
    auth_service: AuthService = Depends(get_auth_service)
) -> Dict[str, Any]:
    """
    Logout user
    """
    try:
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(
                status_code=401,
                detail="Token di accesso mancante"
            )
        
        access_token = authorization.split(" ")[1]
        result = await auth_service.logout_user(access_token)
        
        if result["success"]:
            return {"message": result["message"]}
        else:
            raise HTTPException(
                status_code=400,
                detail=result["error"]
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Logout endpoint error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Errore interno del server durante il logout"
        )


@router.get("/me")
async def get_current_user(
    authorization: str = Header(None),
    auth_service: AuthService = Depends(get_auth_service)
) -> Dict[str, Any]:
    """
    Get current user information
    """
    try:
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(
                status_code=401,
                detail="Token di accesso mancante"
            )
        
        access_token = authorization.split(" ")[1]
        result = await auth_service.get_current_user(access_token)
        
        if result["success"]:
            return {"user": result["user"]}
        else:
            raise HTTPException(
                status_code=401,
                detail=result["error"]
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Get current user endpoint error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Errore interno del server"
        )


@router.post("/refresh")
async def refresh_token(
    request: RefreshTokenRequest,
    auth_service: AuthService = Depends(get_auth_service)
) -> Dict[str, Any]:
    """
    Refresh access token
    """
    try:
        result = await auth_service.refresh_token(request.refresh_token)
        
        if result["success"]:
            return {
                "access_token": result["access_token"],
                "refresh_token": result["refresh_token"],
                "token_type": "bearer",
                "session": result.get("session")
            }
        else:
            raise HTTPException(
                status_code=401,
                detail=result["error"]
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Refresh token endpoint error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Errore interno del server durante il refresh del token"
        )


@router.post("/forgot-password")
async def forgot_password(
    request: PasswordResetRequest,
    auth_service: AuthService = Depends(get_auth_service)
) -> Dict[str, Any]:
    """
    Send password reset email
    """
    try:
        result = await auth_service.reset_password(request)
        
        if result["success"]:
            return {"message": result["message"]}
        else:
            raise HTTPException(
                status_code=400,
                detail=result["error"]
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Forgot password endpoint error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Errore interno del server durante l'invio dell'email di reset"
        )


@router.post("/update-password")
async def update_password(
    request: PasswordUpdateRequest,
    authorization: str = Header(None),
    auth_service: AuthService = Depends(get_auth_service)
) -> Dict[str, Any]:
    """
    Update user password
    """
    try:
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(
                status_code=401,
                detail="Token di accesso mancante"
            )
        
        access_token = authorization.split(" ")[1]
        result = await auth_service.update_password(request, access_token)
        
        if result["success"]:
            return {
                "message": result["message"],
                "user": result.get("user")
            }
        else:
            raise HTTPException(
                status_code=400,
                detail=result["error"]
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Update password endpoint error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Errore interno del server durante l'aggiornamento della password"
        )


@router.post("/update-profile")
async def update_profile(
    profile_data: Dict[str, Any],
    authorization: str = Header(None),
    auth_service: AuthService = Depends(get_auth_service)
) -> Dict[str, Any]:
    """
    Update user profile
    """
    try:
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(
                status_code=401,
                detail="Token di accesso mancante"
            )
        
        access_token = authorization.split(" ")[1]
        result = await auth_service.update_user_profile(profile_data, access_token)
        
        if result["success"]:
            return {
                "message": result["message"],
                "user": result.get("user")
            }
        else:
            raise HTTPException(
                status_code=400,
                detail=result["error"]
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Update profile endpoint error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Errore interno del server durante l'aggiornamento del profilo"
        )


@router.post("/verify-email")
async def verify_email(
    request: EmailVerificationRequest,
    auth_service: AuthService = Depends(get_auth_service)
) -> Dict[str, Any]:
    """
    Verify email with token
    """
    try:
        result = await auth_service.verify_email(request.token)
        
        if result["success"]:
            return {
                "message": result["message"],
                "user": result.get("user")
            }
        else:
            raise HTTPException(
                status_code=400,
                detail=result["error"]
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Verify email endpoint error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Errore interno del server durante la verifica dell'email"
        )


@router.get("/health")
async def auth_health_check() -> Dict[str, Any]:
    """
    Authentication service health check
    """
    try:
        return {
            "status": "healthy",
            "service": "authentication",
            "timestamp": "2024-01-01T00:00:00Z"
        }
    except Exception as e:
        logger.error(f"❌ Auth health check error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Servizio di autenticazione non disponibile"
        )
