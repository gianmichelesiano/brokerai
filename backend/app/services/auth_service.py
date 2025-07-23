"""
Authentication service using Supabase
"""

import logging
from typing import Optional, Dict, Any
from datetime import datetime
from supabase import Client
from app.config.database import get_supabase, get_supabase_service
from app.models.users import (
    User, UserProfile, AuthResponse, LoginRequest, RegisterRequest,
    PasswordResetRequest, PasswordUpdateRequest, AuthError, AuthSuccess
)

logger = logging.getLogger(__name__)


class AuthService:
    """Authentication service"""
    
    def __init__(self):
        self.supabase: Client = get_supabase()
        self.supabase_service: Client = get_supabase_service()
    
    async def register_user(self, request: RegisterRequest) -> Dict[str, Any]:
        """Register a new user"""
        try:
            # Prepare user metadata
            user_metadata = {}
            if request.full_name:
                user_metadata["full_name"] = request.full_name
            
            # Register user with Supabase
            response = self.supabase.auth.sign_up({
                "email": request.email,
                "password": request.password,
                "options": {
                    "data": user_metadata
                }
            })
            
            if response.user:
                logger.info(f"✅ User registered successfully: {request.email}")
                return {
                    "success": True,
                    "message": "Registrazione completata. Controlla la tua email per confermare l'account.",
                    "user": self._format_user(response.user),
                    "session": response.session
                }
            else:
                logger.error(f"❌ Registration failed for {request.email}")
                return {
                    "success": False,
                    "error": "Registrazione fallita"
                }
                
        except Exception as e:
            logger.error(f"❌ Registration error for {request.email}: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def login_user(self, request: LoginRequest) -> Dict[str, Any]:
        """Login user"""
        try:
            response = self.supabase.auth.sign_in_with_password({
                "email": request.email,
                "password": request.password
            })
            
            if response.user and response.session:
                logger.info(f"✅ User logged in successfully: {request.email}")
                return {
                    "success": True,
                    "message": "Login effettuato con successo",
                    "user": self._format_user(response.user),
                    "session": response.session,
                    "access_token": response.session.access_token,
                    "refresh_token": response.session.refresh_token
                }
            else:
                logger.error(f"❌ Login failed for {request.email}")
                return {
                    "success": False,
                    "error": "Credenziali non valide"
                }
                
        except Exception as e:
            logger.error(f"❌ Login error for {request.email}: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def logout_user(self, access_token: str) -> Dict[str, Any]:
        """Logout user"""
        try:
            # Set the session token
            self.supabase.auth.set_session(access_token, "")
            
            # Sign out
            response = self.supabase.auth.sign_out()
            
            logger.info("✅ User logged out successfully")
            return {
                "success": True,
                "message": "Logout effettuato con successo"
            }
            
        except Exception as e:
            logger.error(f"❌ Logout error: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def get_current_user(self, access_token: str) -> Dict[str, Any]:
        """Get current user from token using Supabase REST API"""
        import httpx
        try:
            logger.info(f"🔍 AUTH SERVICE DEBUG - Validating token: {access_token[:20]}...")
            
            from app.config.settings import settings
            supabase_url = getattr(settings, "SUPABASE_URL", None)
            supabase_key = getattr(settings, "SUPABASE_KEY", None)
            
            logger.info(f"🔍 AUTH SERVICE DEBUG - Supabase URL: {supabase_url}")
            logger.info(f"🔍 AUTH SERVICE DEBUG - Supabase Key: {supabase_key[:20] if supabase_key else 'None'}...")
            
            if not supabase_url or not supabase_key:
                logger.error("❌ AUTH SERVICE DEBUG - Supabase URL o API KEY non configurati")
                raise Exception("Supabase URL o API KEY non configurati")
                
            url = f"{supabase_url}/auth/v1/user"
            headers = {
                "Authorization": f"Bearer {access_token}",
                "apikey": supabase_key
            }
            
            logger.info(f"🔍 AUTH SERVICE DEBUG - Making request to: {url}")
            
            async with httpx.AsyncClient() as client:
                resp = await client.get(url, headers=headers)
                
                logger.info(f"🔍 AUTH SERVICE DEBUG - Response status: {resp.status_code}")
                logger.info(f"🔍 AUTH SERVICE DEBUG - Response headers: {dict(resp.headers)}")
                
                if resp.status_code == 200:
                    user_data = resp.json()
                    logger.info(f"✅ AUTH SERVICE DEBUG - User validated: {user_data.get('email', 'unknown')}")
                    return {
                        "success": True,
                        "user": user_data
                    }
                else:
                    error_text = resp.text
                    logger.error(f"❌ AUTH SERVICE DEBUG - Token validation failed: {resp.status_code} - {error_text}")
                    return {
                        "success": False,
                        "error": f"Token non valido o scaduto ({resp.status_code}): {error_text}"
                    }
        except Exception as e:
            logger.error(f"❌ AUTH SERVICE DEBUG - Get user error: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def refresh_token(self, refresh_token: str) -> Dict[str, Any]:
        """Refresh access token"""
        try:
            response = self.supabase.auth.refresh_session(refresh_token)
            
            if response.session:
                logger.info("✅ Token refreshed successfully")
                return {
                    "success": True,
                    "session": response.session,
                    "access_token": response.session.access_token,
                    "refresh_token": response.session.refresh_token
                }
            else:
                return {
                    "success": False,
                    "error": "Token refresh fallito"
                }
                
        except Exception as e:
            logger.error(f"❌ Token refresh error: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def reset_password(self, request: PasswordResetRequest) -> Dict[str, Any]:
        """Send password reset email"""
        try:
            response = self.supabase.auth.reset_password_email(
                request.email,
                {
                    "redirect_to": "http://localhost:3000/auth/reset-password"
                }
            )
            
            logger.info(f"✅ Password reset email sent to: {request.email}")
            return {
                "success": True,
                "message": "Email di reset password inviata"
            }
            
        except Exception as e:
            logger.error(f"❌ Password reset error for {request.email}: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def update_password(self, request: PasswordUpdateRequest, access_token: str) -> Dict[str, Any]:
        """Update user password"""
        try:
            # Set the session token
            self.supabase.auth.set_session(access_token, "")
            
            # Update password
            response = self.supabase.auth.update_user({
                "password": request.password
            })
            
            if response.user:
                logger.info(f"✅ Password updated for user: {response.user.email}")
                return {
                    "success": True,
                    "message": "Password aggiornata con successo",
                    "user": self._format_user(response.user)
                }
            else:
                return {
                    "success": False,
                    "error": "Aggiornamento password fallito"
                }
                
        except Exception as e:
            logger.error(f"❌ Password update error: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def update_user_profile(self, user_data: Dict[str, Any], access_token: str) -> Dict[str, Any]:
        """Update user profile"""
        try:
            # Set the session token
            self.supabase.auth.set_session(access_token, "")
            
            # Update user
            response = self.supabase.auth.update_user({
                "data": user_data
            })
            
            if response.user:
                logger.info(f"✅ Profile updated for user: {response.user.email}")
                return {
                    "success": True,
                    "message": "Profilo aggiornato con successo",
                    "user": self._format_user(response.user)
                }
            else:
                return {
                    "success": False,
                    "error": "Aggiornamento profilo fallito"
                }
                
        except Exception as e:
            logger.error(f"❌ Profile update error: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def verify_email(self, token: str) -> Dict[str, Any]:
        """Verify email with token"""
        try:
            response = self.supabase.auth.verify_otp({
                "token": token,
                "type": "email"
            })
            
            if response.user:
                logger.info(f"✅ Email verified for user: {response.user.email}")
                return {
                    "success": True,
                    "message": "Email verificata con successo",
                    "user": self._format_user(response.user)
                }
            else:
                return {
                    "success": False,
                    "error": "Verifica email fallita"
                }
                
        except Exception as e:
            logger.error(f"❌ Email verification error: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def _format_user(self, user) -> Dict[str, Any]:
        """Format user object for API response"""
        return {
            "id": user.id,
            "email": user.email,
            "full_name": user.user_metadata.get("full_name") if user.user_metadata else None,
            "avatar_url": user.user_metadata.get("avatar_url") if user.user_metadata else None,
            "email_confirmed_at": user.email_confirmed_at,
            "created_at": user.created_at,
            "updated_at": user.updated_at,
            "last_sign_in_at": user.last_sign_in_at,
            "user_metadata": user.user_metadata,
            "app_metadata": user.app_metadata
        }


# Global auth service instance
auth_service = AuthService()


def get_auth_service() -> AuthService:
    """Dependency to get auth service"""
    return auth_service
