"""
Company service for multi-tenant operations
"""

import logging
from typing import Optional, Dict, Any, List, Tuple
from datetime import datetime, timedelta
import secrets
import string
from supabase import Client
from app.config.database import get_supabase, get_supabase_service
from app.models.companies import (
    Company, CompanyCreate, CompanyUpdate, UserCompany, UserCompanyCreate,
    CompanyInvite, CompanyInviteCreate, UserRole, UserPermissions, UserContext,
    CompanyMemberList, UserCompanyWithDetails, CompanyList, CompanyWithUserRole
)

logger = logging.getLogger(__name__)


class CompanyService:
    """Service for company operations"""
    
    def __init__(self):
        self.supabase: Client = get_supabase()
        self.supabase_service: Client = get_supabase_service()
    
    def get_user_permissions(self, role: UserRole) -> UserPermissions:
        """Get user permissions based on role"""
        if role == UserRole.OWNER:
            return UserPermissions(
                can_manage_company=True,
                can_manage_members=True,
                can_invite_users=True,
                can_access_polizze=True,
                can_access_rami=True,
                can_access_sezioni=True,
                can_access_garanzie=True,
                can_access_compagnie=True,
                can_access_clients=True,
                can_access_confronti=True,
                can_access_analytics=True
            )
        elif role in [UserRole.ADMIN, UserRole.MEMBER]:
            return UserPermissions(
                can_manage_company=False,
                can_manage_members=False,
                can_invite_users=False,
                can_access_polizze=False,  # No access to Polizze
                can_access_rami=False,     # No access to Rami
                can_access_sezioni=False,  # No access to Sezioni
                can_access_garanzie=False, # No access to Garanzie
                can_access_compagnie=True,
                can_access_clients=True,
                can_access_confronti=True,
                can_access_analytics=True
            )
        else:  # VIEWER
            return UserPermissions(
                can_manage_company=False,
                can_manage_members=False,
                can_invite_users=False,
                can_access_polizze=False,
                can_access_rami=False,
                can_access_sezioni=False,
                can_access_garanzie=False,
                can_access_compagnie=True,  # Read-only
                can_access_clients=True,    # Read-only
                can_access_confronti=True,  # Read-only
                can_access_analytics=True   # Read-only
            )
    
    async def get_user_context(self, user_id: str, company_id: Optional[str] = None) -> Optional[UserContext]:
        """Get user context with company and permissions"""
        try:
            # If no company_id provided, get user's primary company
            if not company_id:
                company_id = await self.get_user_primary_company(user_id)
                if not company_id:
                    return None
            
            # Get user-company relationship
            user_company_result = self.supabase.table("user_companies").select(
                "*, companies(name, slug)"
            ).eq("user_id", user_id).eq("company_id", company_id).eq("is_active", True).execute()
            
            if not user_company_result.data:
                return None
            
            user_company = user_company_result.data[0]
            company = user_company["companies"]
            
            # Get user details from auth service or use placeholder
            # Note: auth.users is not directly accessible via REST API
            user_email = "user@example.com"  # Placeholder - will be filled by auth service
            user_metadata = {}
            
            # Try to get user details from auth service if available
            try:
                # For now, use placeholder values
                # In production, this would come from the auth service
                user = {
                    "email": user_email,
                    "user_metadata": user_metadata
                }
            except Exception as e:
                logger.warning(f"Could not get user details for {user_id}: {e}")
                user = {
                    "email": "user@example.com",
                    "user_metadata": {}
                }
            
            # Create user context
            role = UserRole(user_company["role"])
            permissions = self.get_user_permissions(role)
            
            return UserContext(
                user_id=user_id,
                user_email=user["email"],
                user_full_name=user_metadata.get("full_name"),
                company_id=company_id,
                company_name=company["name"],
                company_slug=company["slug"],
                role=role,
                permissions=permissions,
                is_active=user_company["is_active"]
            )
            
        except Exception as e:
            logger.error(f"Error getting user context for user {user_id}, company {company_id}: {e}")
            return None
    
    async def get_user_primary_company(self, user_id: str) -> Optional[str]:
        """Get user's primary company (first active company or owner role)"""
        try:
            # First try to find a company where user is owner
            owner_result = self.supabase.table("user_companies").select(
                "company_id"
            ).eq("user_id", user_id).eq("role", "owner").eq("is_active", True).limit(1).execute()
            
            if owner_result.data:
                return owner_result.data[0]["company_id"]
            
            # Otherwise, get first active company
            any_result = self.supabase.table("user_companies").select(
                "company_id"
            ).eq("user_id", user_id).eq("is_active", True).order("joined_at").limit(1).execute()
            
            if any_result.data:
                return any_result.data[0]["company_id"]
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting primary company for user {user_id}: {e}")
            return None
    
    async def create_company(self, company_data: CompanyCreate, owner_id: str) -> Optional[Company]:
        """Create a new company with owner"""
        try:
            # Create company
            company_result = self.supabase.table("companies").insert({
                "name": company_data.name,
                "slug": company_data.slug,
                "description": company_data.description,
                "is_active": company_data.is_active
            }).execute()
            
            if not company_result.data:
                return None
            
            company = company_result.data[0]
            
            # Add owner to company
            user_company_result = self.supabase.table("user_companies").insert({
                "user_id": owner_id,
                "company_id": company["id"],
                "role": UserRole.OWNER.value,
                "is_active": True,
                "created_by": owner_id
            }).execute()
            
            if not user_company_result.data:
                # Rollback company creation
                self.supabase.table("companies").delete().eq("id", company["id"]).execute()
                return None
            
            return Company(**company)
            
        except Exception as e:
            logger.error(f"Error creating company: {e}")
            return None
    
    async def get_company_members(self, company_id: str) -> Optional[CompanyMemberList]:
        """Get all members of a company"""
        try:
            # Get company info
            company_result = self.supabase.table("companies").select(
                "id, name"
            ).eq("id", company_id).execute()
            
            if not company_result.data:
                return None
            
            company = company_result.data[0]
            
            # Get members with user details
            members_result = self.supabase.table("user_companies").select(
                "*"
            ).eq("company_id", company_id).eq("is_active", True).execute()
            
            members = []
            role_counts = {"owner": 0, "admin": 0, "member": 0, "viewer": 0}
            
            for member_data in members_result.data:
                user = member_data.get("auth.users", {})
                user_metadata = user.get("user_metadata", {})
                
                member = UserCompanyWithDetails(
                    id=member_data["id"],
                    user_id=member_data["user_id"],
                    company_id=member_data["company_id"],
                    role=UserRole(member_data["role"]),
                    joined_at=datetime.fromisoformat(member_data["joined_at"]),
                    is_active=member_data["is_active"],
                    created_by=member_data.get("created_by"),
                    user_email=user.get("email"),
                    user_full_name=user_metadata.get("full_name"),
                    company_name=company["name"]
                )
                
                members.append(member)
                role_counts[member_data["role"]] += 1
            
            return CompanyMemberList(
                company_id=company_id,
                company_name=company["name"],
                members=members,
                total_members=len(members),
                owners=role_counts["owner"],
                admins=role_counts["admin"],
                members_count=role_counts["member"],
                viewers=role_counts["viewer"]
            )
            
        except Exception as e:
            logger.error(f"Error getting company members for {company_id}: {e}")
            return None
    
    async def create_invite(self, invite_data: CompanyInviteCreate) -> Optional[CompanyInvite]:
        """Create a company invitation"""
        try:
            # Generate unique token
            token = self.generate_invite_token()
            
            # Calculate expiration date
            expires_at = datetime.utcnow() + timedelta(days=invite_data.expires_in_days)
            
            # Create invite
            invite_result = self.supabase.table("company_invites").insert({
                "email": invite_data.email,
                "company_id": invite_data.company_id,
                "role": invite_data.role.value,
                "invited_by": invite_data.invited_by,
                "token": token,
                "expires_at": expires_at.isoformat(),
                "is_active": True
            }).execute()
            
            if not invite_result.data:
                return None
            
            invite = invite_result.data[0]
            
            return CompanyInvite(
                id=invite["id"],
                email=invite["email"],
                company_id=invite["company_id"],
                role=UserRole(invite["role"]),
                invited_by=invite["invited_by"],
                token=invite["token"],
                expires_at=datetime.fromisoformat(invite["expires_at"]),
                created_at=datetime.fromisoformat(invite["created_at"]),
                is_active=invite["is_active"]
            )
            
        except Exception as e:
            logger.error(f"Error creating invite: {e}")
            return None
    
    async def accept_invite(self, token: str, user_id: str) -> bool:
        """Accept a company invitation"""
        try:
            # Get invite
            invite_result = self.supabase.table("company_invites").select(
                "*"
            ).eq("token", token).eq("is_active", True).execute()
            
            if not invite_result.data:
                return False
            
            invite = invite_result.data[0]
            
            # Check if invite is expired
            expires_at = datetime.fromisoformat(invite["expires_at"])
            if datetime.utcnow() > expires_at:
                return False
            
            # Check if user is already a member
            existing_member = self.supabase.table("user_companies").select(
                "id"
            ).eq("user_id", user_id).eq("company_id", invite["company_id"]).execute()
            
            if existing_member.data:
                # User already a member, just mark invite as accepted
                self.supabase.table("company_invites").update({
                    "accepted_at": datetime.utcnow().isoformat(),
                    "is_active": False
                }).eq("id", invite["id"]).execute()
                return True
            
            # Add user to company
            user_company_result = self.supabase.table("user_companies").insert({
                "user_id": user_id,
                "company_id": invite["company_id"],
                "role": invite["role"],
                "is_active": True,
                "created_by": invite["invited_by"]
            }).execute()
            
            if not user_company_result.data:
                return False
            
            # Mark invite as accepted
            self.supabase.table("company_invites").update({
                "accepted_at": datetime.utcnow().isoformat(),
                "is_active": False
            }).eq("id", invite["id"]).execute()
            
            return True
            
        except Exception as e:
            logger.error(f"Error accepting invite with token {token}: {e}")
            return False
    
    def generate_invite_token(self) -> str:
        """Generate a secure invite token"""
        alphabet = string.ascii_letters + string.digits
        return ''.join(secrets.choice(alphabet) for _ in range(32))
    
    async def create_personal_company_for_user(self, user_id: str, user_email: str, user_name: Optional[str] = None) -> Optional[Company]:
        """Create a personal company for a new user"""
        try:
            # Generate company name and slug
            if user_name:
                company_name = f"{user_name}'s Company"
            else:
                company_name = f"{user_email.split('@')[0]}'s Company"
            
            # Generate unique slug
            base_slug = user_email.split('@')[0].lower().replace('.', '-').replace('_', '-')
            slug = await self.generate_unique_slug(base_slug)
            
            company_data = CompanyCreate(
                name=company_name,
                slug=slug,
                description=f"Personal company for {user_email}",
                is_active=True
            )
            
            return await self.create_company(company_data, user_id)
            
        except Exception as e:
            logger.error(f"Error creating personal company for user {user_id}: {e}")
            return None
    
    async def generate_unique_slug(self, base_slug: str) -> str:
        """Generate a unique slug for a company"""
        try:
            slug = base_slug
            counter = 1
            
            while True:
                # Check if slug exists
                existing = self.supabase.table("companies").select(
                    "id"
                ).eq("slug", slug).execute()
                
                if not existing.data:
                    return slug
                
                # Try with counter
                slug = f"{base_slug}-{counter}"
                counter += 1
                
                # Prevent infinite loop
                if counter > 100:
                    slug = f"{base_slug}-{secrets.token_hex(4)}"
                    break
            
            return slug
            
        except Exception as e:
            logger.error(f"Error generating unique slug for {base_slug}: {e}")
            return f"{base_slug}-{secrets.token_hex(4)}"
    
    async def list_all_companies(
        self, 
        page: int = 1, 
        size: int = 10, 
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
        created_after: Optional[datetime] = None
    ) -> CompanyList:
        """List all companies with filters and pagination (for super admin)"""
        try:
            # Build query
            query = self.supabase.table("companies").select("*", count="exact")
            
            # Apply filters
            if search:
                query = query.ilike("name", f"%{search}%")
            
            if is_active is not None:
                query = query.eq("is_active", is_active)
            
            if created_after:
                query = query.gte("created_at", created_after.isoformat())
            
            # Get total count
            count_result = query.execute()
            total = count_result.count or 0
            
            # Apply pagination and ordering
            offset = (page - 1) * size
            companies_result = query.order("created_at", desc=True).range(offset, offset + size - 1).execute()
            
            # Convert to Company models
            companies = [Company(**company_data) for company_data in companies_result.data]
            
            pages = (total + size - 1) // size if total > 0 else 0
            
            return CompanyList(
                items=companies,
                total=total,
                page=page,
                size=size,
                pages=pages
            )
            
        except Exception as e:
            logger.error(f"Error listing all companies: {e}")
            return CompanyList(items=[], total=0, page=page, size=size, pages=0)
    
    async def update_company(self, company_id: str, company_data: CompanyUpdate) -> Optional[Company]:
        """Update a company"""
        try:
            # Prepare update data
            update_data = {}
            
            if company_data.name is not None:
                # Check if name is already taken by another company
                existing = self.supabase.table("companies").select("id").eq("name", company_data.name).neq("id", company_id).execute()
                if existing.data:
                    raise ValueError(f"Company with name '{company_data.name}' already exists")
                update_data["name"] = company_data.name
            
            if company_data.description is not None:
                update_data["description"] = company_data.description
            
            if company_data.is_active is not None:
                update_data["is_active"] = company_data.is_active
            
            if not update_data:
                # No changes to make, return current company
                company_result = self.supabase.table("companies").select("*").eq("id", company_id).execute()
                if company_result.data:
                    return Company(**company_result.data[0])
                return None
            
            # Add timestamp
            update_data["updated_at"] = datetime.utcnow().isoformat()
            
            # Update company
            result = self.supabase.table("companies").update(update_data).eq("id", company_id).execute()
            
            if not result.data:
                return None
            
            return Company(**result.data[0])
            
        except Exception as e:
            logger.error(f"Error updating company {company_id}: {e}")
            return None
    
    async def soft_delete_company(self, company_id: str) -> bool:
        """Soft delete a company (set is_active = false)"""
        try:
            # Check if there are other active users in the company
            active_users = self.supabase.table("user_companies").select("*", count="exact").eq("company_id", company_id).eq("is_active", True).execute()
            
            if (active_users.count or 0) > 1:
                raise ValueError("Cannot delete company with active members. Remove all members first.")
            
            # Soft delete the company
            result = self.supabase.table("companies").update({
                "is_active": False,
                "updated_at": datetime.utcnow().isoformat()
            }).eq("id", company_id).execute()
            
            return bool(result.data)
            
        except Exception as e:
            logger.error(f"Error soft deleting company {company_id}: {e}")
            return False
    
    async def get_user_companies(self, user_id: str) -> List[CompanyWithUserRole]:
        """Get all companies for a user with their role"""
        try:
            # Get user-company relationships with company details
            user_companies_result = self.supabase.table("user_companies").select(
                "*, companies(*)"
            ).eq("user_id", user_id).eq("is_active", True).order("joined_at").execute()
            
            companies = []
            for uc_data in user_companies_result.data:
                company_data = uc_data["companies"]
                if company_data and company_data.get("is_active", True):  # Only include active companies
                    company = CompanyWithUserRole(
                        id=company_data["id"],
                        name=company_data["name"],
                        slug=company_data["slug"],
                        description=company_data.get("description"),
                        is_active=company_data.get("is_active", True),
                        created_at=datetime.fromisoformat(company_data["created_at"]),
                        updated_at=datetime.fromisoformat(company_data["updated_at"]),
                        user_role=UserRole(uc_data["role"]),
                        joined_at=datetime.fromisoformat(uc_data["joined_at"]),
                        is_user_active=uc_data["is_active"]
                    )
                    companies.append(company)
            
            return companies
            
        except Exception as e:
            logger.error(f"Error getting user companies for {user_id}: {e}")
            return []
    
    async def is_user_super_admin(self, user_id: str) -> bool:
        """Check if user is a super admin (has owner role in any company)"""
        try:
            owner_result = self.supabase.table("user_companies").select("id").eq("user_id", user_id).eq("role", "owner").eq("is_active", True).limit(1).execute()
            return bool(owner_result.data)
        except Exception as e:
            logger.error(f"Error checking super admin status for user {user_id}: {e}")
            return False
    
    async def is_user_company_owner(self, user_id: str, company_id: str) -> bool:
        """Check if user is owner of specific company"""
        try:
            owner_result = self.supabase.table("user_companies").select("id").eq("user_id", user_id).eq("company_id", company_id).eq("role", "owner").eq("is_active", True).limit(1).execute()
            return bool(owner_result.data)
        except Exception as e:
            logger.error(f"Error checking company owner status for user {user_id}, company {company_id}: {e}")
            return False


# Global company service instance
company_service = CompanyService()


def get_company_service() -> CompanyService:
    """Dependency to get company service"""
    return company_service
