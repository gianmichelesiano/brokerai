"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building, FileText, BarChart3, Calendar, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CompagniaStats {
  total_compagnie: number
  compagnie_con_file: number
  compagnie_senza_file: number
  compagnie_con_testo: number
  compagnie_senza_testo: number
  file_types: Record<string, number>
  total_file_size: number
  average_text_length: number | null
  ultima_creazione: string | null
  ultima_modifica: string | null
  ultima_analisi: string | null
}

interface CompagnieStatsProps {
  refreshTrigger?: number
}

const API_BASE_URL = `${process.env.NEXT_PUBLIC_BASE_URL}/api/compagnie`

export function CompagnieStats({ refreshTrigger }: CompagnieStatsProps) {
  const [stats, setStats] = useState<CompagniaStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  // Load stats
  const loadStats = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`${API_BASE_URL}/stats`)
      
      if (!response.ok) {
        throw new Error("Errore nel caricamento delle statistiche")
      }
      
      const data = await response.json()
      setStats(data)
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile caricare le statistiche",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Load stats on mount and when refresh trigger changes
  useEffect(() => {
    loadStats()
  }, [refreshTrigger])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">Impossibile caricare le statistiche</p>
        </CardContent>
      </Card>
    )
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getFileTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      pdf: "bg-red-100 text-red-700",
      docx: "bg-blue-100 text-blue-700",
      doc: "bg-blue-100 text-blue-700",
      txt: "bg-gray-100 text-gray-700",
      unknown: "bg-gray-100 text-gray-700"
    }
    return colors[type.toLowerCase()] || colors.unknown
  }

  return (
    <div className="space-y-6">
      {/* Statistiche Principali */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building className="h-4 w-4" />
              Compagnie Totali
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_compagnie}</div>
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
            <div className="text-2xl font-bold text-green-600">{stats.compagnie_con_file}</div>
            <div className="text-xs text-muted-foreground">
              {stats.total_compagnie > 0 
                ? `${((stats.compagnie_con_file / stats.total_compagnie) * 100).toFixed(1)}%`
                : "0%"
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Con Testo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.compagnie_con_testo}</div>
            <div className="text-xs text-muted-foreground">
              {stats.total_compagnie > 0 
                ? `${((stats.compagnie_con_testo / stats.total_compagnie) * 100).toFixed(1)}%`
                : "0%"
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Dimensione Totale</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatFileSize(stats.total_file_size)}</div>
            {stats.average_text_length && (
              <div className="text-xs text-muted-foreground">
                Media: {Math.round(stats.average_text_length).toLocaleString()} caratteri
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dettagli Aggiuntivi */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tipi di File */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tipi di File</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(stats.file_types).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(stats.file_types)
                  .sort(([,a], [,b]) => b - a)
                  .map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <Badge className={getFileTypeColor(type)}>
                        {type.toUpperCase()}
                      </Badge>
                      <span className="font-medium">{count} file</span>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                Nessun file caricato
              </p>
            )}
          </CardContent>
        </Card>

        {/* Date Importanti */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Date Importanti
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Ultima Creazione</div>
              <div className="font-medium">
                {stats.ultima_creazione 
                  ? new Date(stats.ultima_creazione).toLocaleString()
                  : "Nessuna compagnia"
                }
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Ultima Modifica</div>
              <div className="font-medium">
                {stats.ultima_modifica 
                  ? new Date(stats.ultima_modifica).toLocaleString()
                  : "Nessuna modifica"
                }
              </div>
            </div>
            {stats.ultima_analisi && (
              <div>
                <div className="text-sm text-muted-foreground">Ultima Analisi</div>
                <div className="font-medium">
                  {new Date(stats.ultima_analisi).toLocaleString()}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
