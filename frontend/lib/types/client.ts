export interface Client {
  id: string
  broker_id: string
  tipo: 'privato' | 'azienda'
  nome: string
  cognome?: string
  ragione_sociale?: string
  email: string
  telefono: string
  indirizzo: string
  citta: string
  provincia: string
  cap: string
  partita_iva?: string
  codice_fiscale: string
  created_at: string
  updated_at: string
}

export interface CreateClientRequest {
  tipo: 'privato' | 'azienda'
  nome: string
  cognome?: string
  ragione_sociale?: string
  email: string
  telefono: string
  indirizzo: string
  citta: string
  provincia: string
  cap: string
  partita_iva?: string
  codice_fiscale: string
}

export interface UpdateClientRequest extends Partial<CreateClientRequest> {
  id: string
}

export interface ClientsResponse {
  clients: Client[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

export interface ClientFilters {
  search?: string
  tipo?: 'privato' | 'azienda'
  page?: number
  per_page?: number
} 