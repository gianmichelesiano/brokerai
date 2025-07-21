'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ClientForm } from '@/components/clients/client-form'
import { Client } from '@/lib/types/client'
import { ClientsAPI } from '@/lib/api/clients'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react'

export default function EditClientPage() {
  const params = useParams()
  const router = useRouter()
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retrying, setRetrying] = useState(false)

  const fetchClient = async (isRetry = false) => {
    if (!params.id) return

    if (isRetry) {
      setRetrying(true)
    } else {
      setLoading(true)
    }
    setError(null)

    try {
      const clientData = await ClientsAPI.getClient(params.id as string)
      setClient(clientData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore nel caricamento del cliente'
      
      // Determina il tipo di errore specifico
      if (errorMessage.includes('Network') || errorMessage.includes('fetch')) {
        setError('Errore di connessione. Verifica la tua connessione internet e riprova.')
      } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        setError('Sessione scaduta. Effettua nuovamente l\'accesso.')
      } else if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
        setError('Non hai i permessi per visualizzare questo cliente.')
      } else if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
        setError('Cliente non trovato. Potrebbe essere stato eliminato o non esistere.')
      } else if (errorMessage.includes('500') || errorMessage.includes('Internal')) {
        setError('Errore del server. Riprova più tardi.')
      } else {
        setError(errorMessage)
      }
    } finally {
      setLoading(false)
      setRetrying(false)
    }
  }

  useEffect(() => {
    fetchClient()
  }, [params.id])

  const handleRetry = () => {
    fetchClient(true)
  }

  const handleBack = () => {
    router.push('/dashboard/clients')
  }

  if (loading && !retrying) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-8">
          <CardContent className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Caricamento cliente...</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Indietro
          </Button>
          <h1 className="text-2xl font-bold">Modifica Cliente</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Errore nel caricamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
            
            <div className="flex gap-2">
              <Button onClick={handleRetry} disabled={retrying}>
                <RefreshCw className={`h-4 w-4 mr-2 ${retrying ? 'animate-spin' : ''}`} />
                {retrying ? 'Riprova...' : 'Riprova'}
              </Button>
              <Button variant="outline" onClick={handleBack}>
                Torna alla lista
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Indietro
          </Button>
          <h1 className="text-2xl font-bold">Modifica Cliente</h1>
        </div>

        <Card>
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto" />
              <p className="text-gray-600">Cliente non trovato</p>
              <p className="text-sm text-gray-500">
                Il cliente che stai cercando potrebbe essere stato eliminato o non esistere.
              </p>
              <Button onClick={handleBack}>
                Torna alla lista clienti
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <ClientForm client={client} isEditing={true} />
} 