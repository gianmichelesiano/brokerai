"""
API router for Companies management endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional
import logging

from app.models.companies import (
    Company, CompanyCreate, CompanyUpdate, CompanyList,
    CompanyInvite, CompanyInviteCreate, CompanyInviteAccept,
    CompanyMemberList, UserContext, UserRole
)
from app.services.company_service import get_company_service, CompanyService
from app.dependencies.auth import (
    get_current_user_context, require_owner_role, require_member_management,
    get_user_company_filter, add_company_id_to_data
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/companies", tags=["Companies"])


@router.get("/health")
async def health_check():
    """
    Health check for companies service
    """
    try:
        return {
            "status": "ok",
            "service": "companies",
            "message": "Companies service is running"
        }
    except Exception as e:
        logger.error(f"Companies health check failed: {e}")
        return {
            "status": "error",
            "service": "companies",
            "error": str(e),
            "message": "Companies service error"
        }


@router.get("/me", response_model=Company)
async def get_my_company(
    user_context: UserContext = Depends(get_current_user_context),
    company_service: CompanyService = Depends(get_company_service)
):
    """
    Get current user's company information
    """
    try:
        # Get company details
        company_result = company_service.supabase.table("companies").select("*").eq("id", user_context.company_id).execute()
        
        if not company_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company non trovata"
            )
        
        company_data = company_result.data[0]
        return Company(**company_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting company {user_context.company_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore interno del server: {str(e)}"
        )


@router.put("/me", response_model=Company)
async def update_my_company(
    company_data: CompanyUpdate,
    user_context: UserContext = Depends(require_owner_role),
    company_service: CompanyService = Depends(get_company_service)
):
    """
    Update current user's company (OWNER only)
    """
    try:
        # Prepare update data
        update_data = {}
        if company_data.name is not None:
            # Check if name is already taken by another company
            existing = company_service.supabase.table("companies").select("id").eq("name", company_data.name).neq("id", user_context.company_id).execute()
            if existing.data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Esiste già una company con il nome '{company_data.name}'"
                )
            update_data["name"] = company_data.name
        
        if company_data.description is not None:
            update_data["description"] = company_data.description
        
        if company_data.is_active is not None:
            update_data["is_active"] = company_data.is_active
        
        if not update_data:
            # No changes to make
            company_result = company_service.supabase.table("companies").select("*").eq("id", user_context.company_id).execute()
            return Company(**company_result.data[0])
        
        # Add timestamp
        from datetime import datetime
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        # Update company
        result = company_service.supabase.table("companies").update(update_data).eq("id", user_context.company_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Errore nell'aggiornamento della company"
            )
        
        return Company(**result.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating company {user_context.company_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore interno del server: {str(e)}"
        )


@router.get("/me/members", response_model=CompanyMemberList)
async def get_company_members(
    user_context: UserContext = Depends(get_current_user_context),
    company_service: CompanyService = Depends(get_company_service)
):
    """
    Get members of current user's company
    """
    try:
        members = await company_service.get_company_members(user_context.company_id)
        
        if not members:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company o membri non trovati"
            )
        
        return members
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting company members for {user_context.company_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore interno del server: {str(e)}"
        )


@router.post("/me/invite", response_model=CompanyInvite)
async def invite_user_to_company(
    invite_data: CompanyInviteCreate,
    user_context: UserContext = Depends(require_member_management),
    company_service: CompanyService = Depends(get_company_service)
):
    """
    Invite a user to join the company (OWNER only)
    """
    try:
        # Set company_id and invited_by from user context
        invite_data.company_id = user_context.company_id
        invite_data.invited_by = user_context.user_id
        
        # Check if user is already a member
        existing_member = company_service.supabase.table("user_companies").select("id").eq("company_id", user_context.company_id).execute()
        
        # Get user by email to check if they exist
        user_result = company_service.supabase.table("auth.users").select("id").eq("email", invite_data.email).execute()
        
        if user_result.data:
            user_id = user_result.data[0]["id"]
            # Check if already a member
            member_check = company_service.supabase.table("user_companies").select("id").eq("user_id", user_id).eq("company_id", user_context.company_id).execute()
            if member_check.data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="L'utente è già membro di questa company"
                )
        
        # Check if there's already a pending invite
        pending_invite = company_service.supabase.table("company_invites").select("id").eq("email", invite_data.email).eq("company_id", user_context.company_id).eq("is_active", True).execute()
        
        if pending_invite.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Esiste già un invito pendente per questo utente"
            )
        
        # Create invite
        invite = await company_service.create_invite(invite_data)
        
        if not invite:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Errore nella creazione dell'invito"
            )
        
        # TODO: Send email notification
        logger.info(f"Invite created for {invite_data.email} to company {user_context.company_id}")
        
        return invite
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating invite: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore interno del server: {str(e)}"
        )


@router.get("/me/invites")
async def get_company_invites(
    user_context: UserContext = Depends(require_member_management),
    company_service: CompanyService = Depends(get_company_service),
    page: int = Query(1, ge=1, description="Numero pagina"),
    size: int = Query(20, ge=1, le=100, description="Dimensione pagina")
):
    """
    Get pending invites for the company (OWNER only)
    """
    try:
        offset = (page - 1) * size
        
        # Get invites with details
        invites_result = company_service.supabase.table("company_invites").select(
            "*, auth.users(email, user_metadata)"
        ).eq("company_id", user_context.company_id).eq("is_active", True).order("created_at", desc=True).range(offset, offset + size - 1).execute()
        
        # Count total invites
        count_result = company_service.supabase.table("company_invites").select("*", count="exact").eq("company_id", user_context.company_id).eq("is_active", True).execute()
        
        total = count_result.count or 0
        pages = (total + size - 1) // size if total > 0 else 0
        
        # Format invites
        invites = []
        for invite_data in invites_result.data:
            invited_by_user = invite_data.get("auth.users", {})
            invited_by_metadata = invited_by_user.get("user_metadata", {})
            
            invite = {
                **invite_data,
                "invited_by_email": invited_by_user.get("email"),
                "invited_by_name": invited_by_metadata.get("full_name"),
                "company_name": user_context.company_name,
                "is_expired": False  # TODO: Calculate if expired
            }
            invites.append(invite)
        
        return {
            "items": invites,
            "total": total,
            "page": page,
            "size": size,
            "pages": pages
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting company invites: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore interno del server: {str(e)}"
        )


@router.delete("/me/invites/{invite_id}")
async def cancel_invite(
    invite_id: str,
    user_context: UserContext = Depends(require_member_management),
    company_service: CompanyService = Depends(get_company_service)
):
    """
    Cancel a pending invite (OWNER only)
    """
    try:
        # Verify invite belongs to user's company
        invite_result = company_service.supabase.table("company_invites").select("id").eq("id", invite_id).eq("company_id", user_context.company_id).eq("is_active", True).execute()
        
        if not invite_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invito non trovato"
            )
        
        # Cancel invite
        company_service.supabase.table("company_invites").update({
            "is_active": False,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", invite_id).execute()
        
        return {"message": "Invito cancellato con successo"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error canceling invite {invite_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore interno del server: {str(e)}"
        )


@router.put("/me/members/{user_id}/role")
async def update_member_role(
    user_id: str,
    new_role: UserRole,
    user_context: UserContext = Depends(require_member_management),
    company_service: CompanyService = Depends(get_company_service)
):
    """
    Update a member's role in the company (OWNER only)
    """
    try:
        # Verify member exists in company
        member_result = company_service.supabase.table("user_companies").select("id, role").eq("user_id", user_id).eq("company_id", user_context.company_id).eq("is_active", True).execute()
        
        if not member_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Membro non trovato nella company"
            )
        
        current_member = member_result.data[0]
        
        # Prevent changing own role
        if user_id == user_context.user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Non puoi modificare il tuo stesso ruolo"
            )
        
        # Prevent removing the last owner
        if current_member["role"] == UserRole.OWNER.value and new_role != UserRole.OWNER:
            # Count remaining owners
            owners_count = company_service.supabase.table("user_companies").select("*", count="exact").eq("company_id", user_context.company_id).eq("role", UserRole.OWNER.value).eq("is_active", True).execute()
            
            if (owners_count.count or 0) <= 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Non puoi rimuovere l'ultimo proprietario della company"
                )
        
        # Update role
        from datetime import datetime
        company_service.supabase.table("user_companies").update({
            "role": new_role.value,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", current_member["id"]).execute()
        
        return {"message": f"Ruolo aggiornato a {new_role.value} con successo"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating member role: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore interno del server: {str(e)}"
        )


@router.delete("/me/members/{user_id}")
async def remove_member(
    user_id: str,
    user_context: UserContext = Depends(require_member_management),
    company_service: CompanyService = Depends(get_company_service)
):
    """
    Remove a member from the company (OWNER only)
    """
    try:
        # Verify member exists in company
        member_result = company_service.supabase.table("user_companies").select("id, role").eq("user_id", user_id).eq("company_id", user_context.company_id).eq("is_active", True).execute()
        
        if not member_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Membro non trovato nella company"
            )
        
        current_member = member_result.data[0]
        
        # Prevent removing self
        if user_id == user_context.user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Non puoi rimuovere te stesso dalla company"
            )
        
        # Prevent removing the last owner
        if current_member["role"] == UserRole.OWNER.value:
            # Count remaining owners
            owners_count = company_service.supabase.table("user_companies").select("*", count="exact").eq("company_id", user_context.company_id).eq("role", UserRole.OWNER.value).eq("is_active", True).execute()
            
            if (owners_count.count or 0) <= 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Non puoi rimuovere l'ultimo proprietario della company"
                )
        
        # Remove member (soft delete)
        from datetime import datetime
        company_service.supabase.table("user_companies").update({
            "is_active": False,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", current_member["id"]).execute()
        
        return {"message": "Membro rimosso dalla company con successo"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing member: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore interno del server: {str(e)}"
        )


# Public endpoints for invite acceptance
@router.post("/invites/accept", response_model=dict)
async def accept_company_invite(
    invite_data: CompanyInviteAccept,
    user_context: UserContext = Depends(get_current_user_context),
    company_service: CompanyService = Depends(get_company_service)
):
    """
    Accept a company invitation
    """
    try:
        success = await company_service.accept_invite(invite_data.token, user_context.user_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invito non valido, scaduto o già utilizzato"
            )
        
        return {"message": "Invito accettato con successo"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error accepting invite: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore interno del server: {str(e)}"
        )


@router.get("/invites/{token}")
async def get_invite_details(
    token: str,
    company_service: CompanyService = Depends(get_company_service)
):
    """
    Get invite details by token (public endpoint for email links)
    """
    try:
        # Get invite with company details
        invite_result = company_service.supabase.table("company_invites").select(
            "*, companies(name, slug), auth.users(user_metadata)"
        ).eq("token", token).eq("is_active", True).execute()
        
        if not invite_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invito non trovato o scaduto"
            )
        
        invite = invite_result.data[0]
        company = invite["companies"]
        invited_by_user = invite.get("auth.users", {})
        invited_by_metadata = invited_by_user.get("user_metadata", {})
        
        # Check if expired
        from datetime import datetime
        expires_at = datetime.fromisoformat(invite["expires_at"])
        is_expired = datetime.utcnow() > expires_at
        
        return {
            "id": invite["id"],
            "email": invite["email"],
            "company_name": company["name"],
            "company_slug": company["slug"],
            "role": invite["role"],
            "invited_by_name": invited_by_metadata.get("full_name"),
            "expires_at": invite["expires_at"],
            "is_expired": is_expired
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting invite details: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore interno del server: {str(e)}"
        )
