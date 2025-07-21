'use client'

import { useState, useEffect } from 'react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useClients } from '@/hooks/use-clients'
import { ClientsAPI } from '@/lib/api/clients'
import { AlertCircle } from 'lucide-react'

interface DeleteClientDialogProps {
  clientId: string | null
  onClose: () => void
  onConfirm: (clientId: string) => Promise<void>
  onDeletingChange?: (deleting: boolean) => void
}

export function DeleteClientDialog({ clientId, onClose, onConfirm, onDeletingChange }: DeleteClientDialogProps) {
  const [clientName, setClientName] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (clientId) {
      // Carica i dati del cliente per mostrare il nome nel dialog
      const fetchClientName = async () => {
        try {
          const client = await ClientsAPI.getClient(clientId)
          if (client.tipo === 'azienda') {
            setClientName(client.ragione_sociale || client.nome)
          } else {
            setClientName(`${client.nome} ${client.cognome || ''}`.trim())
          }
        } catch (error) {
          setClientName('Cliente')
        }
      }
      fetchClientName()
    }
  }, [clientId])

  const handleDelete = async () => {
    if (!clientId) return

    setLoading(true)
    setError(null)
    onDeletingChange?.(true)
    
    try {
      await onConfirm(clientId)
      // Chiudi il dialog solo dopo il successo
      onClose()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto'
      
      // Determina il tipo di errore specifico
      if (errorMessage.includes('Network') || errorMessage.includes('fetch')) {
        setError('Errore di connessione. Verifica la tua connessione internet e riprova.')
      } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        setError('Sessione scaduta. Effettua nuovamente l\'accesso.')
      } else if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
        setError('Non hai i permessi per eliminare questo cliente.')
      } else if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
        setError('Cliente non trovato. Potrebbe essere già stato eliminato.')
      } else if (errorMessage.includes('409') || errorMessage.includes('Conflict')) {
        setError('Impossibile eliminare il cliente. Potrebbe essere referenziato da altri dati.')
      } else if (errorMessage.includes('500') || errorMessage.includes('Internal')) {
        setError('Errore del server. Riprova più tardi.')
      } else {
        setError(errorMessage)
      }
    } finally {
      setLoading(false)
      onDeletingChange?.(false)
    }
  }

  const handleClose = () => {
    setError(null)
    onClose()
  }

  return (
    <AlertDialog open={!!clientId} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
          <AlertDialogDescription>
            Sei sicuro di voler eliminare il cliente <strong>{clientName}</strong>? 
            Questa azione non può essere annullata.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Annulla</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? 'Eliminazione...' : 'Elimina'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
} 