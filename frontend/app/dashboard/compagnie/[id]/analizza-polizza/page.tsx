"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { ArrowLeft, Building, FileText, Tag, Calendar, CheckCircle, XCircle, AlertCircle, RefreshCw, ChevronDown, ChevronRight, Shield, Loader2, Search, X, Brain, Eye, Edit, Save, XCircle as Cancel } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

interface Garanzia {
  id: number
  sezione: string
  titolo: string
  descrizione: string
  tipologia: number | null
  created_at: string
  updated_at: string
  hasExistingAnalysis?: boolean
}

interface GaranzieByTipologia {
  tipologia: {
    id: number
    nome: string
    descrizione: string | null
  }
  garanzie: {
    items: Garanzia[]
    total: number
    page: number
    size: number
    pages: number
  }
}

interface CompagniaTipologia {
  relazione_id: number
  tipologia_id: number
  tipologia_nome: string
  tipologia_descrizione: string | null
  polizza_filename: string | null
  polizza_path: string | null
  has_text: boolean
  attiva: boolean
  created_at: string
  updated_at: string
  garanzie?: GaranzieByTipologia
  isLoadingGaranzie?: boolean
  isExpanded?: boolean
}

interface AnalisiResult {
  compagnia_id: number
  compagnia_nome: string
  garanzia_id: number
  garanzia_sezione: string
  garanzia_titolo: string
  garanzia_descrizione: string
  polizza_text: string | null
  polizza_filename: string | null
  ai_titolo: string | null
  ai_testo_estratto: string | null
  ai_riferimenti_articoli: string | null
  ai_processed: boolean
  ai_available: boolean
}

interface CompagniaAnalisiData {
  compagnia_id: number
  compagnia_nome: string
  tipologie: CompagniaTipologia[]
  total_tipologie: number
}

const API_BASE_URL = "http://localhost:8000/api/compagnia-tipologia"
const GARANZIE_API_URL = "http://localhost:8000/api/garanzie"
const COMPAGNIE_API_URL = "http://localhost:8000/api/compagnie"

