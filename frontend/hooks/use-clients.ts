'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Client, CreateClientRequest, ClientFilters, ClientsResponse } from '@/lib/types/client'
import { ClientsAPI } from '@/lib/api/clients'
import { useToast } from '@/hooks/use-toast'

export function useClients() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<ClientFilters>({
    page: 1,
    per_page: 10
  })
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    per_page: 10,
    total_pages: 0
  })
  const { toast } = useToast()
  const filtersRef = useRef<ClientFilters>(filters)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Aggiorna il ref quando i filtri cambiano
  useEffect(() => {
    filtersRef.current = filters
  }, [filters])

  const fetchClients = useCallback(async (newFilters?: ClientFilters) => {
    // Cancella la richiesta precedente se esiste
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Crea un nuovo AbortController per questa richiesta
    abortControllerRef.current = new AbortController()
    
    setLoading(true)
    setError(null)
    
    try {
      const currentFilters = newFilters || filtersRef.current
      const response: ClientsResponse = await ClientsAPI.getClients(currentFilters, abortControllerRef.current.signal)
      
      setClients(response.clients)
      setPagination({
        total: response.total,
        page: response.page,
        per_page: response.per_page,
        total_pages: response.total_pages
      })
    } catch (err) {
      // Ignora gli errori di abort
      if (err instanceof Error && err.name === 'AbortError') {
        return
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Errore sconosciuto'
      setError(errorMessage)
      toast({
        title: "Errore",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const createClient = useCallback(async (clientData: CreateClientRequest) => {
    setLoading(true)
    setError(null)
    
    try {
      const newClient = await ClientsAPI.createClient(clientData)
      setClients(prev => [newClient, ...prev])
      toast({
        title: "Successo",
        description: "Cliente creato con successo"
      })
      return newClient
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore sconosciuto'
      setError(errorMessage)
      toast({
        title: "Errore",
        description: errorMessage,
        variant: "destructive"
      })
      throw err
    } finally {
      setLoading(false)
    }
  }, [toast])

  const updateClient = useCallback(async (id: string, clientData: Partial<CreateClientRequest>) => {
    setLoading(true)
    setError(null)
    
    try {
      const updatedClient = await ClientsAPI.updateClient(id, clientData)
      setClients(prev => prev.map(client => 
        client.id === id ? updatedClient : client
      ))
      toast({
        title: "Successo",
        description: "Cliente aggiornato con successo"
      })
      return updatedClient
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore sconosciuto'
      setError(errorMessage)
      toast({
        title: "Errore",
        description: errorMessage,
        variant: "destructive"
      })
      throw err
    } finally {
      setLoading(false)
    }
  }, [toast])

  const deleteClient = useCallback(async (id: string) => {
    console.log('deleteClient called with id:', id)
    setLoading(true)
    setError(null)
    
    try {
      await ClientsAPI.deleteClient(id)
      console.log('Client deleted from API successfully')
      
      // Rimuovi il cliente dallo stato locale
      setClients(prev => {
        console.log('Previous clients:', prev.length)
        const filtered = prev.filter(client => client.id !== id)
        console.log('Filtered clients:', filtered.length)
        return filtered
      })
      
      // Aggiorna il conteggio totale
      setPagination(prev => ({
        ...prev,
        total: prev.total - 1
      }))
      
      // Ricarica i dati per assicurarsi che tutto sia sincronizzato
      console.log('Refreshing data after deletion')
      fetchClients()
      
      toast({
        title: "Successo",
        description: "Cliente eliminato con successo"
      })
    } catch (err) {
      console.error('Error in deleteClient:', err)
      const errorMessage = err instanceof Error ? err.message : 'Errore sconosciuto'
      setError(errorMessage)
      toast({
        title: "Errore",
        description: errorMessage,
        variant: "destructive"
      })
      throw err
    } finally {
      setLoading(false)
    }
  }, [toast, fetchClients])

  const updateFilters = useCallback((newFilters: Partial<ClientFilters>) => {
    const updatedFilters = { ...filtersRef.current, ...newFilters, page: 1 }
    setFilters(updatedFilters)
    fetchClients(updatedFilters)
  }, [fetchClients])

  const changePage = useCallback((page: number) => {
    const updatedFilters = { ...filtersRef.current, page }
    setFilters(updatedFilters)
    fetchClients(updatedFilters)
  }, [fetchClients])

  // Effettua la chiamata iniziale solo al mount
  useEffect(() => {
    fetchClients()
    
    // Cleanup: cancella le richieste in corso quando il componente viene smontato
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, []) // Dipendenze vuote per eseguire solo al mount

  return {
    clients,
    loading,
    error,
    filters,
    pagination,
    createClient,
    updateClient,
    deleteClient,
    updateFilters,
    changePage,
    refetch: () => fetchClients()
  }
}
