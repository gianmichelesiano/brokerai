'use client'

import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "sonner"
import { BarChart3, Building2, FileText, Loader2, AlertCircle, CheckCircle2, Tag, Save, ChevronDown, ChevronUp, Download } from "lucide-react" // Added Save icon and chevron icons
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog" // New import
import { Input } from "@/components/ui/input" // New import
import { Textarea } from "@/components/ui/textarea" // New import
import { createClient } from "@/lib/supabase" // For access token

interface Tipologia {
  id: number
  nome: string
  descrizione: string
  created_at: string
  updated_at: string
}

interface Compagnia {
  id: number
  nome: string
  created_at: string
}

interface Garanzia {
  id: number
  titolo: string
  descrizione: string
  sezione_id: number
  sezione_nome: string
  tipologia: number
  created_at: string
  updated_at: string
}

interface ConfrontoRisultato {
  risultati_analisi: Array<{
    nome_garanzia: string
    compagnie_analizzate: string[]
    punti_comuni: string[]
    confronto_dettagliato: Array<{
      aspetto: string
      dettagli: Array<{
        compagnia: string
        clausola: string
      }>
    }>
    riepilogo_principali_differenze: string[]
  }>
  timestamp: string
}

export default function ConfrontoPolizzePage() {
  const [tipologie, setTipologie] = useState<Tipologia[]>([])
  const [selectedTipologia, setSelectedTipologia] = useState<number | null>(null)
  const [compagnie, setCompagnie] = useState<Compagnia[]>([])
  const [garanzie, setGaranzie] = useState<Garanzia[]>([])
  const [selectedCompagnie, setSelectedCompagnie] = useState<number[]>([])
  const [selectedGaranzie, setSelectedGaranzie] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [risultati, setRisultati] = useState<ConfrontoRisultato | null>(null)
  // Aggiungi stato per il dialog di salvataggio
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [saveForm, setSaveForm] = useState({ nome: '', descrizione: '' })
  // Stato per controllare quali card sono espanse
  const [expandedCards, setExpandedCards] = useState<number[]>([]) // Inizialmente tutte le card sono chiuse
  // Stato per l'export PDF
  const [isExportingPDF, setIsExportingPDF] = useState(false)

  useEffect(() => {
    fetchTipologie()
  }, [])

  useEffect(() => {
    if (selectedTipologia) {
      fetchCompagnieAndGaranzie()
    } else {
      // Reset selections when tipologia changes
      setCompagnie([])
      setGaranzie([])
      setSelectedCompagnie([])
      setSelectedGaranzie([])
    }
  }, [selectedTipologia])

  const fetchTipologie = async () => {
    try {
      setLoadingData(true)
      const data = await apiGet<{ items: Tipologia[] }>(`${process.env.NEXT_PUBLIC_BASE_URL}/api/tipologia-assicurazione/?page=1&size=100&sort_by=created_at&sort_order=desc`)
      setTipologie(data.items || [])
    } catch (error) {
      console.error('Errore:', error)
      toast.error('Errore nel caricamento delle tipologie')
    } finally {
      setLoadingData(false)
    }
  }

  const fetchCompagnieAndGaranzie = async () => {
    try {
      setLoadingData(true)
      
      // Fetch compagnie filtered by tipologia (only those with uploaded files for this insurance type)
      const compagnieData = await apiGet<{ compagnie: { compagnia_id: number; compagnia_nome: string; has_text: boolean; attiva: boolean }[] }>(`${process.env.NEXT_PUBLIC_BASE_URL}/api/compagnia-tipologia/tipologia/${selectedTipologia}/compagnie?attiva=true`)
      
      // Filter only companies that have uploaded files with extracted text
      const compagnieConFile = compagnieData.compagnie
        .filter(c => c.has_text && c.attiva)
        .map(c => ({
          id: c.compagnia_id,
          nome: c.compagnia_nome,
          created_at: new Date().toISOString() // Placeholder since we don't have this from the API
        }))
      
      setCompagnie(compagnieConFile || [])

      // Fetch garanzie filtered by tipologia
      const garanzieData = await apiGet<{ garanzie: { items: Garanzia[] } }>(`${process.env.NEXT_PUBLIC_BASE_URL}/api/garanzie/by-tipologia/${selectedTipologia}?page=1&size=100&sort_by=created_at&sort_order=desc`)
      setGaranzie(garanzieData.garanzie?.items || [])
    } catch (error) {
      console.error('Errore:', error)
      toast.error('Errore nel caricamento dei dati')
      setCompagnie([])
      setGaranzie([])
    } finally {
      setLoadingData(false)
    }
  }

  const handleCompagniaToggle = (compagniaId: number) => {
    setSelectedCompagnie(prev => 
      prev.includes(compagniaId)
        ? prev.filter(id => id !== compagniaId)
        : [...prev, compagniaId]
    )
  }

  const handleGaranziaToggle = (garanziaId: number) => {
    setSelectedGaranzie(prev => 
      prev.includes(garanziaId)
        ? prev.filter(id => id !== garanziaId)
        : [...prev, garanziaId]
    )
  }

  const handleSelectAllCompagnie = () => {
    if (selectedCompagnie.length === compagnie.length) {
      // Deselect all
      setSelectedCompagnie([])
    } else {
      // Select all
      setSelectedCompagnie(compagnie.map(c => c.id))
    }
  }

  const handleSelectAllGaranzie = () => {
    if (selectedGaranzie.length === garanzie.length) {
      // Deselect all
      setSelectedGaranzie([])
    } else {
      // Select all
      setSelectedGaranzie(garanzie.map(g => g.id))
    }
  }

  const toggleCardExpansion = (index: number) => {
    setExpandedCards(prev => 
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    )
  }

  const handleConfronto = async () => {
    if (!selectedTipologia) {
      toast.error("Seleziona una tipologia di assicurazione")
      return
    }

    if (selectedCompagnie.length < 2) {
      toast.error("Seleziona almeno 2 compagnie per il confronto")
      return
    }

    if (selectedGaranzie.length === 0) {
      toast.error("Seleziona almeno una garanzia")
      return
    }

    setLoading(true)
    try {
      const requestBody = {
        compagnia_ids: selectedCompagnie,
        garanzie_ids: selectedGaranzie,
      }
      console.log('Sending request:', requestBody)
      console.log('selectedCompagnie type:', typeof selectedCompagnie, 'value:', selectedCompagnie)
      console.log('selectedGaranzie type:', typeof selectedGaranzie, 'value:', selectedGaranzie)
      const data = await apiPost<ConfrontoRisultato>(`${process.env.NEXT_PUBLIC_BASE_URL}/api/confronti/compare`, requestBody)

      setRisultati(data)
      // Reset expanded cards - inizialmente tutte chiuse
      setExpandedCards([])
      toast.success("Confronto completato con successo")
    } catch (error) {
      console.error('Errore:', error)
      
      // Messaggio più informativo basato sul tipo di errore
      if (error?.response?.status === 404) {
        toast.error("Nessun documento analizzato trovato. Carica e analizza documenti per le compagnie selezionate prima di effettuare il confronto.")
      } else if (error?.response?.status === 400) {
        toast.error("Dati insufficienti per il confronto. Sono necessari almeno 2 documenti analizzati.")
      } else {
        toast.error("Errore durante il confronto")
      }
    } finally {
      setLoading(false)
    }
  }

  // Funzione per export PDF
  const handleExportPDF = async () => {
    if (!risultati || !selectedTipologiaData) {
      toast.error("Nessun risultato di confronto disponibile per l'export")
      return
    }

    setIsExportingPDF(true)
    
    try {
      // Prepara i dati per il PDF
      const compagnieNames = selectedCompagnie
        .map(id => compagnie.find(c => c.id === id)?.nome)
        .filter(Boolean) as string[]
      
      const garanzieNames = selectedGaranzie
        .map(id => garanzie.find(g => g.id === id)?.titolo)
        .filter(Boolean) as string[]

      // Ottieni token di autenticazione
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token

      if (!accessToken) {
        toast.error("Utente non autenticato. Effettua il login.")
        return
      }

      // Chiama l'endpoint server-side per generare il PDF
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/pdf/confronto/live`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          tipologia_nome: selectedTipologiaData.nome,
          compagnie_nomi: compagnieNames,
          garanzie_nomi: garanzieNames,
          risultati_analisi: risultati.risultati_analisi,
          timestamp: risultati.timestamp
        })
      })

      if (!response.ok) {
        throw new Error(`Errore HTTP: ${response.status}`)
      }

      // Scarica il PDF
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      
      // Genera nome file
      const tipologiaSanitized = selectedTipologiaData.nome.toLowerCase().replace(/[^a-z0-9]/g, '-')
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `confronto-${tipologiaSanitized}-${timestamp}.pdf`
      
      // Scarica il file
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast.success('PDF esportato con successo')
    } catch (error) {
      console.error('Errore durante l\'export PDF:', error)
      toast.error('Errore durante l\'export PDF')
    } finally {
      setIsExportingPDF(false)
    }
  }

  // Funzione per salvare
  const handleSaveConfronto = async () => {
    if (!selectedTipologia) {
      toast.error("Tipologia di assicurazione non selezionata.")
      return
    }
    if (selectedCompagnie.length === 0) {
      toast.error("Nessuna compagnia selezionata.")
      return
    }
    if (selectedGaranzie.length === 0) {
      toast.error("Nessuna garanzia selezionata.")
      return
    }
    if (!saveForm.nome.trim()) {
      toast.error("Il nome del confronto è obbligatorio.")
      return
    }

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        toast.error("Utente non autenticato. Effettua il login.");
        return;
      }

      await apiPost(`${process.env.NEXT_PUBLIC_BASE_URL}/api/confronti/salva`, {
        nome: saveForm.nome,
        descrizione: saveForm.descrizione,
        tipologia_id: selectedTipologia,
        compagnie_ids: selectedCompagnie,
        garanzie_ids: selectedGaranzie,
        dati_confronto: risultati
      })
      
      toast.success('Confronto salvato con successo')
      setShowSaveDialog(false)
      setSaveForm({ nome: '', descrizione: '' }) // Reset form
    } catch (error) {
      console.error('Errore nel salvataggio:', error)
      toast.error('Errore nel salvataggio del confronto')
    }
  }

  const selectedTipologiaData = tipologie.find(t => t.id === selectedTipologia)

  if (loadingData && tipologie.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 font-display">Confronto Polizze</h1>
        <p className="text-gray-600 mt-1">Confronta le garanzie tra diverse compagnie assicurative</p>
      </div>

      {/* Step 1: Selezione Tipologia */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Rami Assicurazione
          </CardTitle>
          <CardDescription>
            Seleziona il ramo di assicurazione da confrontare
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={selectedTipologia?.toString()} onValueChange={(value) => setSelectedTipologia(Number(value))}>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {tipologie.map((tipologia) => (
                  <div key={tipologia.id} className="flex items-start space-x-2">
                    <RadioGroupItem value={tipologia.id.toString()} id={`tipologia-${tipologia.id}`} className="mt-1" />
                    <div className="flex-1">
                      <Label
                        htmlFor={`tipologia-${tipologia.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {tipologia.nome}
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        {tipologia.descrizione}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </RadioGroup>
          {selectedTipologiaData && (
            <div className="mt-4 pt-4 border-t">
              <Badge variant="secondary">
                {selectedTipologiaData.nome}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2 & 3: Selezione Compagnie e Garanzie - Mostrate solo dopo aver selezionato tipologia */}
      {selectedTipologia && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Selezione Compagnie */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Compagnie
              </CardTitle>
              <CardDescription>
                Seleziona almeno 2 compagnie (solo quelle con file caricato per questo ramo)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingData ? (
                <div className="flex items-center justify-center h-[400px]">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : compagnie.length === 0 ? (
                <div className="flex items-center justify-center h-[400px] text-sm text-muted-foreground text-center">
                  <div>
                    Nessuna compagnia disponibile per questo ramo assicurativo.
                    <br />
                    Le compagnie devono aver caricato un file polizza per questo ramo.
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-3 pb-3 border-b">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="select-all-compagnie"
                        checked={compagnie.length > 0 && selectedCompagnie.length === compagnie.length}
                        indeterminate={selectedCompagnie.length > 0 && selectedCompagnie.length < compagnie.length}
                        onCheckedChange={handleSelectAllCompagnie}
                      />
                      <Label
                        htmlFor="select-all-compagnie"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        Seleziona tutte ({compagnie.length})
                      </Label>
                    </div>
                  </div>
                  <ScrollArea className="h-[350px] pr-4">
                    <div className="space-y-3">
                      {compagnie.map((compagnia) => (
                        <div key={compagnia.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`compagnia-${compagnia.id}`}
                            checked={selectedCompagnie.includes(compagnia.id)}
                            onCheckedChange={() => handleCompagniaToggle(compagnia.id)}
                          />
                          <Label
                            htmlFor={`compagnia-${compagnia.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                          >
                            {compagnia.nome}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  {selectedCompagnie.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        {selectedCompagnie.length} compagni{selectedCompagnie.length === 1 ? 'a' : 'e'} selezionat{selectedCompagnie.length === 1 ? 'a' : 'e'}
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Selezione Garanzie */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Garanzie
              </CardTitle>
              <CardDescription>
                Seleziona le garanzie da confrontare
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingData ? (
                <div className="flex items-center justify-center h-[400px]">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : garanzie.length === 0 ? (
                <div className="flex items-center justify-center h-[400px] text-sm text-muted-foreground">
                  Nessuna garanzia disponibile per questa tipologia
                </div>
              ) : (
                <>
                  <div className="mb-3 pb-3 border-b">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="select-all-garanzie"
                        checked={garanzie.length > 0 && selectedGaranzie.length === garanzie.length}
                        indeterminate={selectedGaranzie.length > 0 && selectedGaranzie.length < garanzie.length}
                        onCheckedChange={handleSelectAllGaranzie}
                      />
                      <Label
                        htmlFor="select-all-garanzie"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        Seleziona tutte ({garanzie.length})
                      </Label>
                    </div>
                  </div>
                  <ScrollArea className="h-[350px] pr-4">
                    <div className="space-y-3">
                      {garanzie.map((garanzia) => (
                        <div key={garanzia.id} className="flex items-start space-x-2">
                          <Checkbox
                            id={`garanzia-${garanzia.id}`}
                            checked={selectedGaranzie.includes(garanzia.id)}
                            onCheckedChange={() => handleGaranziaToggle(garanzia.id)}
                            className="mt-0.5"
                          />
                          <div className="flex-1">
                            <Label
                              htmlFor={`garanzia-${garanzia.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {garanzia.titolo}
                            </Label>
                            <p className="text-xs text-muted-foreground mt-1">
                              {garanzia.sezione_nome || 'Sezione non specificata'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  {selectedGaranzie.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        {selectedGaranzie.length} garanzi{selectedGaranzie.length === 1 ? 'a' : 'e'} selezionat{selectedGaranzie.length === 1 ? 'a' : 'e'}
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Riepilogo e Azione */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Riepilogo
              </CardTitle>
              <CardDescription>
                Rivedi la selezione e avvia il confronto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Tipologia:</h4>
                {selectedTipologiaData ? (
                  <Badge variant="secondary">
                    {selectedTipologiaData.nome}
                  </Badge>
                ) : (
                  <p className="text-sm text-muted-foreground">Nessuna tipologia selezionata</p>
                )}
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-medium mb-2">Compagnie selezionate:</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedCompagnie.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nessuna compagnia selezionata</p>
                  ) : (
                    selectedCompagnie.map(id => {
                      const compagnia = compagnie.find(c => c.id === id)
                      return compagnia ? (
                        <Badge key={id} variant="secondary">
                          {compagnia.nome}
                        </Badge>
                      ) : null
                    })
                  )}
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-medium mb-2">Garanzie selezionate:</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedGaranzie.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nessuna garanzia selezionata</p>
                  ) : (
                    selectedGaranzie.map(id => {
                      const garanzia = garanzie.find(g => g.id === id)
                      return garanzia ? (
                        <Badge key={id} variant="outline">
                          {garanzia.titolo}
                        </Badge>
                      ) : null
                    })
                  )}
                </div>
              </div>

              <Separator />

              <Button
                onClick={handleConfronto}
                disabled={loading || !selectedTipologia || selectedCompagnie.length < 2 || selectedGaranzie.length === 0}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Confronto in corso...
                  </>
                ) : (
                  <>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Avvia Confronto
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Risultati */}
      {risultati && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Risultati del Confronto</CardTitle>
            <CardDescription>
              Analisi completata il {new Date(risultati.timestamp).toLocaleString('it-IT')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {risultati.risultati_analisi.map((analisi, index) => (
                <Card key={index} className="border-2">
                  <Collapsible 
                    open={expandedCards.includes(index)} 
                    onOpenChange={() => toggleCardExpansion(index)}
                  >
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{analisi.nome_garanzia}</CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="ml-2">
                              {analisi.compagnie_analizzate.length} compagnie
                            </Badge>
                            {expandedCards.includes(index) ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </div>
                        </div>
                        <CardDescription>
                          Compagnie: {analisi.compagnie_analizzate.join(', ')}
                        </CardDescription>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="space-y-6 pt-0">
                        {/* Compagnie Analizzate */}
                        <div>
                          <h3 className="text-lg font-semibold mb-3">Compagnie Analizzate</h3>
                          <div className="flex gap-2 flex-wrap">
                            {analisi.compagnie_analizzate.map((compagnia, i) => (
                              <Badge key={i} variant="secondary">
                                {compagnia}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Punti Comuni */}
                        <div>
                          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            Punti Comuni
                          </h3>
                          <ul className="space-y-2">
                            {analisi.punti_comuni.map((punto, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-1.5 flex-shrink-0" />
                                <span className="text-sm">{punto}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Confronto Dettagliato */}
                        <div>
                          <h3 className="text-lg font-semibold mb-3">Confronto Dettagliato</h3>
                          <div className="space-y-4">
                            {analisi.confronto_dettagliato.map((confronto, i) => (
                              <Card key={i} className="bg-muted/30">
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-base">{confronto.aspetto}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                  {confronto.dettagli.map((dettaglio, j) => (
                                    <div key={j} className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="font-medium">
                                          {dettaglio.compagnia}
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-muted-foreground pl-2">
                                        {dettaglio.clausola}
                                      </p>
                                    </div>
                                  ))}
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>

                        {/* Principali Differenze */}
                        <div>
                          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-amber-600" />
                            Principali Differenze
                          </h3>
                          <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              <ul className="space-y-2 mt-2">
                                {analisi.riepilogo_principali_differenze.map((differenza, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-1.5 flex-shrink-0" />
                                    <span className="text-sm">{differenza}</span>
                                  </li>
                                ))}
                              </ul>
                            </AlertDescription>
                          </Alert>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              ))}
            </div>
          </CardContent>
          {risultati && (
            <div className="px-6 pb-6">
              <div className="flex gap-3">
                <Button 
                  onClick={() => setShowSaveDialog(true)} 
                  className="flex-1"
                  disabled={!selectedTipologia || selectedCompagnie.length === 0 || selectedGaranzie.length === 0}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Salva Confronto
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleExportPDF}
                  className="flex-1"
                  disabled={isExportingPDF || !risultati || !selectedTipologiaData}
                >
                  {isExportingPDF ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generando PDF...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Esporta PDF
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Componente Dialog per salvare */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Salva Confronto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Nome del confronto"
              value={saveForm.nome}
              onChange={(e) => setSaveForm({...saveForm, nome: e.target.value})}
            />
            <Textarea
              placeholder="Descrizione (opzionale)"
              value={saveForm.descrizione}
              onChange={(e) => setSaveForm({...saveForm, descrizione: e.target.value})}
            />
            <Button onClick={handleSaveConfronto} className="w-full">Salva</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