export default function AnalizzaPolizzaPage() {
  const [data, setData] = useState<CompagniaAnalisiData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [analyzingGaranzie, setAnalyzingGaranzie] = useState<Set<number>>(new Set())
  const [analisiResult, setAnalisiResult] = useState<AnalisiResult | null>(null)
  const [isResultDialogOpen, setIsResultDialogOpen] = useState(false)
  const [existingAnalyses, setExistingAnalyses] = useState<Map<number, boolean>>(new Map())
  const [editedAiText, setEditedAiText] = useState<string>("")
  const [isEditingAiText, setIsEditingAiText] = useState(false)
  const [isSavingAiText, setIsSavingAiText] = useState(false)
  const [isCheckingAnalyses, setIsCheckingAnalyses] = useState<Set<number>>(new Set())
  
  const { toast } = useToast()
  const router = useRouter()
  const params = useParams()
  const compagniaId = params.id as string

  // Load data
  const loadData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`${API_BASE_URL}/compagnia/${compagniaId}/tipologie`)
      
      if (!response.ok) {
        throw new Error("Errore nel caricamento dei dati")
      }
      
      const responseData = await response.json()
      setData(responseData)
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile caricare i dati della compagnia",
        variant: "destructive"
      })
      setData(null)
    } finally {
      setIsLoading(false)
    }
  }

  // Load data on mount and refresh
  useEffect(() => {
    if (compagniaId) {
      loadData()
    }
  }, [compagniaId, refreshTrigger])

  // Handle refresh
  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  // Handle back navigation
  const handleBack = () => {
    router.push("/dashboard/compagnie")
  }

  // Load garanzie for a specific tipologia
  const loadGaranzie = async (tipologiaId: number) => {
    try {
      const response = await fetch(`${GARANZIE_API_URL}/by-tipologia/${tipologiaId}?size=100`)
      
      if (!response.ok) {
        throw new Error("Errore nel caricamento delle garanzie")
      }
      
      const garanzieData: GaranzieByTipologia = await response.json()
      return garanzieData
    } catch (error) {
      console.error(`Errore nel caricamento garanzie per tipologia ${tipologiaId}:`, error)
      toast({
        title: "Errore",
        description: `Impossibile caricare le garanzie per la tipologia ${tipologiaId}`,
        variant: "destructive"
      })
      return null
    }
  }

  // Handle tipologia expansion
  const handleToggleExpansion = async (tipologiaId: number) => {
    if (!data) return

    setData(prevData => {
      if (!prevData) return prevData

      return {
        ...prevData,
        tipologie: prevData.tipologie.map(tipologia => {
          if (tipologia.tipologia_id === tipologiaId) {
            const isCurrentlyExpanded = tipologia.isExpanded || false
            
            if (!isCurrentlyExpanded && !tipologia.garanzie) {
              // Start loading garanzie
              return {
                ...tipologia,
                isExpanded: true,
                isLoadingGaranzie: true
              }
            } else {
              // Just toggle expansion
              return {
                ...tipologia,
                isExpanded: !isCurrentlyExpanded
              }
            }
          }
          return tipologia
        })
      }
    })

    // Load garanzie if not already loaded
    const tipologia = data.tipologie.find(t => t.tipologia_id === tipologiaId)
    if (tipologia && !tipologia.garanzie && !(tipologia.isExpanded)) {
      const garanzieData = await loadGaranzie(tipologiaId)
      
      setData(prevData => {
        if (!prevData) return prevData

        return {
          ...prevData,
          tipologie: prevData.tipologie.map(t => {
            if (t.tipologia_id === tipologiaId) {
              return {
                ...t,
                garanzie: garanzieData || undefined,
                isLoadingGaranzie: false
              }
            }
            return t
          })
        }
      })
      
      // Check existing analyses for loaded garanzie
      if (garanzieData?.garanzie.items) {
        await checkExistingAnalyses(garanzieData.garanzie.items)
      }
    }
  }

  // Check if analysis exists for a garanzia
  const checkExistingAnalysis = async (garanziaId: number): Promise<boolean> => {
    try {
      const response = await fetch(`${COMPAGNIE_API_URL}/${compagniaId}/analisi/${garanziaId}/exists`)
      
      if (response.ok) {
        const result = await response.json()
        return result.exists
      }
      return false
    } catch (error) {
      console.error(`Errore nel controllo analisi esistente per garanzia ${garanziaId}:`, error)
      return false
    }
  }

  // Load existing analysis for a garanzia
  const handleViewExistingAnalysis = async (garanziaId: number) => {
    try {
      const response = await fetch(`${COMPAGNIE_API_URL}/${compagniaId}/analisi/${garanziaId}`)
      
      if (!response.ok) {
        throw new Error("Errore nel caricamento dell'analisi esistente")
      }
      
      const result = await response.json()
      
      // Show results in dialog
      setAnalisiResult(result)
      setEditedAiText(result.ai_testo_estratto || "")
      setIsEditingAiText(false)
      setIsResultDialogOpen(true)
      
      // Update existing analyses state
      setExistingAnalyses(prev => new Map(prev).set(garanziaId, true))
      
    } catch (error) {
      console.error("Errore nel caricamento analisi esistente:", error)
      toast({
        title: "Errore",
        description: "Errore durante il caricamento dell'analisi esistente",
        variant: "destructive"
      })
    }
  }

  // Handle editing AI text
  const handleEditAiText = () => {
    setIsEditingAiText(true)
  }

  // Handle cancel editing AI text
  const handleCancelEditAiText = () => {
    setEditedAiText(analisiResult?.ai_testo_estratto || "")
    setIsEditingAiText(false)
  }

  // Handle save AI text
  const handleSaveAiText = async () => {
    if (!analisiResult) return

    try {
      setIsSavingAiText(true)
      
      const response = await fetch(`${COMPAGNIE_API_URL}/${analisiResult.compagnia_id}/analisi/${analisiResult.garanzia_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ai_testo_estratto: editedAiText
        })
      })
      
      if (!response.ok) {
        throw new Error("Errore nell'aggiornamento del testo estratto AI")
      }
      
      const result = await response.json()
      
      // Update the analisiResult with the new text
      setAnalisiResult(prev => prev ? {
        ...prev,
        ai_testo_estratto: editedAiText
      } : null)
      
      setIsEditingAiText(false)
      
      toast({
        title: "Successo",
        description: "Testo estratto AI aggiornato con successo",
        variant: "default"
      })
      
    } catch (error) {
      console.error("Errore nel salvataggio testo estratto AI:", error)
      toast({
        title: "Errore",
        description: "Errore durante il salvataggio del testo estratto AI",
        variant: "destructive"
      })
    } finally {
      setIsSavingAiText(false)
    }
  }

  // Check existing analyses when garanzie are loaded
  const checkExistingAnalyses = async (garanzie: Garanzia[]) => {
    const newExistingAnalyses = new Map(existingAnalyses)
    const garanzieToCheck = garanzie.filter(garanzia => !newExistingAnalyses.has(garanzia.id))
    
    if (garanzieToCheck.length === 0) {
      return // No new garanzie to check
    }
    
    // Add all garanzie IDs to the checking set to show loading state
    setIsCheckingAnalyses(prev => {
      const newSet = new Set(prev)
      garanzieToCheck.forEach(garanzia => newSet.add(garanzia.id))
      return newSet
    })
    
    try {
      // Wait for all API calls to complete
      const analysisPromises = garanzieToCheck.map(async (garanzia) => {
        const hasAnalysis = await checkExistingAnalysis(garanzia.id)
        return { id: garanzia.id, hasAnalysis }
      })
      
      const results = await Promise.all(analysisPromises)
      
      // Update all results at once after all queries complete
      results.forEach(({ id, hasAnalysis }) => {
        newExistingAnalyses.set(id, hasAnalysis)
      })
      
      setExistingAnalyses(newExistingAnalyses)
    } catch (error) {
      console.error('Errore nel controllo delle analisi esistenti:', error)
      toast({
        title: "Errore",
        description: "Errore durante il controllo delle analisi esistenti",
        variant: "destructive"
      })
    } finally {
      // Remove all garanzie IDs from the checking set
      setIsCheckingAnalyses(prev => {
        const newSet = new Set(prev)
        garanzieToCheck.forEach(garanzia => newSet.delete(garanzia.id))
        return newSet
      })
    }
  }

  // Handle analyze garanzia
  const handleAnalyzeGaranzia = async (garanziaId: number) => {
    try {
      setAnalyzingGaranzie(prev => new Set(prev).add(garanziaId))
      
      const response = await fetch(`${COMPAGNIE_API_URL}/analizza-polizza`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          compagnia_id: parseInt(compagniaId),
          garanzia_id: garanziaId
        })
      })
      
      if (!response.ok) {
        throw new Error("Errore nell'analisi della polizza")
      }
      
      const result = await response.json()
      
      toast({
        title: "Analisi completata",
        description: `Analisi della garanzia ${result.garanzia_titolo} completata con successo`,
        variant: "default"
      })
      
      // Show results in dialog
      setAnalisiResult(result)
      setEditedAiText(result.ai_testo_estratto || "")
      setIsEditingAiText(false)
      setIsResultDialogOpen(true)
      
      // Update existing analyses state
      setExistingAnalyses(prev => new Map(prev).set(garanziaId, true))
      
    } catch (error) {
      console.error("Errore nell'analisi:", error)
      toast({
        title: "Errore",
        description: "Errore durante l'analisi della polizza",
        variant: "destructive"
      })
    } finally {
      setAnalyzingGaranzie(prev => {
        const newSet = new Set(prev)
        newSet.delete(garanziaId)
        return newSet
      })
    }
  }

  // Get status badge for tipologia
  const getStatusBadge = (tipologia: CompagniaTipologia) => {
    if (!tipologia.attiva) {
      return <Badge variant="secondary">Inattiva</Badge>
    }
    if (!tipologia.polizza_filename) {
      return <Badge variant="outline">Nessun file</Badge>
    }
    if (!tipologia.has_text) {
      return <Badge className="bg-yellow-100 text-yellow-700">File senza testo</Badge>
    }
    return <Badge variant="default" className="bg-green-100 text-green-700">Completa</Badge>
  }

  // Get section badge with special styling for important sections
  const getSectionBadge = (sezione: string) => {
    const sectionUpper = sezione.toUpperCase()
    
    // Check if this is one of the important sections
    const isImportantSection = sectionUpper.includes('INFORTUNI') || 
                              sectionUpper.includes('TUTELA LEGAL') || 
                              sectionUpper.includes('ALTRI DANNI AI BENI')
    
    if (isImportantSection) {
      return (
        <Badge className="font-medium bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200">
          ⭐ {sezione}
        </Badge>
      )
    }
    
    // Default styling for other sections
    return (
      <Badge variant="outline" className="font-medium">
        {sezione}
      </Badge>
    )
  }

  // Calculate stats
  const stats = data ? {
    totalTipologie: data.total_tipologie,
    conFile: data.tipologie.filter(t => t.polizza_filename).length,
    conTesto: data.tipologie.filter(t => t.has_text).length,
    attive: data.tipologie.filter(t => t.attiva).length
  } : null

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" disabled>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Indietro
          </Button>
          <div className="space-y-2">
            <div className="h-8 w-64 bg-muted animate-pulse rounded" />
            <div className="h-4 w-96 bg-muted animate-pulse rounded" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <Card>
          <CardHeader>
            <div className="h-6 w-48 bg-muted animate-pulse rounded" />
            <div className="h-4 w-64 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Indietro
          </Button>
        </div>
        
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            Errore nel caricamento
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Impossibile caricare i dati della compagnia
          </p>
          <Button onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Riprova
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Breadcrumb */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Indietro
          </Button>
          
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard/compagnie">Compagnie</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Analisi Polizze - {data.compagnia_nome}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 font-display flex items-center gap-3">
              <Building className="h-8 w-8 text-blue-600" />
              Analisi Polizze - {data.compagnia_nome}
            </h1>
            <p className="text-slate-600 mt-1">
              Panoramica delle tipologie di assicurazione e relative polizze per questa compagnia
            </p>
          </div>
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Aggiorna
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Tipologie Totali
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTipologie}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Con File
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.conFile}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalTipologie > 0 ? Math.round((stats.conFile / stats.totalTipologie) * 100) : 0}% del totale
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Con Testo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.conTesto}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalTipologie > 0 ? Math.round((stats.conTesto / stats.totalTipologie) * 100) : 0}% del totale
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Attive
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.attive}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalTipologie > 0 ? Math.round((stats.attive / stats.totalTipologie) * 100) : 0}% del totale
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tipologie Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tipologie di Assicurazione</CardTitle>
          <CardDescription>
            Lista delle tipologie associate alla compagnia {data.compagnia_nome}
            {data.total_tipologie > 0 && (
              <span className="ml-2 text-sm">
                ({data.total_tipologie} tipologie trovate)
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.tipologie.length === 0 ? (
            <div className="text-center py-12">
              <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                Nessuna tipologia trovata
              </h3>
              <p className="text-sm text-muted-foreground">
                Questa compagnia non ha ancora tipologie di assicurazione associate
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.tipologie.map((tipologia) => (
                <div key={tipologia.relazione_id} className="border rounded-lg">
                  {/* Tipologia Header */}
                  <div 
                    className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleToggleExpansion(tipologia.tipologia_id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm" className="p-0 h-auto">
                          {tipologia.isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                        <Tag className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <h3 className="font-semibold text-lg">{tipologia.tipologia_nome}</h3>
                          {tipologia.tipologia_descrizione && (
                            <p className="text-sm text-muted-foreground">
                              {tipologia.tipologia_descrizione}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        {/* File Info */}
                        <div className="text-right">
                          {tipologia.polizza_filename ? (
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-blue-600" />
                              <div>
                                <p className="text-sm font-medium truncate max-w-[150px]">
                                  {tipologia.polizza_filename}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {tipologia.has_text ? "Testo estratto" : "Nessun testo"}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Nessun file</span>
                          )}
                        </div>
                        
                        {/* Status */}
                        <div>
                          {getStatusBadge(tipologia)}
                        </div>
                        
                        {/* Dates */}
                        <div className="text-right text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Creata: {new Date(tipologia.created_at).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <Calendar className="h-3 w-3" />
                            <span>Aggiornata: {new Date(tipologia.updated_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Garanzie Section (Expanded) */}
                  {tipologia.isExpanded && (
                    <div className="border-t bg-muted/20">
                      <div className="p-4">
                        {tipologia.isLoadingGaranzie ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin mr-2" />
                            <span className="text-muted-foreground">Caricamento garanzie...</span>
                          </div>
                        ) : tipologia.garanzie ? (
                          <div>
                            {/* Garanzie Stats */}
                            <div className="mb-4">
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Shield className="h-4 w-4" />
                                  <span>{tipologia.garanzie.garanzie.total} garanzie totali</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Tag className="h-4 w-4" />
                                  <span>
                                    {new Set(tipologia.garanzie.garanzie.items.map(g => g.sezione)).size} sezioni
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            {tipologia.garanzie.garanzie.items.length === 0 ? (
                              <div className="text-center py-8">
                                <Shield className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                <p className="text-muted-foreground">Nessuna garanzia trovata per questa tipologia</p>
                              </div>
                            ) : (
                              <div>
                                {/* Group garanzie by sezione */}
                                {Object.entries(
                                  tipologia.garanzie.garanzie.items.reduce((acc, garanzia) => {
                                    if (!acc[garanzia.sezione]) {
                                      acc[garanzia.sezione] = []
                                    }
                                    acc[garanzia.sezione].push(garanzia)
                                    return acc
                                  }, {} as Record<string, Garanzia[]>)
                                ).map(([sezione, garanzie]) => (
                                  <div key={sezione} className="mb-6">
                                    <div className="flex items-center gap-2 mb-3">
                                      {getSectionBadge(sezione)}
                                      <span className="text-sm text-muted-foreground">
                                        ({garanzie.length} garanzie)
                                      </span>
                                    </div>
                                    
                                    <div className="grid gap-3">
                                      {garanzie.map((garanzia) => (
                                        <div key={garanzia.id} className="border rounded-md p-3 bg-background">
                                          <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                              <h4 className="font-medium text-sm mb-1">{garanzia.titolo}</h4>
                                              <p className="text-xs text-muted-foreground line-clamp-2">
                                                {garanzia.descrizione}
                                              </p>
                                            </div>
                                            <div className="ml-4 flex items-center gap-2">
                                              <span className="text-xs text-muted-foreground">
                                                ID: {garanzia.id}
                                              </span>
                                              
                                              {/* Show loading state while checking analysis existence */}
                                              {isCheckingAnalyses.has(garanzia.id) ? (
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  disabled
                                                  className="h-7 px-2 text-xs"
                                                >
                                                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                                  Controllo...
                                                </Button>
                                              ) : existingAnalyses.get(garanzia.id) ? (
                                                <Button
                                                  size="sm"
                                                  variant="secondary"
                                                  onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleViewExistingAnalysis(garanzia.id)
                                                  }}
                                                  className="h-7 px-2 text-xs"
                                                >
                                                  <Eye className="mr-1 h-3 w-3" />
                                                  Visualizza Risultato
                                                </Button>
                                              ) : (
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleAnalyzeGaranzia(garanzia.id)
                                                  }}
                                                  disabled={analyzingGaranzie.has(garanzia.id)}
                                                  className="h-7 px-2 text-xs"
                                                >
                                                  {analyzingGaranzie.has(garanzia.id) ? (
                                                    <>
                                                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                                      Analizzando...
                                                    </>
                                                  ) : (
                                                    <>
                                                      <Search className="mr-1 h-3 w-3" />
                                                      Analizza
                                                    </>
                                                  )}
                                                </Button>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                            <p className="text-muted-foreground">Errore nel caricamento delle garanzie</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Dialog */}
      <Dialog open={isResultDialogOpen} onOpenChange={setIsResultDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-600" />
              Risultati Analisi AI - {analisiResult?.garanzia_titolo}
            </DialogTitle>
            <DialogDescription>
              Analisi della polizza per la compagnia {analisiResult?.compagnia_nome}
            </DialogDescription>
          </DialogHeader>
          
          {analisiResult && (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Compagnia</h4>
                  <p className="font-semibold">{analisiResult.compagnia_nome}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Sezione</h4>
                  <p className="font-semibold">{analisiResult.garanzia_sezione}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Garanzia</h4>
                  <p className="font-semibold">{analisiResult.garanzia_titolo}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">File Polizza</h4>
                  <p className="font-semibold">{analisiResult.polizza_filename || "N/A"}</p>
                </div>
              </div>

              {/* AI Status */}
              <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
                <div className="flex items-center gap-2">
                  {analisiResult.ai_available ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="text-sm font-medium">
                    AI {analisiResult.ai_available ? "Disponibile" : "Non Disponibile"}
                  </span>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {analisiResult.ai_processed ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="text-sm font-medium">
                    Elaborazione {analisiResult.ai_processed ? "Completata" : "Fallita"}
                  </span>
                </div>
              </div>

              {/* AI Results */}
              {analisiResult.ai_processed && (
                <div className="space-y-4">
                  {/* AI Title */}
                  {analisiResult.ai_titolo && (
                    <div>
                      <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">
                        <Brain className="h-4 w-4 text-blue-600" />
                        Titolo AI
                      </h4>
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="font-medium text-blue-900">{analisiResult.ai_titolo}</p>
                      </div>
                    </div>
                  )}

                  {/* AI Text Extract */}
                  {analisiResult.ai_testo_estratto && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-lg flex items-center gap-2">
                          <FileText className="h-4 w-4 text-green-600" />
                          Testo Estratto AI
                        </h4>
                        {!isEditingAiText && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleEditAiText}
                            className="h-8 px-3 text-xs"
                          >
                            <Edit className="mr-1 h-3 w-3" />
                            Modifica
                          </Button>
                        )}
                      </div>
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        {isEditingAiText ? (
                          <div className="space-y-3">
                            <Textarea
                              value={editedAiText}
                              onChange={(e) => setEditedAiText(e.target.value)}
                              className="min-h-[200px] text-sm leading-relaxed bg-white border-green-300 focus:border-green-500 focus:ring-green-500"
                              placeholder="Inserisci il testo estratto AI..."
                            />
                            <div className="flex items-center gap-2 justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancelEditAiText}
                                disabled={isSavingAiText}
                                className="h-8 px-3 text-xs"
                              >
                                <Cancel className="mr-1 h-3 w-3" />
                                Annulla
                              </Button>
                              <Button
                                size="sm"
                                onClick={handleSaveAiText}
                                disabled={isSavingAiText}
                                className="h-8 px-3 text-xs bg-green-600 hover:bg-green-700"
                              >
                                {isSavingAiText ? (
                                  <>
                                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                    Salvando...
                                  </>
                                ) : (
                                  <>
                                    <Save className="mr-1 h-3 w-3" />
                                    Salva
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm leading-relaxed whitespace-pre-wrap text-green-900">
                            {analisiResult.ai_testo_estratto}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* AI References */}
                  {analisiResult.ai_riferimenti_articoli && (
                    <div>
                      <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">
                        <Tag className="h-4 w-4 text-purple-600" />
                        Riferimenti Articoli
                      </h4>
                      <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <p className="font-medium text-purple-900">{analisiResult.ai_riferimenti_articoli}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Original Description */}
              <div>
                <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-gray-600" />
                  Descrizione Originale Garanzia
                </h4>
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-sm leading-relaxed text-gray-900">
                    {analisiResult.garanzia_descrizione}
                  </p>
                </div>
              </div>


              {/* Close Button */}
              <div className="flex justify-end pt-4">
                <Button onClick={() => setIsResultDialogOpen(false)}>
                  <X className="mr-2 h-4 w-4" />
                  Chiudi
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
