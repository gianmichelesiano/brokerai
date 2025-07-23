"""
Authentication dependencies for multi-tenant system
"""

import logging
from typing import Optional, Tuple
from fastapi import Depends, HTTPException, Header, status
from app.services.auth_service import get_auth_service, AuthService
from app.services.company_service import get_company_service, CompanyService
from app.models.companies import UserContext, UserRole

logger = logging.getLogger(__name__)


async def get_current_user_id(
    authorization: str = Header(None),
    auth_service: AuthService = Depends(get_auth_service)
) -> str:
    """
    Dependency to get current user ID from JWT token
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token di accesso mancante"
        )
    
    access_token = authorization.split(" ")[1]
    result = await auth_service.get_current_user(access_token)
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=result["error"]
        )
    
    return result["user"]["id"]


async def get_current_user_context(
    user_id: str = Depends(get_current_user_id),
    company_service: CompanyService = Depends(get_company_service),
    x_company_id: Optional[str] = Header(None, alias="X-Company-ID")
) -> UserContext:
    """
    Dependency to get current user context with company and permissions
    """
    try:
        # Get user context (with optional company selection)
        user_context = await company_service.get_user_context(user_id, x_company_id)
        
        if not user_context:
            # If user has no company, try to create a personal one
            # This handles the case of new users without companies
            logger.info(f"User {user_id} has no company, checking for pending invites or creating personal company")
            
            # For now, raise an error - we'll handle company creation in registration
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Utente non associato a nessuna company. Contatta l'amministratore."
            )
        
        if not user_context.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account disattivato nella company"
            )
        
        return user_context
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user context for user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Errore interno del server"
        )


async def require_owner_role(
    user_context: UserContext = Depends(get_current_user_context)
) -> UserContext:
    """
    Dependency that requires OWNER role
    """
    if user_context.role != UserRole.OWNER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accesso riservato ai proprietari della company"
        )
    return user_context


async def require_admin_or_owner_role(
    user_context: UserContext = Depends(get_current_user_context)
) -> UserContext:
    """
    Dependency that requires ADMIN or OWNER role
    """
    if user_context.role not in [UserRole.OWNER, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accesso riservato agli amministratori"
        )
    return user_context


async def require_member_or_higher_role(
    user_context: UserContext = Depends(get_current_user_context)
) -> UserContext:
    """
    Dependency that requires MEMBER, ADMIN or OWNER role
    """
    if user_context.role not in [UserRole.OWNER, UserRole.ADMIN, UserRole.MEMBER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accesso riservato ai membri della company"
        )
    return user_context


async def require_polizze_access(
    user_context: UserContext = Depends(get_current_user_context)
) -> UserContext:
    """
    Dependency that requires access to Polizze section (OWNER only)
    """
    if not user_context.permissions.can_access_polizze:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accesso alla sezione Polizze riservato ai proprietari"
        )
    return user_context


async def require_garanzie_access(
    user_context: UserContext = Depends(get_current_user_context)
) -> UserContext:
    """
    Dependency that requires access to Garanzie section (OWNER only)
    """
    if not user_context.permissions.can_access_garanzie:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accesso alla sezione Garanzie riservato ai proprietari"
        )
    return user_context


async def require_sezioni_access(
    user_context: UserContext = Depends(get_current_user_context)
) -> UserContext:
    """
    Dependency that requires access to Sezioni section (OWNER only)
    """
    if not user_context.permissions.can_access_sezioni:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accesso alla sezione Sezioni riservato ai proprietari"
        )
    return user_context


async def require_rami_access(
    user_context: UserContext = Depends(get_current_user_context)
) -> UserContext:
    """
    Dependency that requires access to Rami section (OWNER only)
    """
    if not user_context.permissions.can_access_rami:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accesso alla sezione Rami riservato ai proprietari"
        )
    return user_context


async def require_company_management(
    user_context: UserContext = Depends(get_current_user_context)
) -> UserContext:
    """
    Dependency that requires company management permissions
    """
    if not user_context.permissions.can_manage_company:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accesso alla gestione company riservato ai proprietari"
        )
    return user_context


async def require_member_management(
    user_context: UserContext = Depends(get_current_user_context)
) -> UserContext:
    """
    Dependency that requires member management permissions
    """
    if not user_context.permissions.can_manage_members:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accesso alla gestione membri riservato ai proprietari"
        )
    return user_context


# Utility functions for checking permissions
def check_permission(user_context: UserContext, permission: str) -> bool:
    """
    Check if user has a specific permission
    """
    return getattr(user_context.permissions, permission, False)


def get_user_company_filter(user_context: UserContext) -> dict:
    """
    Get filter dictionary for company-specific queries
    """
    return {"company_id": user_context.company_id}


def add_company_id_to_data(data: dict, user_context: UserContext) -> dict:
    """
    Add company_id to data dictionary for inserts/updates
    """
    data["company_id"] = user_context.company_id
    return data


# Context managers for different access levels
class PermissionChecker:
    """Helper class for checking permissions"""
    
    def __init__(self, user_context: UserContext):
        self.user_context = user_context
    
    def can_access_polizze(self) -> bool:
        return self.user_context.permissions.can_access_polizze
    
    def can_access_garanzie(self) -> bool:
        return self.user_context.permissions.can_access_garanzie
    
    def can_access_sezioni(self) -> bool:
        return self.user_context.permissions.can_access_sezioni
    
    def can_access_rami(self) -> bool:
        return self.user_context.permissions.can_access_rami
    
    def can_manage_company(self) -> bool:
        return self.user_context.permissions.can_manage_company
    
    def can_manage_members(self) -> bool:
        return self.user_context.permissions.can_manage_members
    
    def can_invite_users(self) -> bool:
        return self.user_context.permissions.can_invite_users
    
    def is_owner(self) -> bool:
        return self.user_context.role == UserRole.OWNER
    
    def is_admin_or_owner(self) -> bool:
        return self.user_context.role in [UserRole.OWNER, UserRole.ADMIN]
    
    def is_member_or_higher(self) -> bool:
        return self.user_context.role in [UserRole.OWNER, UserRole.ADMIN, UserRole.MEMBER]


def get_permission_checker(
    user_context: UserContext = Depends(get_current_user_context)
) -> PermissionChecker:
    """
    Dependency to get permission checker
    """
    return PermissionChecker(user_context)
