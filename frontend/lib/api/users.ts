import { apiGet, apiPut } from "@/lib/api"

export interface User {
  id: string
  email: string
  full_name: string
  created_at: string
  company?: {
    id: string
    name: string
    slug: string
    role: string
    joined_at: string
    is_active: boolean
  }
}

export interface Company {
  id: string
  name: string
  slug: string
  description?: string
  is_active: boolean
  created_at: string
}

export interface UsersResponse {
  users: User[]
  pagination: {
    page: number
    size: number
    total: number
    pages: number
  }
}

export interface CompaniesResponse {
  companies: Company[]
}

export interface UserCompanyAssignmentRequest {
  company_id?: string
  role?: string
}

export interface UserCompanyAssignmentResponse {
  message: string
  user_id: string
  company_id?: string
  role?: string
}

// Fetch all users with pagination and search
export const getUsers = async (
  page = 1,
  size = 50,
  search?: string
): Promise<UsersResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  })
  
  if (search) {
    params.append('search', search)
  }
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000'
  return await apiGet<UsersResponse>(`${baseUrl}/api/users?${params.toString()}`)
}

// Fetch all companies for assignment
export const getCompanies = async (): Promise<CompaniesResponse> => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000'
  return await apiGet<CompaniesResponse>(`${baseUrl}/api/companies`)
}

// Assign user to company or remove from company
export const assignUserToCompany = async (
  userId: string,
  data: UserCompanyAssignmentRequest
): Promise<UserCompanyAssignmentResponse> => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000'
  return await apiPut<UserCompanyAssignmentResponse>(`${baseUrl}/api/users/${userId}/company`, data)
}

// Remove user from company (convenience function)
export const removeUserFromCompany = async (
  userId: string
): Promise<UserCompanyAssignmentResponse> => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000'
  return await apiPut<UserCompanyAssignmentResponse>(`${baseUrl}/api/users/${userId}/company`, {
    company_id: null
  })
}