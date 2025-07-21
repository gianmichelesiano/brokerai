'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Save, User, Building2, AlertCircle, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Client, CreateClientRequest } from '@/lib/types/client'
import { useClients } from '@/hooks/use-clients'

// Schema di validazione migliorato con messaggi più specifici
const clientSchema = z.object({
  tipo: z.enum(['privato', 'azienda'], {
    required_error: 'Seleziona il tipo di cliente'
  }),
  nome: z.string().min(1, 'Il nome è obbligatorio').max(100, 'Il nome non può superare i 100 caratteri'),
  cognome: z.string().optional(),
  ragione_sociale: z.string().optional(),
  email: z.string().email('Inserisci un indirizzo email valido').max(255, 'L\'email non può superare i 255 caratteri'),
  telefono: z.string().min(1, 'Il telefono è obbligatorio').max(20, 'Il telefono non può superare i 20 caratteri'),
  indirizzo: z.string().min(1, 'L\'indirizzo è obbligatorio').max(255, 'L\'indirizzo non può superare i 255 caratteri'),
  citta: z.string().min(1, 'La città è obbligatoria').max(100, 'La città non può superare i 100 caratteri'),
  provincia: z.string().min(2, 'La provincia è obbligatoria').max(2, 'La provincia deve essere di 2 caratteri'),
  cap: z.string().min(5, 'Il CAP è obbligatorio').max(5, 'Il CAP deve essere di 5 caratteri').regex(/^\d{5}$/, 'Il CAP deve contenere solo numeri'),
  partita_iva: z.string().optional(),
  codice_fiscale: z.string().min(16, 'Il codice fiscale è obbligatorio').max(16, 'Il codice fiscale deve essere di 16 caratteri').regex(/^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/, 'Formato codice fiscale non valido'),
}).refine((data) => {
  if (data.tipo === 'privato') {
    return !!data.cognome
  }
  if (data.tipo === 'azienda') {
    return !!data.ragione_sociale && !!data.partita_iva
  }
  return true
}, {
  message: "Per i privati è obbligatorio il cognome, per le aziende sono obbligatori ragione sociale e partita IVA",
  path: ["tipo"]
})

type ClientFormData = z.infer<typeof clientSchema>

interface ClientFormProps {
  client?: Client
  isEditing?: boolean
}

