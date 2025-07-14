"""
User models for authentication
"""

from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    """Base user model"""
    email: EmailStr
    full_name: Optional[str] = None
    is_active: bool = True


class UserCreate(UserBase):
    """User creation model"""
    password: str = Field(..., min_length=6)


class UserUpdate(BaseModel):
    """User update model"""
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = None


class UserInDB(UserBase):
    """User model as stored in database"""
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    email_confirmed_at: Optional[datetime] = None
    last_sign_in_at: Optional[datetime] = None
    user_metadata: Optional[Dict[str, Any]] = None
    app_metadata: Optional[Dict[str, Any]] = None


class User(UserInDB):
    """User model for API responses"""
    pass


class UserProfile(BaseModel):
    """User profile model"""
    id: str
    email: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime
    last_sign_in_at: Optional[datetime] = None


class AuthResponse(BaseModel):
    """Authentication response model"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    refresh_token: Optional[str] = None
    user: User


class LoginRequest(BaseModel):
    """Login request model"""
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    """Registration request model"""
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: Optional[str] = None


class PasswordResetRequest(BaseModel):
    """Password reset request model"""
    email: EmailStr


class PasswordUpdateRequest(BaseModel):
    """Password update request model"""
    password: str = Field(..., min_length=6)


class EmailVerificationRequest(BaseModel):
    """Email verification request model"""
    token: str


class RefreshTokenRequest(BaseModel):
    """Refresh token request model"""
    refresh_token: str


class UserSession(BaseModel):
    """User session model"""
    access_token: str
    refresh_token: str
    expires_at: datetime
    user: User


class AuthError(BaseModel):
    """Authentication error model"""
    error: str
    error_description: Optional[str] = None
    error_code: Optional[str] = None


class AuthSuccess(BaseModel):
    """Authentication success model"""
    message: str
    user: Optional[User] = None
