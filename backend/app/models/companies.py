"""
Company models for multi-tenant system
"""

from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, EmailStr
from enum import Enum


class UserRole(str, Enum):
    """User roles in a company"""
    OWNER = "owner"
    ADMIN = "admin"
    MEMBER = "member"
    VIEWER = "viewer"


class CompanyBase(BaseModel):
    """Base company model"""
    name: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    is_active: bool = True


class CompanyCreate(BaseModel):
    """Company creation model"""
    name: str = Field(..., min_length=1, max_length=255)
    slug: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    is_active: bool = True


class CompanyUpdate(BaseModel):
    """Company update model"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    is_active: Optional[bool] = None


class Company(CompanyBase):
    """Company model for API responses"""
    id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class CompanyWithStats(Company):
    """Company model with additional statistics"""
    member_count: int = 0
    owner_count: int = 0
    admin_count: int = 0
    total_users: int = 0


class CompanyWithUserRole(Company):
    """Company model with user's role information"""
    user_role: UserRole
    joined_at: datetime
    is_user_active: bool = True


# User Company Models
class UserCompanyBase(BaseModel):
    """Base user-company relationship model"""
    user_id: str
    company_id: str
    role: UserRole = UserRole.MEMBER
    is_active: bool = True


class UserCompanyCreate(UserCompanyBase):
    """User-company relationship creation model"""
    created_by: Optional[str] = None


class UserCompanyUpdate(BaseModel):
    """User-company relationship update model"""
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


class UserCompany(UserCompanyBase):
    """User-company relationship model for API responses"""
    id: str
    joined_at: datetime
    created_by: Optional[str] = None
    
    class Config:
        from_attributes = True


class UserCompanyWithDetails(UserCompany):
    """User-company relationship with user and company details"""
    user_email: Optional[str] = None
    user_full_name: Optional[str] = None
    company_name: Optional[str] = None
    company_slug: Optional[str] = None


# Company Invite Models
class CompanyInviteBase(BaseModel):
    """Base company invite model"""
    email: EmailStr
    company_id: str
    role: UserRole = UserRole.MEMBER


class CompanyInviteCreate(CompanyInviteBase):
    """Company invite creation model"""
    invited_by: str
    expires_in_days: int = Field(default=7, ge=1, le=30)


class CompanyInviteUpdate(BaseModel):
    """Company invite update model"""
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


class CompanyInvite(CompanyInviteBase):
    """Company invite model for API responses"""
    id: str
    invited_by: str
    token: str
    expires_at: datetime
    accepted_at: Optional[datetime] = None
    created_at: datetime
    is_active: bool = True
    
    class Config:
        from_attributes = True


class CompanyInviteWithDetails(CompanyInvite):
    """Company invite with additional details"""
    company_name: Optional[str] = None
    company_slug: Optional[str] = None
    invited_by_email: Optional[str] = None
    invited_by_name: Optional[str] = None
    is_expired: bool = False


class CompanyInviteAccept(BaseModel):
    """Model for accepting company invite"""
    token: str


class CompanyInvitePublic(BaseModel):
    """Public company invite model (for email links)"""
    id: str
    email: str
    company_name: str
    company_slug: str
    role: UserRole
    invited_by_name: Optional[str] = None
    expires_at: datetime
    is_expired: bool = False


# Response Models
class CompanyList(BaseModel):
    """Paginated company list response"""
    items: List[Company]
    total: int
    page: int
    size: int
    pages: int


class UserCompanyList(BaseModel):
    """Paginated user-company list response"""
    items: List[UserCompanyWithDetails]
    total: int
    page: int
    size: int
    pages: int


class CompanyInviteList(BaseModel):
    """Paginated company invite list response"""
    items: List[CompanyInviteWithDetails]
    total: int
    page: int
    size: int
    pages: int


class CompanyMemberList(BaseModel):
    """Company members list response"""
    company_id: str
    company_name: str
    members: List[UserCompanyWithDetails]
    total_members: int
    owners: int
    admins: int
    members_count: int
    viewers: int


# Permission Models
class UserPermissions(BaseModel):
    """User permissions in a company"""
    can_manage_company: bool = False
    can_manage_members: bool = False
    can_invite_users: bool = False
    can_access_polizze: bool = False
    can_access_rami: bool = False
    can_access_sezioni: bool = False
    can_access_garanzie: bool = False
    can_access_compagnie: bool = True
    can_access_clients: bool = True
    can_access_confronti: bool = True
    can_access_analytics: bool = True


class UserContext(BaseModel):
    """User context with company and permissions"""
    user_id: str
    user_email: str
    user_full_name: Optional[str] = None
    company_id: str
    company_name: str
    company_slug: str
    role: UserRole
    permissions: UserPermissions
    is_active: bool = True


# Utility Models
class CompanyStats(BaseModel):
    """Company statistics"""
    total_companies: int = 0
    active_companies: int = 0
    total_users: int = 0
    total_invites: int = 0
    pending_invites: int = 0
    accepted_invites: int = 0


class BulkInviteRequest(BaseModel):
    """Bulk invite request model"""
    emails: List[EmailStr] = Field(..., min_items=1, max_items=50)
    company_id: str
    role: UserRole = UserRole.MEMBER
    expires_in_days: int = Field(default=7, ge=1, le=30)


class BulkInviteResponse(BaseModel):
    """Bulk invite response model"""
    total_invites: int
    successful_invites: int
    failed_invites: int
    errors: List[str] = []
    invites: List[CompanyInvite] = []


# Error Models
class CompanyError(BaseModel):
    """Company-related error model"""
    error: str
    error_code: str
    details: Optional[str] = None


class InviteError(BaseModel):
    """Invite-related error model"""
    error: str
    error_code: str
    email: Optional[str] = None
    details: Optional[str] = None
