"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Edit, Trash2, Tag } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface TipologiaAssicurazione {
  id: number
  nome: string
  descrizione: string | null
  created_at: string
  updated_at: string
}

interface TipologieTableProps {
  tipologie: TipologiaAssicurazione[]
  onUpdate: () => void
  loading?: boolean
}

const API_BASE_URL = `${process.env.NEXT_PUBLIC_BASE_URL}/api/tipologia-assicurazione`

export function TipologieTable({ tipologie, onUpdate, loading = false }: TipologieTableProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingTipologia, setEditingTipologia] = useState<TipologiaAssicurazione | null>(null)
  const [formData, setFormData] = useState({ nome: "", descrizione: "" })
  const { toast } = useToast()

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

  // Open edit dialog
  const openEditDialog = (tipologia: TipologiaAssicurazione) => {
    setEditingTipologia(tipologia)
    setFormData({
      nome: tipologia.nome,
      descrizione: tipologia.descrizione || ""
    })
    setIsEditDialogOpen(true)
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
      onUpdate()
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
      
      onUpdate()
    } catch (error) {
      toast({
        title: "Errore",
        description: "Errore nell'eliminazione della tipologia",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return <div className="text-center py-8">Caricamento...</div>
  }

  if (tipologie.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nessuna tipologia presente
      </div>
    )
  }

  return (
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
              <TableCell>{formatDate(tipologia.created_at)}</TableCell>
              <TableCell>{formatDate(tipologia.updated_at)}</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end space-x-2">
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
    </>
  )
}
