"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Search, Edit, Trash2, Layers, Calendar, FileText, Shield, BarChart3 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Sezione {
  id: number
  nome: string
  descrizione: string | null
  created_at: string
  updated_at: string
}

interface SezioneList {
  items: Sezione[]
  total: number
  page: number
  size: number
  pages: number
}

interface SezioneStats {
  total_sezioni: number
  sezioni_con_garanzie: number
  sezioni_senza_garanzie: number
  media_garanzie_per_sezione: number
  sezione_piu_popolata: string | null
  ultima_creazione: string | null
  ultima_modifica: string | null
}

const API_BASE_URL = "http://localhost:8000/api/sezioni"

export default function SezioniPage() {
  const [sezioni, setSezioni] = useState<Sezione[]>([])
  const [stats, setStats] = useState<SezioneStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingSezione, setEditingSezione] = useState<Sezione | null>(null)
  const [formData, setFormData] = useState({ nome: "", descrizione: "" })
  const { toast } = useToast()
  const router = useRouter()

  // Fetch sezioni
  const fetchSezioni = async (page = 1, search = "") => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        size: "10",
        sort_by: "nome",
        sort_order: "asc"
      })
      
      if (search) {
        params.append("search", search)
      }

      const response = await fetch(`${API_BASE_URL}/?${params}`)
      if (!response.ok) throw new Error("Errore nel caricamento delle sezioni")
      
      const data: SezioneList = await response.json()
      setSezioni(data.items)
      setTotalPages(data.pages)
      setCurrentPage(data.page)
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile caricare le sezioni",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/stats`)
      if (!response.ok) throw new Error("Errore nel caricamento delle statistiche")
      
      const data: SezioneStats = await response.json()
      setStats(data)
    } catch (error) {
      console.error("Errore nel caricamento delle statistiche:", error)
    }
  }

  // Create sezione
  const createSezione = async () => {
    try {
      const response = await fetch(API_BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Errore nella creazione")
      }
      
      toast({
        title: "Successo",
        description: "Sezione creata con successo"
      })
      
      setIsCreateDialogOpen(false)
      setFormData({ nome: "", descrizione: "" })
      fetchSezioni(currentPage, searchTerm)
      fetchStats()
    } catch (error) {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Errore nella creazione",
        variant: "destructive"
      })
    }
  }

  // Update sezione
  const updateSezione = async () => {
    if (!editingSezione) return
    
    try {
      const response = await fetch(`${API_BASE_URL}/${editingSezione.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Errore nell'aggiornamento")
      }
      
      toast({
        title: "Successo",
        description: "Sezione aggiornata con successo"
      })
      
      setIsEditDialogOpen(false)
      setEditingSezione(null)
      setFormData({ nome: "", descrizione: "" })
      fetchSezioni(currentPage, searchTerm)
      fetchStats()
    } catch (error) {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Errore nell'aggiornamento",
        variant: "destructive"
      })
    }
  }

  // Delete sezione
  const deleteSezione = async (id: number) => {
    if (!confirm("Sei sicuro di voler eliminare questa sezione?")) return
    
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: "DELETE"
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Errore nell'eliminazione")
      }
      
      toast({
        title: "Successo",
        description: "Sezione eliminata con successo"
      })
      
      fetchSezioni(currentPage, searchTerm)
      fetchStats()
    } catch (error) {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Errore nell'eliminazione della sezione",
        variant: "destructive"
      })
    }
  }

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
    fetchSezioni(1, value)
  }

  // Open edit dialog
  const openEditDialog = (sezione: Sezione) => {
    setEditingSezione(sezione)
    setFormData({
      nome: sezione.nome,
      descrizione: sezione.descrizione || ""
    })
    setIsEditDialogOpen(true)
  }

  // Navigate to garanzie for sezione
  const navigateToGaranzie = (sezioneId: number, sezioneNome: string) => {
    router.push(`/dashboard/garanzie?sezione_id=${sezioneId}&sezione_nome=${encodeURIComponent(sezioneNome)}`)
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  useEffect(() => {
    fetchSezioni()
    fetchStats()
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sezioni Garanzie</h1>
          <p className="text-muted-foreground">
            Gestisci le sezioni per organizzare le garanzie del sistema
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuova Sezione
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crea Nuova Sezione</DialogTitle>
              <DialogDescription>
                Inserisci i dettagli per la nuova sezione di garanzie
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Es. RESPONSABILITÀ CIVILE"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="descrizione">Descrizione</Label>
                <Textarea
                  id="descrizione"
                  value={formData.descrizione}
                  onChange={(e) => setFormData({ ...formData, descrizione: e.target.value })}
                  placeholder="Descrizione della sezione..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Annulla
              </Button>
              <Button onClick={createSezione} disabled={!formData.nome.trim()}>
                Crea Sezione
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      {stats && (
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
      )}

      {/* Search and Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Elenco Sezioni</CardTitle>
              <CardDescription>
                Visualizza e gestisci tutte le sezioni di garanzie
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca sezioni..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8 w-[300px]"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Caricamento...</div>
          ) : sezioni.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "Nessuna sezione trovata" : "Nessuna sezione presente"}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrizione</TableHead>
                    <TableHead>Creata il</TableHead>
                    <TableHead>Modificata il</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sezioni.map((sezione) => (
                    <TableRow key={sezione.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          <Layers className="h-4 w-4 text-muted-foreground" />
                          <span>{sezione.nome}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {sezione.descrizione ? (
                          <div className="max-w-[300px] truncate" title={sezione.descrizione}>
                            {sezione.descrizione}
                          </div>
                        ) : (
                          <Badge variant="secondary">Nessuna descrizione</Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(sezione.created_at)}</TableCell>
                      <TableCell>{formatDate(sezione.updated_at)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => navigateToGaranzie(sezione.id, sezione.nome)}
                            title={`Visualizza garanzie per ${sezione.nome}`}
                          >
                            <Shield className="h-4 w-4 mr-1" />
                            Garanzie
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(sezione)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteSezione(sezione.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newPage = currentPage - 1
                      setCurrentPage(newPage)
                      fetchSezioni(newPage, searchTerm)
                    }}
                    disabled={currentPage <= 1}
                  >
                    Precedente
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Pagina {currentPage} di {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newPage = currentPage + 1
                      setCurrentPage(newPage)
                      fetchSezioni(newPage, searchTerm)
                    }}
                    disabled={currentPage >= totalPages}
                  >
                    Successiva
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica Sezione</DialogTitle>
            <DialogDescription>
              Modifica i dettagli della sezione di garanzie
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-nome">Nome *</Label>
              <Input
                id="edit-nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Es. RESPONSABILITÀ CIVILE"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-descrizione">Descrizione</Label>
              <Textarea
                id="edit-descrizione"
                value={formData.descrizione}
                onChange={(e) => setFormData({ ...formData, descrizione: e.target.value })}
                placeholder="Descrizione della sezione..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={updateSezione} disabled={!formData.nome.trim()}>
              Salva Modifiche
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
