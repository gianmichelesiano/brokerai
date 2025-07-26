"use client"

import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { ArrowLeft, Building, FileText, Tag, Calendar, CheckCircle, XCircle, AlertCircle, RefreshCw, ChevronDown, ChevronRight, Shield, Loader2, Search, X, Brain, Eye, Edit, Save, XCircle as Cancel, Clock, TrendingUp } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useUsageLimits } from "@/hooks/use-usage-limits"
import { LimitReachedActions } from "@/components/billing/limit-reached-actions"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"

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

const API_BASE_URL = `${process.env.NEXT_PUBLIC_BASE_URL}/api/compagnia-tipologia`
const GARANZIE_API_URL = `${process.env.NEXT_PUBLIC_BASE_URL}/api/garanzie`
const COMPAGNIE_API_URL = `${process.env.NEXT_PUBLIC_BASE_URL}/api/compagnie`

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
  const [analyzingAllGaranzie, setAnalyzingAllGaranzie] = useState<Set<number>>(new Set())
  const [batchProgress, setBatchProgress] = useState<Map<number, {completed: number, total: number, errors: number, startTime: number}>>(new Map())
  const [showLimitActions, setShowLimitActions] = useState<{
    show: boolean;
    limitType?: 'analyses' | 'ai_analyses' | 'exports' | 'companies';
    currentUsage?: number;
    limit?: number;
  }>({ show: false })
  
  const { toast } = useToast()
  const { checkLimitWithNotification, incrementUsage, usage, limits, plan_type } = useUsageLimits()
  const router = useRouter()
  const params = useParams()
  const compagniaId = params.id as string

  // Load data
  const loadData = async () => {
    try {
      setIsLoading(true)
      console.log(`🔍 Loading data for compagnia ${compagniaId}...`)
      const responseData = await apiGet<CompagniaAnalisiData>(`${API_BASE_URL}/compagnia/${compagniaId}/tipologie`)
      console.log(`✅ Loaded data for compagnia ${compagniaId}:`, responseData)
      setData(responseData)
    } catch (error) {
      console.error(`❌ Error loading data for compagnia ${compagniaId}:`, error)
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
      console.log(`🔍 Loading garanzie for tipologia ${tipologiaId}...`)
      const garanzieData: GaranzieByTipologia = await apiGet<GaranzieByTipologia>(`${GARANZIE_API_URL}/by-tipologia/${tipologiaId}?size=100`)
      console.log(`✅ Loaded ${garanzieData?.garanzie?.items?.length || 0} garanzie for tipologia ${tipologiaId}`)
      return garanzieData
    } catch (error) {
      console.error(`❌ Errore nel caricamento garanzie per tipologia ${tipologiaId}:`, error)
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
      const result = await apiGet<{ exists: boolean }>(`${COMPAGNIE_API_URL}/${compagniaId}/analisi/${garanziaId}/exists`)
      return result.exists
    } catch (error) {
      console.error(`Errore nel controllo analisi esistente per garanzia ${garanziaId}:`, error)
      return false
    }
  }

  // Load existing analysis for a garanzia
  const handleViewExistingAnalysis = async (garanziaId: number) => {
    try {
      const result = await apiGet<AnalisiResult>(`${COMPAGNIE_API_URL}/${compagniaId}/analisi/${garanziaId}`)
      
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
      
      await apiPut(`${COMPAGNIE_API_URL}/${analisiResult.compagnia_id}/analisi/${analisiResult.garanzia_id}`, {
        ai_testo_estratto: editedAiText
      })
      
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

  // Handle analyze all garanzie for a tipologia
  const handleAnalyzeAllGaranzie = async (tipologiaId: number) => {
    if (!data) return
    
    const tipologia = data.tipologie.find(t => t.tipologia_id === tipologiaId)
    if (!tipologia?.garanzie?.garanzie.items) {
      toast({
        title: "Errore",
        description: "Nessuna garanzia disponibile per l'analisi",
        variant: "destructive"
      })
      return
    }

    const garanzieToAnalyze = tipologia.garanzie.garanzie.items.filter(
      garanzia => !existingAnalyses.get(garanzia.id)
    )

    if (garanzieToAnalyze.length === 0) {
      toast({
        title: "Info",
        description: "Tutte le garanzie sono già state analizzate",
        variant: "default"
      })
      return
    }

    try {
      setAnalyzingAllGaranzie(prev => new Set(prev).add(tipologiaId))
      
      // Initialize progress tracking
      const initialProgress = {
        completed: 0,
        total: garanzieToAnalyze.length,
        errors: 0,
        startTime: Date.now()
      }
      console.log(`📊 Initializing progress tracking for tipologia ${tipologiaId}:`, initialProgress)
      setBatchProgress(prev => new Map(prev).set(tipologiaId, initialProgress))
      
      // Check billing limits before starting bulk analysis
      const canAnalyze = await checkLimitWithNotification('analysis', `analisi di ${garanzieToAnalyze.length} garanzie`);
      if (!canAnalyze) {
        setAnalyzingAllGaranzie(prev => {
          const newSet = new Set(prev)
          newSet.delete(tipologiaId)
          return newSet
        })
        setBatchProgress(prev => {
          const newMap = new Map(prev)
          newMap.delete(tipologiaId)
          return newMap
        })
        return;
      }

      // Process garanzie in parallel with controlled concurrency
      const processGaranzia = async (garanzia: Garanzia) => {
        const requestStart = Date.now()
        console.log(`📡 Starting analysis for garanzia ${garanzia.id} (${garanzia.titolo})`)
        try {
          // Use apiPost instead of raw fetch to ensure proper auth headers
          const responseData = await apiPost(`${COMPAGNIE_API_URL}/analizza-polizza`, {
            compagnia_id: parseInt(compagniaId),
            garanzia_id: garanzia.id
          })
          
          console.log(`✅ API Response for garanzia ${garanzia.id}:`, responseData)
          
          // Update existing analyses state
          setExistingAnalyses(prev => new Map(prev).set(garanzia.id, true))
          
          // Increment usage for each successful analysis
          try {
            await incrementUsage('analyses')
          } catch (error) {
            console.error('Errore nell\'incremento utilizzo:', error)
          }
          
          // Update progress - success (force re-render with new object)
          setBatchProgress(prev => {
            const current = prev.get(tipologiaId)
            if (current) {
              const updated = {
                ...current,
                completed: current.completed + 1
              }
              console.log(`📊 Progress updated for tipologia ${tipologiaId}: ${updated.completed}/${updated.total}`)
              // Create completely new Map to trigger React re-render
              const newMap = new Map()
              for (let [key, value] of prev) {
                if (key === tipologiaId) {
                  newMap.set(key, updated)
                } else {
                  newMap.set(key, value)
                }
              }
              return newMap
            } else {
              console.warn(`⚠️ No progress tracker found for tipologia ${tipologiaId}`)
              return prev
            }
          })
          
          const requestEnd = Date.now()
          console.log(`✅ Completed analysis for garanzia ${garanzia.id} in ${(requestEnd - requestStart) / 1000}s`)
          return { success: true, garanziaId: garanzia.id, data: responseData }
        } catch (error) {
          console.error(`❌ Error in analysis for garanzia ${garanzia.id}:`, error)
          
          // Update progress - error (force re-render with new object)
          setBatchProgress(prev => {
            const current = prev.get(tipologiaId)
            if (current) {
              const updated = {
                ...current,
                completed: current.completed + 1,
                errors: current.errors + 1
              }
              console.log(`📊 Progress updated (error) for tipologia ${tipologiaId}: ${updated.completed}/${updated.total}, errors: ${updated.errors}`)
              // Create completely new Map to trigger React re-render
              const newMap = new Map()
              for (let [key, value] of prev) {
                if (key === tipologiaId) {
                  newMap.set(key, updated)
                } else {
                  newMap.set(key, value)
                }
              }
              return newMap
            }
            return prev
          })
          
          const requestEnd = Date.now()
          console.log(`❌ Failed analysis for garanzia ${garanzia.id} in ${(requestEnd - requestStart) / 1000}s`)
          return { success: false, garanziaId: garanzia.id}
        }
      }

      // Process all garanzie in parallel (truly parallel execution)
      console.log(`🚀 Starting parallel analysis of ${garanzieToAnalyze.length} garanzie for tipologia ${tipologiaId}`)
      const startTime = Date.now()
      const results = await Promise.all(garanzieToAnalyze.map(processGaranzia))
      const endTime = Date.now()
      console.log(`✅ Parallel analysis completed in ${(endTime - startTime) / 1000}s for tipologia ${tipologiaId}`)
      
      // Count results
      const successCount = results.filter(r => r.success).length
      const errorCount = results.filter(r => !r.success).length

      // Show results
      if (successCount > 0) {
        toast({
          title: "Analisi completata",
          description: `${successCount} garanzie analizzate con successo${errorCount > 0 ? `, ${errorCount} errori` : ''}`,
          variant: "default"
        })
      } else {
        toast({
          title: "Errore",
          description: "Nessuna garanzia è stata analizzata con successo",
          variant: "destructive"
        })
      }

    } catch (error) {
      console.error("Errore nell'analisi bulk:", error)
      toast({
        title: "Errore",
        description: "Errore durante l'analisi delle garanzie",
        variant: "destructive"
      })
    } finally {
      setAnalyzingAllGaranzie(prev => {
        const newSet = new Set(prev)
        newSet.delete(tipologiaId)
        return newSet
      })
      // Clean up progress after a delay to show final state
      setTimeout(() => {
        setBatchProgress(prev => {
          const newMap = new Map(prev)
          newMap.delete(tipologiaId)
          return newMap
        })
      }, 3000)
    }
  }

  // Handle analyze garanzia with billing limits
  const handleAnalyzeGaranzia = async (garanziaId: number) => {
    try {
      setAnalyzingGaranzie(prev => new Set(prev).add(garanziaId))
      
      // 1. Controlla limiti PRIMA dell'azione
      const canAnalyze = await checkLimitWithNotification('analysis', 'analisi polizza');
      if (!canAnalyze) {
        setAnalyzingGaranzie(prev => {
          const newSet = new Set(prev)
          newSet.delete(garanziaId)
          return newSet
        })
        return;
      }
      
      // 2. Esegui l'analisi
      const result = await apiPost<AnalisiResult>(`${COMPAGNIE_API_URL}/analizza-polizza`, {
        compagnia_id: parseInt(compagniaId),
        garanzia_id: garanziaId
      })
      
      // 3. Incrementa utilizzo (con gestione automatica dei limiti)
      try {
        await incrementUsage('analyses');
        
        // Controlla se abbiamo raggiunto il limite DOPO l'incremento
        const newUsage = usage.analyses_used + 1;
        if (newUsage >= limits.monthly_analyses && plan_type === 'free') {
          // Mostra le azioni disponibili per l'utente
          setShowLimitActions({
            show: true,
            limitType: 'analyses',
            currentUsage: newUsage,
            limit: limits.monthly_analyses
          });
        }
      } catch (error) {
        // Se l'errore è dovuto al limite raggiunto, mostra le azioni
        if (error instanceof Error && error.message.includes('limit reached')) {
          setShowLimitActions({
            show: true,
            limitType: 'analyses',
            currentUsage: usage.analyses_used,
            limit: limits.monthly_analyses
          });
        }
      }
      
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
              Panoramica dei rami di assicurazione e relative polizze per questa compagnia
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Aggiorna
            </Button>

          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Rami di assicurazione Totali
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
          <CardTitle>Rami di Assicurazione</CardTitle>
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
                Questa compagnia non ha ancora rami di assicurazione associate
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
                              <div className="flex items-center justify-between">
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
                                
                                {/* Analizza tutto button with progress */}
                                <div className="flex flex-col gap-2">
                                  <div className="flex items-center gap-2">
                                    <Button
                                      size="sm"
                                      variant="default"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleAnalyzeAllGaranzie(tipologia.tipologia_id)
                                      }}
                                      disabled={analyzingAllGaranzie.has(tipologia.tipologia_id)}
                                      className="h-8 px-3 text-xs"
                                    >
                                      {analyzingAllGaranzie.has(tipologia.tipologia_id) ? (
                                        <>
                                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                          Analizzando...
                                        </>
                                      ) : (
                                        <>
                                          <Search className="mr-1 h-3 w-3" />
                                          Analizza tutto
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                  
                                  {/* Progress indicator */}
                                  {batchProgress.has(tipologia.tipologia_id) && (
                                    <div className="w-full max-w-xs">
                                      {(() => {
                                        const progress = batchProgress.get(tipologia.tipologia_id)!
                                        const percentage = (progress.completed / progress.total) * 100
                                        const elapsed = Date.now() - progress.startTime
                                        const avgTimePerItem = progress.completed > 0 ? elapsed / progress.completed : 0
                                        const estimatedRemaining = avgTimePerItem * (progress.total - progress.completed)
                                        const eta = estimatedRemaining > 0 ? Math.ceil(estimatedRemaining / 1000) : 0
                                        
                                        return (
                                          <div className="space-y-1">
                                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                              <div className="flex items-center gap-1">
                                                <TrendingUp className="h-3 w-3" />
                                                <span>{progress.completed}/{progress.total} completate</span>
                                                {progress.errors > 0 && (
                                                  <span className="text-red-600">({progress.errors} errori)</span>
                                                )}
                                              </div>
                                              {eta > 0 && analyzingAllGaranzie.has(tipologia.tipologia_id) && (
                                                <div className="flex items-center gap-1">
                                                  <Clock className="h-3 w-3" />
                                                  <span>~{eta}s</span>
                                                </div>
                                              )}
                                            </div>
                                            <Progress 
                                              value={percentage} 
                                              className="h-2 bg-muted" 
                                            />
                                            <div className="text-xs text-muted-foreground">
                                              {Math.round(percentage)}% completato
                                            </div>
                                          </div>
                                        )
                                      })()}
                                    </div>
                                  )}
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
                                    const sezione = garanzia.sezione || 'Sezione non specificata'
                                    if (!acc[sezione]) {
                                      acc[sezione] = []
                                    }
                                    acc[sezione].push(garanzia)
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

      {/* Limit Reached Actions */}
      {showLimitActions.show && showLimitActions.limitType && (
        <LimitReachedActions
          limitType={showLimitActions.limitType}
          currentUsage={showLimitActions.currentUsage || 0}
          limit={showLimitActions.limit || 0}
          planType={plan_type}
          onDismiss={() => setShowLimitActions({ show: false })}
        />
      )}

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
