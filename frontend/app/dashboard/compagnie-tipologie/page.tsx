"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MoreHorizontal, Edit, Trash2, Eye, Plus, Search, RefreshCw, FileText, Building, Tag, Link } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CompagniaTipologia {
  id: number
  compagnia_id: number
  tipologia_assicurazione_id: number
  polizza_filename: string | null
  polizza_path: string | null
  polizza_text: string | null
  attiva: boolean
  created_at: string
  updated_at: string
  compagnia_nome: string
  tipologia_nome: string
  tipologia_descrizione: string | null
}

interface Compagnia {
  id: number
  nome: string
}

interface Tipologia {
  id: number
  nome: string
  descrizione: string | null
}

const API_BASE_URL = `${process.env.NEXT_PUBLIC_BASE_URL}/api/compagnia-tipologia`
const COMPAGNIE_API_URL = `${process.env.NEXT_PUBLIC_BASE_URL}/api/compagnie`
const TIPOLOGIE_API_URL = `${process.env.NEXT_PUBLIC_BASE_URL}/api/tipologia-assicurazione`

export default function CompagnieTipologiePage() {
  const [relazioni, setRelazioni] = useState<CompagniaTipologia[]>([])
  const [filteredRelazioni, setFilteredRelazioni] = useState<CompagniaTipologia[]>([])
  const [compagnie, setCompagnie] = useState<Compagnia[]>([])
  const [tipologie, setTipologie] = useState<Tipologia[]>([])
  
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCompagnia, setSelectedCompagnia] = useState<string>("")
  const [selectedTipologia, setSelectedTipologia] = useState<string>("")
  const [selectedStato, setSelectedStato] = useState<string>("")
  
  const [isLoading, setIsLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  
  const { toast } = useToast()

  // Load data
  const loadData = async () => {
    try {
      setIsLoading(true)
      
      // Load relazioni
      const relazioniResponse = await fetch(`${API_BASE_URL}?size=100`)
      if (!relazioniResponse.ok) throw new Error("Errore nel caricamento delle relazioni")
      const relazioniData = await relazioniResponse.json()
      setRelazioni(relazioniData.items || [])
      
      // Load compagnie
      const compagnieResponse = await fetch(`${COMPAGNIE_API_URL}?size=100`)
      if (!compagnieResponse.ok) throw new Error("Errore nel caricamento delle compagnie")
      const compagnieData = await compagnieResponse.json()
      setCompagnie(compagnieData.items || [])
      
      // Load tipologie
      const tipologieResponse = await fetch(`${TIPOLOGIE_API_URL}?size=100`)
      if (!tipologieResponse.ok) throw new Error("Errore nel caricamento delle tipologie")
      const tipologieData = await tipologieResponse.json()
      setTipologie(tipologieData.items || [])
      
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile caricare i dati",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Filter relazioni
  useEffect(() => {
    let filtered = relazioni

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(rel => 
        rel.compagnia_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rel.tipologia_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (rel.polizza_filename && rel.polizza_filename.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Filter by compagnia
    if (selectedCompagnia) {
      filtered = filtered.filter(rel => rel.compagnia_id.toString() === selectedCompagnia)
    }

    // Filter by tipologia
    if (selectedTipologia) {
      filtered = filtered.filter(rel => rel.tipologia_assicurazione_id.toString() === selectedTipologia)
    }

    // Filter by stato
    if (selectedStato === "attiva") {
      filtered = filtered.filter(rel => rel.attiva)
    } else if (selectedStato === "inattiva") {
      filtered = filtered.filter(rel => !rel.attiva)
    } else if (selectedStato === "con_file") {
      filtered = filtered.filter(rel => rel.polizza_filename)
    } else if (selectedStato === "senza_file") {
      filtered = filtered.filter(rel => !rel.polizza_filename)
    }

    setFilteredRelazioni(filtered)
  }, [relazioni, searchTerm, selectedCompagnia, selectedTipologia, selectedStato])

  // Load data on mount and refresh
  useEffect(() => {
    loadData()
  }, [refreshTrigger])

  // Handle refresh
  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  // Clear filters
  const clearFilters = () => {
    setSearchTerm("")
    setSelectedCompagnia("")
    setSelectedTipologia("")
    setSelectedStato("")
  }

  const getStatusBadge = (relazione: CompagniaTipologia) => {
    if (!relazione.attiva) {
      return <Badge variant="secondary">Inattiva</Badge>
    }
    if (!relazione.polizza_filename) {
      return <Badge variant="outline">Nessun file</Badge>
    }
    if (!relazione.polizza_text) {
      return <Badge className="bg-yellow-100 text-yellow-700">File senza testo</Badge>
    }
    return <Badge variant="default">Completa</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 font-display">Relazioni Compagnia-Tipologia</h1>
          <p className="text-slate-600 mt-1">Gestisci le relazioni tra compagnie e tipologie di assicurazione</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Aggiorna
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuova Relazione
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Link className="h-4 w-4" />
              Relazioni Totali
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{relazioni.length}</div>
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
            <div className="text-2xl font-bold text-green-600">
              {relazioni.filter(r => r.polizza_filename).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building className="h-4 w-4" />
              Compagnie Coinvolte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {new Set(relazioni.map(r => r.compagnia_id)).size}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Tipologie Coinvolte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {new Set(relazioni.map(r => r.tipologia_assicurazione_id)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtri */}
      <Card>
        <CardHeader>
          <CardTitle>Filtri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                placeholder="Cerca..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedCompagnia} onValueChange={setSelectedCompagnia}>
              <SelectTrigger>
                <SelectValue placeholder="Tutte le compagnie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tutte le compagnie</SelectItem>
                {compagnie.map(compagnia => (
                  <SelectItem key={compagnia.id} value={compagnia.id.toString()}>
                    {compagnia.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedTipologia} onValueChange={setSelectedTipologia}>
              <SelectTrigger>
                <SelectValue placeholder="Tutte le tipologie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tutte le tipologie</SelectItem>
                {tipologie.map(tipologia => (
                  <SelectItem key={tipologia.id} value={tipologia.id.toString()}>
                    {tipologia.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedStato} onValueChange={setSelectedStato}>
              <SelectTrigger>
                <SelectValue placeholder="Tutti gli stati" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tutti gli stati</SelectItem>
                <SelectItem value="attiva">Attive</SelectItem>
                <SelectItem value="inattiva">Inattive</SelectItem>
                <SelectItem value="con_file">Con file</SelectItem>
                <SelectItem value="senza_file">Senza file</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={clearFilters}>
              Pulisci Filtri
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabella Relazioni */}
      <Card>
        <CardHeader>
          <CardTitle>Relazioni Compagnia-Tipologia</CardTitle>
          <CardDescription>
            Lista delle relazioni tra compagnie e tipologie di assicurazione
            {filteredRelazioni.length !== relazioni.length && (
              <span className="ml-2 text-sm">
                ({filteredRelazioni.length} di {relazioni.length} mostrate)
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : filteredRelazioni.length === 0 ? (
            <div className="text-center py-12">
              <Link className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                Nessuna relazione trovata
              </h3>
              <p className="text-sm text-muted-foreground">
                {relazioni.length === 0 
                  ? "Inizia creando la tua prima relazione compagnia-tipologia"
                  : "Prova a modificare i filtri di ricerca"
                }
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Compagnia</TableHead>
                  <TableHead>Tipologia</TableHead>
                  <TableHead>File Polizza</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Creata</TableHead>
                  <TableHead className="w-[100px]">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRelazioni.map((relazione) => (
                  <TableRow key={relazione.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{relazione.compagnia_nome}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <span className="font-medium">{relazione.tipologia_nome}</span>
                          {relazione.tipologia_descrizione && (
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {relazione.tipologia_descrizione}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {relazione.polizza_filename ? (
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-600" />
                          <div>
                            <p className="text-sm font-medium truncate max-w-[200px]">
                              {relazione.polizza_filename}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {relazione.polizza_text ? "Testo estratto" : "Nessun testo"}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Nessun file</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(relazione)}</TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {new Date(relazione.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            Visualizza
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Modifica
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Elimina
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
