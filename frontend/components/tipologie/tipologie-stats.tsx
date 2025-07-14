import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tag, FileText, Calendar, TrendingUp } from "lucide-react"

interface TipologiaStats {
  total_tipologie: number
  tipologie_con_descrizione: number
  tipologie_senza_descrizione: number
  ultima_creazione: string | null
  ultima_modifica: string | null
  nomi_piu_lunghi: Array<{ nome: string; lunghezza: number }>
}

interface TipologieStatsProps {
  stats: TipologiaStats
}

export function TipologieStats({ stats }: TipologieStatsProps) {
  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Nessuna"
    return new Date(dateString).toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  // Calculate percentage
  const getPercentage = (value: number, total: number) => {
    if (total === 0) return "0%"
    return `${Math.round((value / total) * 100)}%`
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Totale Tipologie</CardTitle>
          <Tag className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total_tipologie}</div>
          <p className="text-xs text-muted-foreground">
            Tipologie registrate nel sistema
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Con Descrizione</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.tipologie_con_descrizione}</div>
          <p className="text-xs text-muted-foreground">
            {getPercentage(stats.tipologie_con_descrizione, stats.total_tipologie)} del totale
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ultima Creazione</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-sm font-medium">
            {formatDate(stats.ultima_creazione)}
          </div>
          <p className="text-xs text-muted-foreground">
            Data di creazione più recente
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ultima Modifica</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-sm font-medium">
            {formatDate(stats.ultima_modifica)}
          </div>
          <p className="text-xs text-muted-foreground">
            Data di modifica più recente
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
