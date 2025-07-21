"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Building2, BarChart3, TrendingUp, Clock, CheckCircle, AlertCircle, Plus, Search } from "lucide-react"
import Link from "next/link"
import { useDashboardStats } from "@/hooks/use-dashboard-stats"
import { UsageDashboard } from "@/components/billing/usage-dashboard"

export default function DashboardPage() {
  const { stats, loading, error } = useDashboardStats();

  // Helper for trends (placeholder, can be improved)
  const getTrend = (current: number, previous?: number) => {
    if (typeof previous === "number" && previous > 0) {
      const diff = current - previous;
      const sign = diff >= 0 ? "+" : "-";
      return `${sign}${Math.abs(diff)}`;
    }
    return "";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-display">Dashboard</h1>
          <p className="text-gray-600 mt-1">Panoramica del sistema di confronto garanzie assicurative</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/dashboard/confronto-polizze">
              <BarChart3 className="mr-2 h-4 w-4" />
              Nuovo Confronto
            </Link>
          </Button>
        </div>
      </div>



      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {/* Garanzie Totali */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Garanzie Totali</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : stats.garanzie?.total_garanzie ?? "—"}
            </div>
            <p className="text-xs text-muted-foreground">
              {/* Trend placeholder */}
              {loading ? "" : "+0 rispetto al mese scorso"}
            </p>
          </CardContent>
        </Card>

        {/* Compagnie Attive */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compagnie Attive</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : stats.compagnie?.total_compagnie ?? "—"}
            </div>
            <p className="text-xs text-muted-foreground">
              {loading ? "" : "+0 nuove compagnie"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-slate-700" />
              </div>
              <div>
                <CardTitle className="text-lg">Gestisci Garanzie</CardTitle>
                <CardDescription>Crea e organizza le garanzie</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Aggiungi nuove garanzie, modifica quelle esistenti e organizzale per sezioni.
            </p>
            <Button asChild className="w-full">
              <Link href="/dashboard/garanzie">
                <Plus className="mr-2 h-4 w-4" />
                Vai alle Garanzie
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Building2 className="h-5 w-5 text-emerald-700" />
              </div>
              <div>
                <CardTitle className="text-lg">Gestisci Compagnie</CardTitle>
                <CardDescription>Carica polizze e documenti</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Aggiungi compagnie assicurative e carica i loro documenti per l'analisi.
            </p>
            <Button asChild className="w-full">
              <Link href="/dashboard/compagnie">
                <Plus className="mr-2 h-4 w-4" />
                Vai alle Compagnie
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <Search className="h-5 w-5 text-slate-700" />
              </div>
              <div>
                <CardTitle className="text-lg">Analisi AI</CardTitle>
                <CardDescription>Analizza polizze automaticamente</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Utilizza l'AI per analizzare le polizze e mappare le coperture.
            </p>
            <Button asChild className="w-full">
              <Link href="/dashboard/mapping">
                <Search className="mr-2 h-4 w-4" />
                Inizia Analisi
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Attività Recenti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Analisi completata per AIG</p>
                  <p className="text-xs text-gray-500">2 ore fa</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Completato
                </Badge>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Nuova garanzia "Invalidità Permanente" aggiunta</p>
                  <p className="text-xs text-gray-500">4 ore fa</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  <Plus className="w-3 h-3 mr-1" />
                  Nuovo
                </Badge>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Confronto salvato: "Infortuni 2024"</p>
                  <p className="text-xs text-gray-500">1 giorno fa</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  <BarChart3 className="w-3 h-3 mr-1" />
                  Confronto
                </Badge>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Errore nell'analisi di NOBIS</p>
                  <p className="text-xs text-gray-500">2 giorni fa</p>
                </div>
                <Badge variant="destructive" className="text-xs">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Errore
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Statistiche Analisi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Coperture Trovate</span>
                  <span>87%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: "87%" }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Analisi Completate</span>
                  <span>94%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-slate-600 h-2 rounded-full" style={{ width: "94%" }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Confidence Media AI</span>
                  <span>92%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-slate-500 h-2 rounded-full" style={{ width: "92%" }}></div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-emerald-600">43</div>
                    <div className="text-xs text-gray-500">Analisi Totali</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-700">
                      {loading ? "..." : stats.compagnie?.total_compagnie ?? "—"}
                    </div>
                    <div className="text-xs text-gray-500">Compagnie Attive</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Dashboard */}
      <UsageDashboard />
      
    </div>
  )
}
