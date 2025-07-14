"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Layers, Shield, BarChart3, Calendar } from "lucide-react"

interface SezioneStats {
  total_sezioni: number
  sezioni_con_garanzie: number
  sezioni_senza_garanzie: number
  media_garanzie_per_sezione: number
  sezione_piu_popolata: string | null
  ultima_creazione: string | null
  ultima_modifica: string | null
}

interface SezioniStatsProps {
  stats: SezioneStats
}

export function SezioniStats({ stats }: SezioniStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Totale Sezioni</CardTitle>
          <Layers className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total_sezioni}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Con Garanzie</CardTitle>
          <Shield className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.sezioni_con_garanzie}</div>
          <p className="text-xs text-muted-foreground">
            {stats.total_sezioni > 0 
              ? `${Math.round((stats.sezioni_con_garanzie / stats.total_sezioni) * 100)}%`
              : "0%"
            } del totale
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Media Garanzie</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.media_garanzie_per_sezione.toFixed(1)}</div>
          <p className="text-xs text-muted-foreground">
            per sezione
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Più Popolata</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-sm font-medium">
            {stats.sezione_piu_popolata || "Nessuna"}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
