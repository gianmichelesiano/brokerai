export enum UserRole {
  OWNER = "owner",
  ADMIN = "admin", 
  MEMBER = "member",
  VIEWER = "viewer"
}

export interface Company {
  id: string
  name: string
  slug: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CompanyUpdate {
  name?: string
  description?: string
  is_active?: boolean
}

export interface UserCompanyWithDetails {
  id: string
  user_id: string
  company_id: string
  role: UserRole
  is_active: boolean
  joined_at: string
  created_by?: string
  user_email?: string
  user_full_name?: string
  company_name?: string
  company_slug?: string
}

export interface CompanyMemberList {
  company_id: string
  company_name: string
  members: UserCompanyWithDetails[]
  total_members: number
  owners: number
  admins: number
  members_count: number
  viewers: number
}

export interface CompanyInvite {
  id: string
  email: string
  company_id: string
  role: UserRole
  invited_by: string
  token: string
  expires_at: string
  accepted_at?: string
  created_at: string
  is_active: boolean
}

export interface CompanyInviteCreate {
  email: string
  role: UserRole
  expires_in_days?: number
}

export interface CompanyInviteWithDetails extends CompanyInvite {
  company_name?: string
  company_slug?: string
  invited_by_email?: string
  invited_by_name?: string
  is_expired: boolean
}

export interface CompanyInviteList {
  items: CompanyInviteWithDetails[]
  total: number
  page: number
  size: number
  pages: number
} 