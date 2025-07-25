import { api } from "@/lib/api"
import {
  Company,
  CompanyUpdate,
  CompanyMemberList,
  CompanyInvite,
  CompanyInviteCreate,
  CompanyInviteList,
  UserRole
} from "@/lib/types/company"

// Fetch current user's company
export const getMyCompany = async (): Promise<Company> => {
  const response = await api.get("/companies/me")
  return response.data
}

// Update current user's company
export const updateMyCompany = async (data: CompanyUpdate): Promise<Company> => {
  const response = await api.put("/companies/me", data)
  return response.data
}

// Fetch company members
export const getCompanyMembers = async (): Promise<CompanyMemberList> => {
  const response = await api.get("/companies/me/members")
  return response.data
}

// Invite a user to the company
export const inviteUser = async (data: CompanyInviteCreate): Promise<CompanyInvite> => {
  const response = await api.post("/companies/me/invite", data)
  return response.data
}

// Fetch pending company invites
export const getCompanyInvites = async (page = 1, size = 20): Promise<CompanyInviteList> => {
  const response = await api.get(`/companies/me/invites?page=${page}&size=${size}`)
  return response.data
}

// Cancel a pending invite
export const cancelInvite = async (inviteId: string): Promise<{ message: string }> => {
  const response = await api.delete(`/companies/me/invites/${inviteId}`)
  return response.data
}

// Update a member's role
export const updateMemberRole = async (userId: string, newRole: UserRole): Promise<{ message: string }> => {
  const response = await api.put(`/companies/me/members/${userId}/role`, { new_role: newRole })
  return response.data
}

// Remove a member from the company
export const removeMember = async (userId: string): Promise<{ message: string }> => {
  const response = await api.delete(`/companies/me/members/${userId}`)
  return response.data
} 