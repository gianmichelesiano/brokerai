"use client"
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api"


import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Edit, Trash2, Shield, ArrowLeft, Tag, Layers } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Garanzia {
  id: number
  sezione_id: number
  titolo: string
  descrizione: string
  tipologia: number | null
  created_at: string
  updated_at: string
}

interface Sezione {
  id: number
  nome: string
  descrizione: string | null
}

interface GaranziaList {
  items: Garanzia[]
  total: number
  page: number
  size: number
  pages: number
}

interface TipologiaInfo {
  id: number
  nome: string
  descrizione: string | null
}

interface TipologiaAssicurazione {
  id: number
  nome: string
  descrizione: string | null
  created_at: string
  updated_at: string
}

const API_BASE_URL = `${process.env.NEXT_PUBLIC_BASE_URL}/api/garanzie`
const TIPOLOGIE_API_URL = `${process.env.NEXT_PUBLIC_BASE_URL}/api/tipologia-assicurazione`
const SEZIONI_API_URL = `${process.env.NEXT_PUBLIC_BASE_URL}/api/sezioni`

export default function GaranziePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()

  // URL parameters
  const tipologiaIdParam = searchParams.get("tipologia_id")
  const tipologiaNomeParam = searchParams.get("tipologia_nome")

  // State
  const [garanzie, setGaranzie] = useState<Garanzia[]>([])
  const [tipologiaInfo, setTipologiaInfo] = useState<TipologiaInfo | null>(null)
  const [tipologie, setTipologie] = useState<TipologiaAssicurazione[]>([])
  const [selectedTipologia, setSelectedTipologia] = useState<string>(tipologiaIdParam || "all")
  const [loading, setLoading] = useState(true)
  const [selectedSezione, setSelectedSezione] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingGaranzia, setEditingGaranzia] = useState<Garanzia | null>(null)
  const [formData, setFormData] = useState({ 
    sezione_id: null as number | null, 
    titolo: "", 
    descrizione: "",
    tipologia: null as number | null
  })
  const [sezioni, setSezioni] = useState<Sezione[]>([])
  const [sezioniStats, setSezioniStats] = useState<Array<{ sezione: string; count: number }>>([])

  // Fetch garanzie
  const fetchGaranzie = async (tipologiaId: string, page = 1, sezione = "all") => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        size: "20",
        sort_by: "created_at",
        sort_order: "desc"
      });

      if (sezione !== "all") {
        params.append("sezione", sezione);
      }

      if (tipologiaId === "all") {
        const data = await apiGet<GaranziaList>(`${API_BASE_URL}/?${params}`);
        setGaranzie(data.items);
        setTotalPages(data.pages);
        setCurrentPage(data.page);
        setTipologiaInfo(null); // Clear tipologia info when showing all
      } else {
        const data = await apiGet<{ garanzie: GaranziaList; tipologia: TipologiaInfo }>(`${API_BASE_URL}/by-tipologia/${tipologiaId}?${params}`);
        setGaranzie(data.garanzie.items);
        setTotalPages(data.garanzie.pages);
        setCurrentPage(data.garanzie.page);
        setTipologiaInfo(data.tipologia);
      }
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile caricare le garanzie",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  // Fetch tipologie
  const fetchTipologie = async () => {
    try {
      const data = await apiGet<{ items: TipologiaAssicurazione[] }>(`${TIPOLOGIE_API_URL}/?page=1&size=100`)
      setTipologie(data.items)
    } catch (error) {
      console.error("Errore nel caricamento delle tipologie:", error)
    }
  }

  // Fetch sezioni
  const fetchSezioni = async () => {
    try {
      const data = await apiGet<Sezione[]>(`${SEZIONI_API_URL}/all`)
      setSezioni(data)
    } catch (error) {
      console.error("Errore nel caricamento delle sezioni:", error)
    }
  }

  // Fetch sezioni stats (for filter dropdown)
  const fetchSezioniStats = async () => {
    try {
      const data = await apiGet<Array<{ sezione: string; count: number }>>(`${API_BASE_URL}/sezioni`)
      setSezioniStats(data)
    } catch (error) {
      console.error("Errore nel caricamento delle statistiche sezioni:", error)
    }
  }

  // Create garanzia
  const createGaranzia = async () => {
    try {
      await apiPost(API_BASE_URL, formData)
      
      toast({
        title: "Successo",
        description: "Garanzia creata con successo"
      })
      
      setIsCreateDialogOpen(false)
      setFormData({ 
        sezione_id: null, 
        titolo: "", 
        descrizione: "",
        tipologia: null
      })
      if (selectedTipologia) {
        fetchGaranzie(selectedTipologia, currentPage, selectedSezione);
      }
      fetchSezioni();
    } catch (error) {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Errore nella creazione",
        variant: "destructive"
      })
    }
  }

  // Update garanzia
  const updateGaranzia = async () => {
    if (!editingGaranzia) return
    
    try {
      await apiPut(`${API_BASE_URL}/${editingGaranzia.id}`, formData)
      
      toast({
        title: "Successo",
        description: "Garanzia aggiornata con successo"
      })
      
      setIsEditDialogOpen(false)
      setEditingGaranzia(null)
      setFormData({ 
        sezione_id: null, 
        titolo: "", 
        descrizione: "",
        tipologia: null
      })
      if (selectedTipologia) {
        fetchGaranzie(selectedTipologia, currentPage, selectedSezione);
      }
      fetchSezioni();
    } catch (error) {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Errore nell'aggiornamento",
        variant: "destructive"
      })
    }
  }

  // Delete garanzia
  const deleteGaranzia = async (id: number) => {
    if (!confirm("Sei sicuro di voler eliminare questa garanzia?")) return
    
    try {
      await apiDelete(`${API_BASE_URL}/${id}`)
      
      toast({
        title: "Successo",
        description: "Garanzia eliminata con successo"
      })
      if (selectedTipologia) {
        fetchGaranzie(selectedTipologia, currentPage, selectedSezione);
      }
      fetchSezioni();
    } catch (error) {
      toast({
        title: "Errore",
        description: "Errore nell'eliminazione della garanzia",
        variant: "destructive"
      })
    }
  }


  // Handle sezione filter
  const handleSezioneChange = (value: string) => {
    setSelectedSezione(value);
    setCurrentPage(1);
  }

  // Open edit dialog
  const openEditDialog = (garanzia: Garanzia) => {
    setEditingGaranzia(garanzia)
    setFormData({
      sezione_id: garanzia.sezione_id,
      titolo: garanzia.titolo,
      descrizione: garanzia.descrizione,
      tipologia: garanzia.tipologia
    })
    setIsEditDialogOpen(true)
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

  // Go back to tipologie
  const goBackToTipologie = () => {
    router.push("/dashboard/tipologie")
  }

  useEffect(() => {
    fetchTipologie();
    fetchSezioni();
    fetchSezioniStats();
  }, []);

  // Auto-select first tipologia if none is selected
  useEffect(() => {
    if (tipologie.length > 0 && (selectedTipologia === "all" || !selectedTipologia)) {
      setSelectedTipologia(tipologie[0].id.toString());
    }
  }, [tipologie]);

  useEffect(() => {
    fetchGaranzie(selectedTipologia, currentPage, selectedSezione);
  }, [selectedTipologia, currentPage, selectedSezione]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            {tipologiaInfo && (
              <Button
                variant="outline"
                size="sm"
                onClick={goBackToTipologie}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Rami
              </Button>
            )}
            <h1 className="text-3xl font-bold tracking-tight">
              {tipologiaInfo ? `Garanzie - ${tipologiaInfo.nome}` : "Gestione Garanzie"}
            </h1>
          </div>
          <p className="text-muted-foreground">
            {tipologiaInfo 
              ? `Visualizza e gestisci le garanzie per la tipologia ${tipologiaInfo.nome}`
              : "Gestisci tutte le garanzie assicurative del sistema"
            }
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuova Garanzia
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Crea Nuova Garanzia</DialogTitle>
              <DialogDescription>
                Inserisci i dettagli per la nuova garanzia assicurativa
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="tipologia">Tipologia *</Label>
                <Select
                  value={formData.tipologia?.toString() || ""}
                  onValueChange={(value) => setFormData({ ...formData, tipologia: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona una tipologia" />
                  </SelectTrigger>
                  <SelectContent>
                    {tipologie.map((tip) => (
                      <SelectItem key={tip.id} value={tip.id.toString()}>
                        {tip.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sezione">Sezione *</Label>
                <Select
                  value={formData.sezione_id?.toString() || ""}
                  onValueChange={(value) => setFormData({ ...formData, sezione_id: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona una sezione" />
                  </SelectTrigger>
                  <SelectContent>
                    {sezioni.map((sezione) => (
                      <SelectItem key={sezione.id} value={sezione.id.toString()}>
                        {sezione.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="titolo">Titolo *</Label>
                <Input
                  id="titolo"
                  value={formData.titolo}
                  onChange={(e) => setFormData({ ...formData, titolo: e.target.value })}
                  placeholder="Es. Responsabilità Civile"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="descrizione">Descrizione *</Label>
                <Textarea
                  id="descrizione"
                  value={formData.descrizione}
                  onChange={(e) => setFormData({ ...formData, descrizione: e.target.value })}
                  placeholder="Descrizione dettagliata della garanzia..."
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Annulla
              </Button>
              <Button 
                onClick={createGaranzia} 
                disabled={!formData.tipologia || !formData.sezione_id || !formData.titolo.trim() || !formData.descrizione.trim()}
              >
                Crea Garanzia
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Elenco Garanzie</CardTitle>
              <CardDescription>
                {tipologiaInfo 
                  ? `Garanzie per la tipologia ${tipologiaInfo.nome}`
                  : "Seleziona una tipologia per visualizzare le garanzie"
                }
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Select
                value={selectedTipologia}
                onValueChange={(value) => {
                  setSelectedTipologia(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Filtra per tipologia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte le tipologie</SelectItem>
                  {tipologie.map((tip) => (
                    <SelectItem key={tip.id} value={tip.id.toString()}>
                      {tip.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedSezione} onValueChange={handleSezioneChange}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filtra per sezione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte le sezioni</SelectItem>
                  {sezioniStats.map((sezione) => (
                    <SelectItem key={sezione.sezione} value={sezione.sezione}>
                      {sezione.sezione} ({sezione.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Caricamento...</div>
          ) : garanzie.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {selectedSezione !== "all" 
                ? "Nessuna garanzia trovata con i filtri selezionati" 
                : tipologiaInfo
                  ? `Nessuna garanzia presente per la tipologia ${tipologiaInfo.nome}`
                  : "Nessuna garanzia presente"
              }
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipologia</TableHead>
                    <TableHead>Sezione</TableHead>
                    <TableHead>Titolo</TableHead>
                    <TableHead>Descrizione</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {garanzie.map((garanzia) => (
                    <TableRow key={garanzia.id}>
                      <TableCell>
                        {tipologiaInfo ? tipologiaInfo.nome : 
                         (tipologie.find(t => t.id === garanzia.tipologia)?.nome || "N/A")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {sezioni.find(s => s.id === garanzia.sezione_id)?.nome || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{garanzia.titolo}</TableCell>
                      <TableCell>
                        <div className="max-w-[400px] truncate" title={garanzia.descrizione}>
                          {garanzia.descrizione}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(garanzia)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteGaranzia(garanzia.id)}
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
                      const newPage = currentPage - 1;
                      setCurrentPage(newPage);
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
                      const newPage = currentPage + 1;
                      setCurrentPage(newPage);
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifica Garanzia</DialogTitle>
            <DialogDescription>
              Modifica i dettagli della garanzia assicurativa
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-tipologia">Tipologia *</Label>
              <Select
                value={formData.tipologia?.toString() || ""}
                onValueChange={(value) => setFormData({ ...formData, tipologia: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona una tipologia" />
                </SelectTrigger>
                <SelectContent>
                  {tipologie.map((tip) => (
                    <SelectItem key={tip.id} value={tip.id.toString()}>
                      {tip.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-sezione">Sezione *</Label>
              <Select
                value={formData.sezione_id?.toString() || ""}
                onValueChange={(value) => setFormData({ ...formData, sezione_id: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona una sezione" />
                </SelectTrigger>
                <SelectContent>
                  {sezioni.map((sezione) => (
                    <SelectItem key={sezione.id} value={sezione.id.toString()}>
                      {sezione.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-titolo">Titolo *</Label>
              <Input
                id="edit-titolo"
                value={formData.titolo}
                onChange={(e) => setFormData({ ...formData, titolo: e.target.value })}
                placeholder="Es. Responsabilità Civile"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-descrizione">Descrizione *</Label>
              <Textarea
                id="edit-descrizione"
                value={formData.descrizione}
                onChange={(e) => setFormData({ ...formData, descrizione: e.target.value })}
                placeholder="Descrizione dettagliata della garanzia..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Annulla
            </Button>
            <Button 
              onClick={updateGaranzia} 
              disabled={!formData.tipologia || !formData.sezione_id || !formData.titolo.trim() || !formData.descrizione.trim()}
            >
              Salva Modifiche
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
