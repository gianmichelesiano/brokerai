"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, XCircle, Search, Zap, AlertCircle, Tag, Building2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Tipologia {
  id: number
  nome: string
  descrizione: string
}

interface Compagnia {
  id: number
  nome: string
}

interface Garanzia {
  id: number
  titolo: string
  descrizione: string
  sezione_nome: string
}

interface AnalisiResult {
  compagnia_id: number
  compagnia_nome: string
  garanzia_id: number
  garanzia_sezione: string
  garanzia_titolo: string
  garanzia_descrizione: string
  text_extract: string | null
  polizza_filename: string
  ai_titolo: string
  ai_testo_estratto: string
  ai_riferimenti_articoli: string
  ai_processed: boolean
  ai_available: boolean
}

export default function MappingPage() {
  const [tipologie, setTipologie] = useState<Tipologia[]>([])
  const [selectedTipologia, setSelectedTipologia] = useState<string>("")
  const [compagnie, setCompagnie] = useState<Compagnia[]>([])
  const [selectedCompagnie, setSelectedCompagnie] = useState<number[]>([])
  const [garanzie, setGaranzie] = useState<Garanzia[]>([])
  const [matrixData, setMatrixData] = useState<Map<string, AnalisiResult | null>>(new Map())
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)

  useEffect(() => {
    fetchTipologie()
    fetchAllCompagnie()
  }, [])

  useEffect(() => {
    if (selectedTipologia && selectedCompagnie.length > 0) {
      fetchGaranzieAndAnalisi()
    } else {
      setGaranzie([])
      setMatrixData(new Map())
    }
  }, [selectedTipologia, selectedCompagnie])

  const fetchTipologie = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/tipologia-assicurazione/?page=1&size=100&sort_by=created_at&sort_order=desc`)
      if (!response.ok) throw new Error('Errore nel caricamento delle tipologie')
      const data = await response.json()
      setTipologie(data.items || [])
    } catch (error) {
      console.error('Errore:', error)
      toast.error('Errore nel caricamento delle tipologie')
    }
  }

  const fetchAllCompagnie = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/compagnie/?page=1&size=100&sort_by=created_at&sort_order=desc`)
      if (!response.ok) throw new Error('Errore nel caricamento delle compagnie')
      const data = await response.json()
      setCompagnie(data.items || [])
    } catch (error) {
      console.error('Errore:', error)
      toast.error('Errore nel caricamento delle compagnie')
    }
  }

  const fetchGaranzieAndAnalisi = async () => {
    try {
      setLoadingData(true)
      
      // Chiamata singola ottimizzata all'endpoint matrice
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/mapping/matrix/analisi`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tipologia_id: parseInt(selectedTipologia),
          compagnia_ids: selectedCompagnie
        })
      })
      
      if (!response.ok) throw new Error('Errore nel caricamento della matrice')
      const data = await response.json()
      
      setGaranzie(data.garanzie || [])
      
      // Ordina le garanzie per sezione e poi per titolo alfabetico
      const garanzieOrdinate = [...(data.garanzie || [])].sort((a, b) => {
        // Prima ordina per sezione
        const sezioneCompare = (a.sezione_nome || '').localeCompare(b.sezione_nome || '', 'it-IT')
        if (sezioneCompare !== 0) return sezioneCompare
        // Poi ordina per titolo all'interno della stessa sezione
        return a.titolo.localeCompare(b.titolo, 'it-IT')
      })
      setGaranzie(garanzieOrdinate)
      
      // Costruisci la mappa dalle analisi ricevute
      const newMatrixData = new Map<string, AnalisiResult | null>()
      data.analisi.forEach((analisi: any) => {
        const key = `${analisi.compagnia_id}-${analisi.garanzia_id}`
        newMatrixData.set(key, analisi.found ? analisi : null)
      })
      
      setMatrixData(newMatrixData)
    } catch (error) {
      console.error('Errore:', error)
      toast.error('Errore nel caricamento dei dati')
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

  const getCellContent = (compagniaId: number, garanziaId: number) => {
    const key = `${compagniaId}-${garanziaId}`
    const analisi = matrixData.get(key)

    if (!analisi || !analisi.ai_available) {
      return (
        <div className="flex items-center justify-center">
          <XCircle className="h-4 w-4 text-rose-500" />
        </div>
      )
    }

    return (
      <div className="text-center">
        <div className="flex items-center justify-center mb-1">
          <CheckCircle className="h-4 w-4 text-emerald-500" />
        </div>
        <div className="text-xs text-slate-600">{analisi.ai_riferimenti_articoli}</div>
      </div>
    )
  }

  const startAnalysis = () => {
    setIsAnalyzing(true)
    setAnalysisProgress(0)

    const interval = setInterval(() => {
      setAnalysisProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsAnalyzing(false)
          // Ricarica i dati dopo l'analisi
          fetchGaranzieAndAnalisi()
          return 100
        }
        return prev + 10
      })
    }, 500)
  }

  const foundCount = Array.from(matrixData.values()).filter(item => item?.ai_available).length
  const totalCells = selectedCompagnie.length * garanzie.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 font-display">Analisi & Mapping</h1>
          <p className="text-slate-600 mt-1">Matrice delle coperture e analisi AI delle polizze</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={startAnalysis} 
            disabled={isAnalyzing || !selectedTipologia || selectedCompagnie.length === 0}
          >
            <Zap className="mr-2 h-4 w-4" />
            {isAnalyzing ? "Analizzando..." : "Avvia Analisi AI"}
          </Button>
        </div>
      </div>

      {/* Progress Analysis */}
      {isAnalyzing && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-slate-600" />
              Analisi AI in corso...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso analisi</span>
                <span>{analysisProgress}%</span>
              </div>
              <Progress value={analysisProgress} />
              <p className="text-sm text-slate-600">
                Analizzando le polizze con AI per identificare le coperture...
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtri */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Rami Assicurazione
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedTipologia} onValueChange={setSelectedTipologia}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona una tipologia" />
              </SelectTrigger>
              <SelectContent>
                {tipologie.map((tipologia) => (
                  <SelectItem key={tipologia.id} value={tipologia.id.toString()}>
                    {tipologia.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Compagnie
            </CardTitle>
            <CardDescription>
              Seleziona le compagnie da analizzare
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[150px] pr-4">
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
          </CardContent>
        </Card>
      </div>

      {/* Stats */}
      {selectedTipologia && selectedCompagnie.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Garanzie Analizzate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{garanzie.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Compagnie Selezionate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{selectedCompagnie.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Coperture Trovate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{foundCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Completamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalCells > 0 ? Math.round((foundCount / totalCells) * 100) : 0}%
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Matrice Coperture */}
      {selectedTipologia && selectedCompagnie.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Matrice Coperture</CardTitle>
            <CardDescription>Visualizzazione delle coperture trovate per ogni garanzia e compagnia</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingData ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
              </div>
            ) : garanzie.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nessuna garanzia trovata per la tipologia selezionata
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Garanzia</TableHead>
                      {/* <TableHead className="text-center">Sezione</TableHead> */}
                      {selectedCompagnie.map((compagniaId) => {
                        const compagnia = compagnie.find(c => c.id === compagniaId)
                        return (
                          <TableHead key={compagniaId} className="text-center min-w-[120px]">
                            {compagnia?.nome || `ID: ${compagniaId}`}
                          </TableHead>
                        )
                      })}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {garanzie.map((garanzia) => (
                      <TableRow key={garanzia.id}>
                        <TableCell className="font-medium">{garanzia.titolo}</TableCell>
                        {/* 
                        <TableCell className="text-center">
                          <Badge variant="outline" className="text-xs">
                            {garanzia.sezione_nome}
                          </Badge>
                        </TableCell>
                       */}  
                        {selectedCompagnie.map((compagniaId) => (
                          <TableCell key={compagniaId} className="text-center">
                            {getCellContent(compagniaId, garanzia.id)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

{/*   <Card>
      <CardHeader>
        <CardTitle>Legenda</CardTitle>
      </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              <span className="text-sm">Copertura trovata (con riferimento articolo)</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-rose-500" />
              <span className="text-sm">Copertura non trovata</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <span className="text-sm">Analisi in corso</span>
            </div>
          </div>
        </CardContent>
      </Card>

       */}
    </div>
  )
}
