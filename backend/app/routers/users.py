"""
Users router for managing users and company assignments
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
import logging

from app.dependencies.auth import get_current_user_id
from app.services.auth_service import AuthService
from app.config.database import get_supabase, get_supabase_service

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/users")
async def get_all_users(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(50, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search by email or name"),
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Get all users with their company information
    Requires authentication
    """
    try:
        supabase = get_supabase()
        supabase_service = get_supabase_service()
        
        # Use admin auth API to list users
        users_response = supabase_service.auth.admin.list_users(
            page=page,
            per_page=size
        )
        
        if not users_response:
            raise HTTPException(status_code=500, detail="Failed to fetch users from auth service")
        
        # Debug: log the response structure
        logger.info(f"Users response type: {type(users_response)}")
        logger.info(f"Users response: {users_response}")
        
        # The response might be a pagination object, let's check if it has users attribute
        if hasattr(users_response, 'users'):
            users_data = users_response.users
        elif isinstance(users_response, list):
            users_data = users_response
        else:
            # Try to convert to dict and access data
            users_dict = dict(users_response) if hasattr(users_response, '__dict__') else users_response
            users_data = users_dict.get('users', users_dict.get('data', []))
        
        logger.info(f"Users data type: {type(users_data)}")
        if users_data:
            logger.info(f"First user type: {type(users_data[0])}")
            logger.info(f"First user: {users_data[0]}")
        
        # Apply search filter if provided (client-side filtering since admin API doesn't support search)
        if search:
            search_term = search.lower()
            filtered_users = []
            for user in users_data:
                try:
                    # Handle both dict and object access patterns
                    email = user.email if hasattr(user, 'email') else user.get('email', '')
                    user_metadata = user.user_metadata if hasattr(user, 'user_metadata') else user.get('user_metadata', {})
                    full_name = user_metadata.get('full_name', '') if user_metadata else ''
                    
                    if (search_term in (email or '').lower()) or (search_term in full_name.lower()):
                        filtered_users.append(user)
                except Exception as e:
                    logger.warning(f"Error filtering user: {e}")
                    # Include user anyway if we can't filter
                    filtered_users.append(user)
            users_data = filtered_users
        
        # Get total count (for pagination, we'll use the original count if no search, else filtered count)
        total_count = len(users_data) if search else len(users_response)
        
        # Get user IDs to fetch company assignments
        user_ids = []
        for user in users_data:
            try:
                user_id = user.id if hasattr(user, 'id') else user.get('id')
                if user_id:
                    user_ids.append(user_id)
            except Exception as e:
                logger.warning(f"Error extracting user ID: {e}")
                continue
        
        # Get company assignments for these users
        company_assignments = {}
        if user_ids:
            assignments_result = supabase.from_("user_companies").select("""
                user_id,
                company_id,
                role,
                joined_at,
                is_active,
                companies!inner(
                    id,
                    name,
                    slug
                )
            """).in_("user_id", user_ids).execute()
            
            # Group assignments by user_id
            for assignment in assignments_result.data or []:
                user_id = assignment['user_id']
                if user_id not in company_assignments:
                    company_assignments[user_id] = []
                company_assignments[user_id].append(assignment)
        
        # Format the response
        users = []
        for user in users_data:
            try:
                # Handle both dict and object access patterns
                user_id = user.id if hasattr(user, 'id') else user.get('id')
                email = user.email if hasattr(user, 'email') else user.get('email')
                created_at = user.created_at if hasattr(user, 'created_at') else user.get('created_at')
                
                # Extract user metadata
                user_metadata = user.user_metadata if hasattr(user, 'user_metadata') else user.get('user_metadata', {})
                metadata = user_metadata or {}
                full_name = metadata.get('full_name', '') if isinstance(metadata, dict) else ''
                
                # Get company info if user is assigned to a company
                company_info = None
                user_assignments = company_assignments.get(user_id, [])
                
                if user_assignments:
                    # Taking the first active assignment (assuming one company per user for now)
                    assignment = user_assignments[0]
                    company = assignment.get('companies')
                    if company:
                        company_info = {
                            "id": company['id'],
                            "name": company['name'],
                            "slug": company['slug'],
                            "role": assignment['role'],
                            "joined_at": assignment['joined_at'],
                            "is_active": assignment.get('is_active', True)
                        }
                
                users.append({
                    "id": user_id,
                    "email": email,
                    "full_name": full_name,
                    "created_at": created_at,
                    "company": company_info
                })
            except Exception as e:
                logger.error(f"Error processing user: {e}")
                continue
        
        return {
            "users": users,
            "pagination": {
                "page": page,
                "size": size,
                "total": total_count,
                "pages": (total_count + size - 1) // size
            }
        }
        
    except Exception as e:
        logger.error(f"Error fetching users: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching users: {str(e)}"
        )

@router.get("/companies")
async def get_all_companies(
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Get all companies for user assignment
    """
    try:
        supabase = get_supabase()
        
        result = supabase.from_("companies").select("""
            id,
            name,
            slug,
            description,
            is_active,
            created_at
        """).eq('is_active', True).order('name').execute()
        
        return {
            "companies": result.data or []
        }
        
    except Exception as e:
        logger.error(f"Error fetching companies: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching companies: {str(e)}"
        )

@router.put("/users/{user_id}/company")
async def assign_user_to_company(
    user_id: str,
    company_id: Optional[str] = None,
    role: str = "member",
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Assign a user to a company or remove from current company
    If company_id is None, removes user from current company
    """
    try:
        supabase = get_supabase()
        supabase_service = get_supabase_service()
        
        # Validate user exists using admin auth API
        try:
            user_result = supabase_service.auth.admin.get_user_by_id(user_id)
            if not user_result:
                raise HTTPException(status_code=404, detail="User not found")
        except Exception:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Remove existing company assignment
        delete_result = supabase.from_("user_companies").delete().eq('user_id', user_id).execute()
        
        # If company_id is provided, create new assignment
        if company_id:
            # Validate company exists
            company_result = supabase.from_("companies").select("id").eq('id', company_id).execute()
            if not company_result.data:
                raise HTTPException(status_code=404, detail="Company not found")
            
            # Create new assignment
            insert_result = supabase.from_("user_companies").insert({
                "user_id": user_id,
                "company_id": company_id,
                "role": role,
                "is_active": True,
                "created_by": current_user_id
            }).execute()
            
            if not insert_result.data:
                raise HTTPException(status_code=500, detail="Failed to assign user to company")
        
        return {
            "message": "User company assignment updated successfully",
            "user_id": user_id,
            "company_id": company_id,
            "role": role if company_id else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating user company assignment: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error updating user company assignment: {str(e)}"
        )