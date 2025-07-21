'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { Client } from '@/lib/types/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Edit, Trash2, Plus, Search, Building2, User, AlertCircle, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useClients } from '@/hooks/use-clients'
import { DeleteClientDialog } from './delete-client-dialog'

// Hook per il debouncing
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export function ClientsTable() {
  const router = useRouter()
  const { clients, loading, error, pagination, updateFilters, changePage, refetch, deleteClient } = useClients()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTipo, setSelectedTipo] = useState<string>('all')
  const [deleteClientId, setDeleteClientId] = useState<string | null>(null)
  const [tableError, setTableError] = useState<string | null>(null)
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null)

  // Debounce della ricerca per evitare chiamate eccessive
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  // Effettua la ricerca quando il termine debounced cambia
  useEffect(() => {
    updateFilters({ search: debouncedSearchTerm || undefined })
  }, [debouncedSearchTerm, updateFilters])

  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value)
  }, [])

  const handleTipoFilter = useCallback((value: string) => {
    setSelectedTipo(value)
    if (value === 'all') {
      updateFilters({ tipo: undefined })
    } else {
      updateFilters({ tipo: value as 'privato' | 'azienda' })
    }
  }, [updateFilters])

  const handleDelete = useCallback((clientId: string) => {
    setDeleteClientId(clientId)
  }, [])

  const handleConfirmDelete = useCallback(async (clientId: string) => {
    try {
      await deleteClient(clientId)
      setDeletingClientId(null)
      // Il hook si occupa già di ricaricare i dati
    } catch (error) {
      // L'errore è già gestito nel dialog
      throw error
    }
  }, [deleteClient])

  const handleDeletingChange = useCallback((deleting: boolean) => {
    if (deleting) {
      setDeletingClientId(deleteClientId)
    } else {
      setDeletingClientId(null)
    }
  }, [deleteClientId])

  const handleRetry = useCallback(() => {
    setTableError(null)
    refetch()
  }, [refetch])

  const getDisplayName = useCallback((client: Client) => {
    if (client.tipo === 'azienda') {
      return client.ragione_sociale || client.nome
    }
    return `${client.nome} ${client.cognome || ''}`.trim()
  }, [])

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT')
  }, [])

  // Memoizza le informazioni di paginazione per evitare re-render inutili
  const paginationInfo = useMemo(() => {
    const start = ((pagination.page - 1) * pagination.per_page) + 1
    const end = Math.min(pagination.page * pagination.per_page, pagination.total)
    return { start, end }
  }, [pagination.page, pagination.per_page, pagination.total])

  // Gestisce gli errori dal hook
  useEffect(() => {
    if (error) {
      setTableError(error)
    } else {
      setTableError(null)
    }
  }, [error])

  return (
    <div className="space-y-6">
      {/* Header con filtri */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Gestione Clienti
            </CardTitle>
            <Button onClick={() => router.push('/dashboard/clients/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Nuovo Cliente
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Cerca per nome, email, codice fiscale..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedTipo} onValueChange={handleTipoFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tipo cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti</SelectItem>
                <SelectItem value="privato">Privato</SelectItem>
                <SelectItem value="azienda">Azienda</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Messaggio di errore */}
      {tableError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{tableError}</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRetry}
              className="ml-2"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Riprova
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Tabella */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefono</TableHead>
                  <TableHead>Città</TableHead>
                  <TableHead>Data Creazione</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                        Caricamento...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : clients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      {tableError ? 'Errore nel caricamento dei clienti' : 'Nessun cliente trovato'}
                    </TableCell>
                  </TableRow>
                ) : (
                  clients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{getDisplayName(client)}</div>
                          <div className="text-sm text-gray-500">
                            {client.codice_fiscale}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={client.tipo === 'azienda' ? 'default' : 'secondary'}>
                          {client.tipo === 'azienda' ? (
                            <Building2 className="h-3 w-3 mr-1" />
                          ) : (
                            <User className="h-3 w-3 mr-1" />
                          )}
                          {client.tipo === 'azienda' ? 'Azienda' : 'Privato'}
                        </Badge>
                      </TableCell>
                      <TableCell>{client.email}</TableCell>
                      <TableCell>{client.telefono}</TableCell>
                      <TableCell>{client.citta}</TableCell>
                      <TableCell>{formatDate(client.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(client.id)}
                            disabled={deletingClientId === client.id}
                          >
                            {deletingClientId === client.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Paginazione */}
      {pagination.total_pages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Mostrando {paginationInfo.start} - {paginationInfo.end} di {pagination.total} clienti
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === 1 || loading}
                  onClick={() => changePage(pagination.page - 1)}
                >
                  Precedente
                </Button>
                <span className="flex items-center px-3 text-sm">
                  Pagina {pagination.page} di {pagination.total_pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === pagination.total_pages || loading}
                  onClick={() => changePage(pagination.page + 1)}
                >
                  Successiva
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog di conferma eliminazione */}
      <DeleteClientDialog
        clientId={deleteClientId}
        onClose={() => setDeleteClientId(null)}
        onConfirm={handleConfirmDelete}
        onDeletingChange={handleDeletingChange}
      />
    </div>
  )
}
