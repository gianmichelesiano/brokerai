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
import { Plus, Search, Edit, Trash2, Tag, Calendar, FileText, Shield, Wand2, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface TipologiaAssicurazione {
  id: number
  nome: string
  descrizione: string | null
  created_at: string
  updated_at: string
  garanzie_count?: number
}

interface TipologiaAssicurazioneList {
  items: TipologiaAssicurazione[]
  total: number
  page: number
  size: number
  pages: number
}

interface TipologiaStats {
  total_tipologie: number
  tipologie_con_descrizione: number
  tipologie_senza_descrizione: number
  ultima_creazione: string | null
  ultima_modifica: string | null
  nomi_piu_lunghi: Array<{ nome: string; lunghezza: number }>
}

const API_BASE_URL = `${process.env.NEXT_PUBLIC_BASE_URL}/api/tipologia-assicurazione`

export default function TipologiePage() {
  const [tipologie, setTipologie] = useState<TipologiaAssicurazione[]>([])
  const [stats, setStats] = useState<TipologiaStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingTipologia, setEditingTipologia] = useState<TipologiaAssicurazione | null>(null)
  const [formData, setFormData] = useState({ nome: "", descrizione: "" })
  const [generatingGaranzie, setGeneratingGaranzie] = useState<number | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  // Fetch tipologie with garanzie count
  const fetchTipologie = async (page = 1, search = "") => {
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
      if (!response.ok) throw new Error("Errore nel caricamento delle tipologie")
      
      const data: TipologiaAssicurazioneList = await response.json()
      
      // Fetch garanzie count for each tipologia
      const tipologieWithCount = await Promise.all(
        data.items.map(async (tipologia) => {
          try {
            const garanzieResponse = await fetch(
              `${process.env.NEXT_PUBLIC_BASE_URL}/api/garanzie/by-tipologia/${tipologia.id}?size=1`
            )
            if (garanzieResponse.ok) {
              const garanzieData = await garanzieResponse.json()
              return { ...tipologia, garanzie_count: garanzieData.garanzie.total }
            }
            return { ...tipologia, garanzie_count: 0 }
          } catch {
            return { ...tipologia, garanzie_count: 0 }
          }
        })
      )
      
      setTipologie(tipologieWithCount)
      setTotalPages(data.pages)
      setCurrentPage(data.page)
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile caricare le tipologie",
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
      
      const data: TipologiaStats = await response.json()
      setStats(data)
    } catch (error) {
      console.error("Errore nel caricamento delle statistiche:", error)
    }
  }

  // Create tipologia
  const createTipologia = async () => {
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
        description: "Tipologia creata con successo"
      })
      
      setIsCreateDialogOpen(false)
      setFormData({ nome: "", descrizione: "" })
      fetchTipologie(currentPage, searchTerm)
      fetchStats()
    } catch (error) {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Errore nella creazione",
        variant: "destructive"
      })
    }
  }

  // Update tipologia
  const updateTipologia = async () => {
    if (!editingTipologia) return
    
    try {
      const response = await fetch(`${API_BASE_URL}/${editingTipologia.id}`, {
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
        description: "Tipologia aggiornata con successo"
      })
      
      setIsEditDialogOpen(false)
      setEditingTipologia(null)
      setFormData({ nome: "", descrizione: "" })
      fetchTipologie(currentPage, searchTerm)
      fetchStats()
    } catch (error) {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Errore nell'aggiornamento",
        variant: "destructive"
      })
    }
  }

  // Delete tipologia
  const deleteTipologia = async (id: number) => {
    if (!confirm("Sei sicuro di voler eliminare questa tipologia?")) return
    
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: "DELETE"
      })
      
      if (!response.ok) throw new Error("Errore nell'eliminazione")
      
      toast({
        title: "Successo",
        description: "Tipologia eliminata con successo"
      })
      
      fetchTipologie(currentPage, searchTerm)
      fetchStats()
    } catch (error) {
      toast({
        title: "Errore",
        description: "Errore nell'eliminazione della tipologia",
        variant: "destructive"
      })
    }
  }

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
    fetchTipologie(1, value)
  }

  // Open edit dialog
  const openEditDialog = (tipologia: TipologiaAssicurazione) => {
    setEditingTipologia(tipologia)
    setFormData({
      nome: tipologia.nome,
      descrizione: tipologia.descrizione || ""
    })
    setIsEditDialogOpen(true)
  }

  // Navigate to garanzie for tipologia
  const navigateToGaranzie = (tipologiaId: number, tipologiaNome: string) => {
    router.push(`/dashboard/garanzie?tipologia_id=${tipologiaId}&tipologia_nome=${encodeURIComponent(tipologiaNome)}`)
  }

  // Generate garanzie for tipologia
  const generateGaranzie = async (tipologiaId: number, tipologiaNome: string) => {
    try {
      setGeneratingGaranzie(tipologiaId)
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/garanzie/genera/${tipologiaId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          custom_requirements: null,
          save_duplicates: false
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Errore nella generazione delle garanzie")
      }
      
      const result = await response.json()
      
      toast({
        title: "Successo",
        description: `Generate ${result.saved_to_database} nuove garanzie per ${tipologiaNome}`,
      })
      
      // Refresh the tipologie list to update garanzie count
      fetchTipologie(currentPage, searchTerm)
      
    } catch (error) {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Errore nella generazione delle garanzie",
        variant: "destructive"
      })
    } finally {
      setGeneratingGaranzie(null)
    }
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
    fetchTipologie()
    fetchStats()
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tipologie Assicurazione</h1>
          <p className="text-muted-foreground">
            Gestisci le tipologie di assicurazione disponibili nel sistema
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuova Tipologia
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crea Nuova Tipologia</DialogTitle>
              <DialogDescription>
                Inserisci i dettagli per la nuova tipologia di assicurazione
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Es. Assicurazione Auto"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="descrizione">Descrizione</Label>
                <Textarea
                  id="descrizione"
                  value={formData.descrizione}
                  onChange={(e) => setFormData({ ...formData, descrizione: e.target.value })}
                  placeholder="Descrizione della tipologia..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Annulla
              </Button>
              <Button onClick={createTipologia} disabled={!formData.nome.trim()}>
                Crea Tipologia
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
              <CardTitle className="text-sm font-medium">Totale Tipologie</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_tipologie}</div>
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
                {stats.total_tipologie > 0 
                  ? `${Math.round((stats.tipologie_con_descrizione / stats.total_tipologie) * 100)}%`
                  : "0%"
                } del totale
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
                {stats.ultima_creazione 
                  ? formatDate(stats.ultima_creazione)
                  : "Nessuna"
                }
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ultima Modifica</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">
                {stats.ultima_modifica 
                  ? formatDate(stats.ultima_modifica)
                  : "Nessuna"
                }
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
              <CardTitle>Elenco Tipologie</CardTitle>
              <CardDescription>
                Visualizza e gestisci tutte le tipologie di assicurazione
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca tipologie..."
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
          ) : tipologie.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "Nessuna tipologia trovata" : "Nessuna tipologia presente"}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrizione</TableHead>
                    <TableHead>Garanzie</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tipologie.map((tipologia) => (
                    <TableRow key={tipologia.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          <Tag className="h-4 w-4 text-muted-foreground" />
                          <span>{tipologia.nome}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {tipologia.descrizione ? (
                          <div className="max-w-[300px] truncate" title={tipologia.descrizione}>
                            {tipologia.descrizione}
                          </div>
                        ) : (
                          <Badge variant="secondary">Nessuna descrizione</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Badge variant={tipologia.garanzie_count && tipologia.garanzie_count > 0 ? "default" : "secondary"}>
                            {tipologia.garanzie_count || 0} garanzie
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {tipologia.garanzie_count && tipologia.garanzie_count > 0 ? (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => navigateToGaranzie(tipologia.id, tipologia.nome)}
                              title={`Visualizza garanzie per ${tipologia.nome}`}
                            >
                              <Shield className="h-4 w-4 mr-1" />
                              Garanzie
                            </Button>
                          ) : (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => generateGaranzie(tipologia.id, tipologia.nome)}
                              disabled={generatingGaranzie === tipologia.id}
                              title={`Genera garanzie per ${tipologia.nome}`}
                            >
                              {generatingGaranzie === tipologia.id ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              ) : (
                                <Wand2 className="h-4 w-4 mr-1" />
                              )}
                              {generatingGaranzie === tipologia.id ? "Generando..." : "Genera Garanzie"}
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(tipologia)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteTipologia(tipologia.id)}
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
                      fetchTipologie(newPage, searchTerm)
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
                      fetchTipologie(newPage, searchTerm)
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
            <DialogTitle>Modifica Tipologia</DialogTitle>
            <DialogDescription>
              Modifica i dettagli della tipologia di assicurazione
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-nome">Nome *</Label>
              <Input
                id="edit-nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Es. Assicurazione Auto"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-descrizione">Descrizione</Label>
              <Textarea
                id="edit-descrizione"
                value={formData.descrizione}
                onChange={(e) => setFormData({ ...formData, descrizione: e.target.value })}
                placeholder="Descrizione della tipologia..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={updateTipologia} disabled={!formData.nome.trim()}>
              Salva Modifiche
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
