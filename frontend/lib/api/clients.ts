import { Client, CreateClientRequest, UpdateClientRequest, ClientsResponse, ClientFilters } from '@/lib/types/client'

import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api"
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export class ClientsAPI {
  private static async getAuthHeaders(): Promise<HeadersInit> {
    // Ottieni il token JWT da Supabase
    const { createClient } = await import('@/lib/supabase')
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token || ''}`
    }
  }

  private static async handleResponse(response: Response, operation: string): Promise<any> {
    if (!response.ok) {
      let errorMessage = `Errore ${response.status}: ${response.statusText}`
      
      try {
        // Parse error response JSON
        const errorData = await response.json()
        if (errorData.detail) {
          errorMessage = errorData.detail
        } else if (errorData.message) {
          errorMessage = errorData.message
        } else if (errorData.error) {
          errorMessage = errorData.error
        }
      } catch {
        // Se non riesce a parsare la risposta JSON, usa il messaggio di default
      }

      // Messaggi specifici per diversi codici di stato
      switch (response.status) {
        case 400:
          errorMessage = `Dati non validi: ${errorMessage}`
          break
        case 401:
          errorMessage = 'Sessione scaduta. Effettua nuovamente l\'accesso.'
          break
        case 403:
          errorMessage = 'Non hai i permessi per eseguire questa operazione.'
          break
        case 404:
          errorMessage = 'Risorsa non trovata.'
          break
        case 409:
          errorMessage = 'Conflitto: i dati potrebbero già esistere.'
          break
        case 422:
          errorMessage = `Errore di validazione: ${errorMessage}`
          break
        case 500:
          errorMessage = 'Errore interno del server. Riprova più tardi.'
          break
        case 502:
        case 503:
        case 504:
          errorMessage = 'Servizio temporaneamente non disponibile. Riprova più tardi.'
          break
        default:
          errorMessage = `Errore ${response.status}: ${errorMessage}`
      }

      throw new Error(errorMessage)
    }

    return response.json()
  }

  static async getClients(filters: ClientFilters = {}, signal?: AbortSignal): Promise<ClientsResponse> {
    const params = new URLSearchParams()
    
    if (filters.search) params.append('search', filters.search)
    if (filters.tipo) params.append('tipo', filters.tipo)
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.per_page) params.append('per_page', filters.per_page.toString())

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/clients/flat?${params}`, {
        method: 'GET',
        headers: await this.getAuthHeaders(),
        signal,
      })

      return await this.handleResponse(response, 'recupero dei clienti')
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw error
      }
      if (error instanceof Error && error.message.includes('fetch')) {
        throw new Error('Errore di connessione. Verifica la tua connessione internet.')
      }
      throw error
    }
  }

  static async getClient(id: string): Promise<Client> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/clients/flat/${id}`, {
        method: 'GET',
        headers: await this.getAuthHeaders(),
      })

      const result = await this.handleResponse(response, 'recupero del cliente')
      return result.client || result
    } catch (error) {
      if (error instanceof Error && error.message.includes('fetch')) {
        throw new Error('Errore di connessione. Verifica la tua connessione internet.')
      }
      throw error
    }
  }

  static async createClient(clientData: CreateClientRequest): Promise<Client> {
    try {
      const response = await apiPost(`${API_BASE_URL}/api/v1/clients/flat`, clientData)

      return await this.handleResponse(response, 'creazione del cliente')
    } catch (error) {
      if (error instanceof Error && error.message.includes('fetch')) {
        throw new Error('Errore di connessione. Verifica la tua connessione internet.')
      }
      throw error
    }
  }

  static async updateClient(id: string, clientData: Partial<CreateClientRequest>): Promise<Client> {
    try {
      const response = await apiPut(`${API_BASE_URL}/api/v1/clients/flat/${id}`, clientData)

      const result = await this.handleResponse(response, 'aggiornamento del cliente')
      return result.client || result
    } catch (error) {
      if (error instanceof Error && error.message.includes('fetch')) {
        throw new Error('Errore di connessione. Verifica la tua connessione internet.')
      }
      throw error
    }
  }

  static async deleteClient(id: string): Promise<void> {
    try {
      const response = await apiDelete(`${API_BASE_URL}/api/v1/clients/${id}`)

      await this.handleResponse(response, 'eliminazione del cliente')
    } catch (error) {
      if (error instanceof Error && error.message.includes('fetch')) {
        throw new Error('Errore di connessione. Verifica la tua connessione internet.')
      }
      throw error
    }
  }
}
