"use client"

import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CreateTipologiaDialogProps {
  onSuccess: () => void
}

const API_BASE_URL = `${process.env.NEXT_PUBLIC_BASE_URL}/api/tipologia-assicurazione`

export function CreateTipologiaDialog({ onSuccess }: CreateTipologiaDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({ nome: "", descrizione: "" })
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Reset form
  const resetForm = () => {
    setFormData({ nome: "", descrizione: "" })
  }

  // Create tipologia
  const createTipologia = async () => {
    if (!formData.nome.trim()) {
      toast({
        title: "Errore",
        description: "Il nome è obbligatorio",
        variant: "destructive"
      })
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch(API_BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: formData.nome.trim(),
          descrizione: formData.descrizione.trim() || null
        })
      })
      
      
      
      toast({
        title: "Successo",
        description: "Tipologia creata con successo"
      })
      
      setIsOpen(false)
      resetForm()
      onSuccess()
    } catch (error) {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Errore nella creazione",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle dialog close
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      resetForm()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nuova Tipologia
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
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
              disabled={isLoading}
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
              disabled={isLoading}
            />
          </div>
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
          >
            Annulla
          </Button>
          <Button 
            onClick={createTipologia} 
            disabled={!formData.nome.trim() || isLoading}
          >
            {isLoading ? "Creazione..." : "Crea Tipologia"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
