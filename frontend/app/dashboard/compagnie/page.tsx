"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Import components
import { CreateCompagniaDialog } from "@/components/compagnie/create-compagnia-dialog"
import { EditCompagniaDialog } from "@/components/compagnie/edit-compagnia-dialog"
import { DeleteCompagniaDialog } from "@/components/compagnie/delete-compagnia-dialog"
import { ViewCompagniaDialog } from "@/components/compagnie/view-compagnia-dialog"
import { UploadFileDialog } from "@/components/compagnie/upload-file-dialog"
import { CompagnieStats } from "@/components/compagnie/compagnie-stats"
import { CompagnieTable } from "@/components/compagnie/compagnie-table"

interface TipologiaConPolizza {
  relazione_id: number;
  tipologia_id: number;
  tipologia_nome: string;
  tipologia_descrizione?: string;
  polizza_filename?: string;
  polizza_path?: string;
  has_text: boolean;
  attiva: boolean;
  created_at: string;
  updated_at: string;
}

interface Compagnia {
  id: number
  nome: string
  created_at: string
  updated_at: string
  tipologie?: TipologiaConPolizza[]
  total_tipologie?: number
}

const API_BASE_URL = `${process.env.NEXT_PUBLIC_BASE_URL}/api/compagnie`

export default function CompagniePage() {
  const [compagnie, setCompagnie] = useState<Compagnia[]>([])
  const [filteredCompagnie, setFilteredCompagnie] = useState<Compagnia[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  
  // Dialog states
  const [selectedCompagnia, setSelectedCompagnia] = useState<Compagnia | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  
  const { toast } = useToast()
  const router = useRouter()

  // Load compagnie
  const loadCompagnie = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`${API_BASE_URL}?size=100`)
      
      if (!response.ok) {
        throw new Error("Errore nel caricamento delle compagnie")
      }
      
      const data = await response.json()
      const compagnieBase: Compagnia[] = data.items || []

      // Recupera le tipologie per ogni compagnia in parallelo
      const compagnieWithTipologie = await Promise.all(
        compagnieBase.map(async (compagnia) => {
          try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/compagnia-tipologia/compagnia/${compagnia.id}/tipologie`)
            if (!res.ok) return { ...compagnia, tipologie: [] }
            const tipData = await res.json()
            return {
              ...compagnia,
              tipologie: tipData.tipologie || [],
              total_tipologie: tipData.total_tipologie || 0
            }
          } catch {
            return { ...compagnia, tipologie: [] }
          }
        })
      )

      setCompagnie(compagnieWithTipologie)
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile caricare le compagnie",
        variant: "destructive"
      })
      setCompagnie([])
    } finally {
      setIsLoading(false)
    }
  }

  // Filter compagnie based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredCompagnie(compagnie)
    } else {
      const filtered = compagnie.filter((compagnia) =>
        compagnia.nome.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredCompagnie(filtered)
    }
  }, [compagnie, searchTerm])

  // Load compagnie on mount and when refresh trigger changes
  useEffect(() => {
    loadCompagnie()
  }, [refreshTrigger])

  // Handle refresh
  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  // Handle success operations
  const handleSuccess = () => {
    handleRefresh()
  }

  // Handle view compagnia
  const handleView = (compagnia: Compagnia) => {
    setSelectedCompagnia(compagnia)
    setIsViewDialogOpen(true)
  }

  // Handle edit compagnia
  const handleEdit = (compagnia: Compagnia) => {
    setSelectedCompagnia(compagnia)
    setIsEditDialogOpen(true)
  }

  // Handle delete compagnia
  const handleDelete = (compagnia: Compagnia) => {
    setSelectedCompagnia(compagnia)
    setIsDeleteDialogOpen(true)
  }

  // Handle upload file
  const handleUpload = (compagnia: Compagnia) => {
    setSelectedCompagnia(compagnia)
    setIsUploadDialogOpen(true)
  }

  // Handle analyze compagnia
  const handleAnalyze = (compagnia: Compagnia) => {
    router.push(`/dashboard/compagnie/${compagnia.id}/analizza-polizza`)
  }

  // Close dialogs
  const closeDialogs = () => {
    setSelectedCompagnia(null)
    setIsViewDialogOpen(false)
    setIsEditDialogOpen(false)
    setIsDeleteDialogOpen(false)
    setIsUploadDialogOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 font-display">Gestione Compagnie</h1>
          <p className="text-slate-600 mt-1">Gestisci le compagnie assicurative e le loro relazioni con le tipologie</p>
        </div>
        <div className="flex gap-2">
          {/* 
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Aggiorna
          </Button>
           */}
          <CreateCompagniaDialog onSuccess={handleSuccess} />
        </div>
      </div>

      {/* Stats */}
      {/* <CompagnieStats refreshTrigger={refreshTrigger} /> */}

      {/* Filtri */}
      {/* 
      <Card>
        <CardHeader>
          <CardTitle>Filtri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Cerca compagnie per nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
     */}
      {/* Tabella Compagnie */}
      <Card>
        <CardHeader>
          <CardTitle>Compagnie Assicurative</CardTitle>
          <CardDescription>
            Lista delle compagnie registrate nel sistema
            {filteredCompagnie.length !== compagnie.length && (
              <span className="ml-2 text-sm">
                ({filteredCompagnie.length} di {compagnie.length} mostrate)
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CompagnieTable
            compagnie={filteredCompagnie}
            isLoading={isLoading}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onUpload={handleUpload}
            onAnalyze={handleAnalyze}
          />
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ViewCompagniaDialog
        compagnia={selectedCompagnia}
        isOpen={isViewDialogOpen}
        onClose={closeDialogs}
      />
      
      <EditCompagniaDialog
        compagnia={selectedCompagnia}
        isOpen={isEditDialogOpen}
        onClose={closeDialogs}
        onSuccess={handleSuccess}
      />
      
      <DeleteCompagniaDialog
        compagnia={selectedCompagnia}
        isOpen={isDeleteDialogOpen}
        onClose={closeDialogs}
        onSuccess={handleSuccess}
      />
      
      <UploadFileDialog
        compagnia={selectedCompagnia}
        isOpen={isUploadDialogOpen}
        onClose={closeDialogs}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
