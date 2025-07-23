import { createClient } from '@/lib/supabase'

/**
 * Utility per fare chiamate API autenticate al backend
 */
export class ApiClient {
  private static instance: ApiClient
  private supabase = createClient()

  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient()
    }
    return ApiClient.instance
  }

  /**
   * Ottiene il token di accesso corrente
   */
  private async getAccessToken(): Promise<string | null> {
    try {
      const { data: { session } } = await this.supabase.auth.getSession()
      return session?.access_token || null
    } catch (error) {
      console.error('Errore nel recupero del token:', error)
      return null
    }
  }

  /**
   * Crea gli headers per le chiamate API autenticate
   */
  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = await this.getAccessToken()
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    return headers
  }

  /**
   * Effettua una chiamata GET autenticata
   */
  async get(url: string): Promise<Response> {
    const headers = await this.getAuthHeaders()
    return fetch(url, {
      method: 'GET',
      headers,
    })
  }

  /**
   * Effettua una chiamata POST autenticata
   */
  async post(url: string, data?: any): Promise<Response> {
    const headers = await this.getAuthHeaders()
    return fetch(url, {
      method: 'POST',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * Effettua una chiamata PUT autenticata
   */
  async put(url: string, data?: any): Promise<Response> {
    const headers = await this.getAuthHeaders()
    return fetch(url, {
      method: 'PUT',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * Effettua una chiamata DELETE autenticata
   */
  async delete(url: string): Promise<Response> {
    const headers = await this.getAuthHeaders()
    return fetch(url, {
      method: 'DELETE',
      headers,
    })
  }

  /**
   * Gestisce gli errori di risposta comuni
   */
  async handleResponse<T>(response: Response): Promise<T> {
    if (response.status === 401) {
      // Token scaduto o non valido - reindirizza al login
      window.location.href = '/auth/login'
      throw new Error('Sessione scaduta. Effettua nuovamente il login.')
    }

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = `Errore ${response.status}: ${response.statusText}`
      
      try {
        const errorData = JSON.parse(errorText)
        errorMessage = errorData.detail || errorData.message || errorMessage
      } catch {
        // Se non è JSON, usa il testo grezzo
        if (errorText) {
          errorMessage = errorText
        }
      }
      
      throw new Error(errorMessage)
    }

    return response.json()
  }

  /**
   * Metodo di convenienza per GET con gestione errori
   */
  async getJson<T>(url: string): Promise<T> {
    const response = await this.get(url)
    return this.handleResponse<T>(response)
  }

  /**
   * Metodo di convenienza per POST con gestione errori
   */
  async postJson<T>(url: string, data?: any): Promise<T> {
    const response = await this.post(url, data)
    return this.handleResponse<T>(response)
  }

  /**
   * Metodo di convenienza per PUT con gestione errori
   */
  async putJson<T>(url: string, data?: any): Promise<T> {
    const response = await this.put(url, data)
    return this.handleResponse<T>(response)
  }

  /**
   * Metodo di convenienza per DELETE con gestione errori
   */
  async deleteJson<T>(url: string): Promise<T> {
    const response = await this.delete(url)
    return this.handleResponse<T>(response)
  }
}

// Esporta un'istanza singleton
export const apiClient = ApiClient.getInstance()

// Funzioni di convenienza per l'uso diretto
export const apiGet = <T>(url: string) => apiClient.getJson<T>(url)
export const apiPost = <T>(url: string, data?: any) => apiClient.postJson<T>(url, data)
export const apiPut = <T>(url: string, data?: any) => apiClient.putJson<T>(url, data)
export const apiDelete = <T>(url: string) => apiClient.deleteJson<T>(url)