export function ClientForm({ client, isEditing = false }: ClientFormProps) {
  const router = useRouter()
  const { createClient, updateClient } = useClients()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [networkError, setNetworkError] = useState(false)

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      tipo: 'privato',
      nome: '',
      cognome: '',
      ragione_sociale: '',
      email: '',
      telefono: '',
      indirizzo: '',
      citta: '',
      provincia: '',
      cap: '',
      partita_iva: '',
      codice_fiscale: '',
    }
  })

  const tipo = form.watch('tipo')

  useEffect(() => {
    if (client && isEditing) {
      form.reset({
        tipo: client.tipo,
        nome: client.nome,
        cognome: client.cognome || '',
        ragione_sociale: client.ragione_sociale || '',
        email: client.email,
        telefono: client.telefono,
        indirizzo: client.indirizzo,
        citta: client.citta,
        provincia: client.provincia,
        cap: client.cap,
        partita_iva: client.partita_iva || '',
        codice_fiscale: client.codice_fiscale,
      })
    }
  }, [client, isEditing, form])

  const onSubmit = async (data: ClientFormData) => {
    setLoading(true)
    setError(null)
    setSuccess(false)
    setNetworkError(false)

    try {
      if (isEditing && client) {
        await updateClient(client.id, data)
      } else {
        await createClient(data)
      }
      
      setSuccess(true)
      // Redirect dopo un breve delay per mostrare il messaggio di successo
      setTimeout(() => {
        router.push('/dashboard/clients')
      }, 1500)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore sconosciuto'
      
      // Determina il tipo di errore
      if (errorMessage.includes('Network') || errorMessage.includes('fetch')) {
        setNetworkError(true)
        setError('Errore di connessione. Verifica la tua connessione internet e riprova.')
      } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        setError('Sessione scaduta. Effettua nuovamente l\'accesso.')
      } else if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
        setError('Non hai i permessi per eseguire questa operazione.')
      } else if (errorMessage.includes('409') || errorMessage.includes('Conflict')) {
        setError('Un cliente con questi dati esiste già. Verifica email e codice fiscale.')
      } else if (errorMessage.includes('422') || errorMessage.includes('Validation')) {
        setError('Dati non validi. Verifica i campi inseriti.')
      } else if (errorMessage.includes('500') || errorMessage.includes('Internal')) {
        setError('Errore del server. Riprova più tardi.')
      } else {
        setError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    if (form.formState.isDirty && !success) {
      if (window.confirm('Hai modifiche non salvate. Vuoi davvero uscire?')) {
        router.back()
      }
    } else {
      router.back()
    }
  }

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
        <h1 className="text-2xl font-bold">
          {isEditing ? 'Modifica Cliente' : 'Nuovo Cliente'}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {tipo === 'azienda' ? (
              <Building2 className="h-5 w-5" />
            ) : (
              <User className="h-5 w-5" />
            )}
            {isEditing ? 'Modifica Cliente' : 'Nuovo Cliente'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Messaggio di successo */}
              {success && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    {isEditing ? 'Cliente aggiornato con successo!' : 'Cliente creato con successo!'}
                  </AlertDescription>
                </Alert>
              )}

              {/* Messaggio di errore */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {error}
                    {networkError && (
                      <div className="mt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => form.handleSubmit(onSubmit)()}
                          className="text-sm"
                        >
                          Riprova
                        </Button>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {/* Tipo Cliente */}
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo Cliente *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className={form.formState.errors.tipo ? "border-red-500" : ""}>
                          <SelectValue placeholder="Seleziona il tipo di cliente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="privato">Privato</SelectItem>
                        <SelectItem value="azienda">Azienda</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nome */}
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Nome" 
                          {...field} 
                          className={form.formState.errors.nome ? "border-red-500" : ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Cognome (solo per privati) */}
                {tipo === 'privato' && (
                  <FormField
                    control={form.control}
                    name="cognome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cognome *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Cognome" 
                            {...field} 
                            className={form.formState.errors.cognome ? "border-red-500" : ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Ragione Sociale (solo per aziende) */}
                {tipo === 'azienda' && (
                  <FormField
                    control={form.control}
                    name="ragione_sociale"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ragione Sociale *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ragione Sociale" 
                            {...field} 
                            className={form.formState.errors.ragione_sociale ? "border-red-500" : ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="email@esempio.it" 
                          {...field} 
                          className={form.formState.errors.email ? "border-red-500" : ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Telefono */}
                <FormField
                  control={form.control}
                  name="telefono"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefono *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="+39 123 456 7890" 
                          {...field} 
                          className={form.formState.errors.telefono ? "border-red-500" : ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Indirizzo */}
              <FormField
                control={form.control}
                name="indirizzo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Indirizzo *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Via Roma 123" 
                        {...field} 
                        className={form.formState.errors.indirizzo ? "border-red-500" : ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Città */}
                <FormField
                  control={form.control}
                  name="citta"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Città *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Milano" 
                          {...field} 
                          className={form.formState.errors.citta ? "border-red-500" : ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Provincia */}
                <FormField
                  control={form.control}
                  name="provincia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provincia *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="MI" 
                          maxLength={2} 
                          {...field} 
                          className={form.formState.errors.provincia ? "border-red-500" : ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* CAP */}
                <FormField
                  control={form.control}
                  name="cap"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CAP *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="20100" 
                          maxLength={5} 
                          {...field} 
                          className={form.formState.errors.cap ? "border-red-500" : ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Partita IVA (solo per aziende) */}
                {tipo === 'azienda' && (
                  <FormField
                    control={form.control}
                    name="partita_iva"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Partita IVA *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="12345678901" 
                            {...field} 
                            className={form.formState.errors.partita_iva ? "border-red-500" : ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Codice Fiscale */}
                <FormField
                  control={form.control}
                  name="codice_fiscale"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Codice Fiscale *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="RSSMRA80A01H501U" 
                          maxLength={16} 
                          {...field} 
                          className={form.formState.errors.codice_fiscale ? "border-red-500" : ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={loading}
                >
                  Annulla
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading || success}
                  className={success ? "bg-green-600 hover:bg-green-700" : ""}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Salvataggio...' : success ? 'Salvato!' : (isEditing ? 'Aggiorna' : 'Crea')}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
} 