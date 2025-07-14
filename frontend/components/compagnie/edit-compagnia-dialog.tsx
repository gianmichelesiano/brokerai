"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"

interface Compagnia {
  id: number
  nome: string
  created_at: string
  updated_at: string
}

interface EditCompagniaDialogProps {
  compagnia: Compagnia | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const API_BASE_URL = `${process.env.NEXT_PUBLIC_BASE_URL}/api/compagnie`

export function EditCompagniaDialog({ compagnia, isOpen, onClose, onSuccess }: EditCompagniaDialogProps) {
  const [formData, setFormData] = useState({ nome: "" })
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Update form when compagnia changes
  useEffect(() => {
    if (compagnia) {
      setFormData({ nome: compagnia.nome })
    }
  }, [compagnia])

  // Reset form
  const resetForm = () => {
    if (compagnia) {
      setFormData({ nome: compagnia.nome })
    }
  }

  // Update compagnia
  const updateCompagnia = async () => {
    if (!compagnia) return
    
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
      const response = await fetch(`${API_BASE_URL}/${compagnia.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: formData.nome.trim()
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Errore nell'aggiornamento")
      }
      
      toast({
        title: "Successo",
        description: "Compagnia aggiornata con successo"
      })
      
      onClose()
      onSuccess()
    } catch (error) {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Errore nell'aggiornamento",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle dialog close
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose()
      resetForm()
    }
  }

  if (!compagnia) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Modifica Compagnia</DialogTitle>
          <DialogDescription>
            Modifica i dettagli della compagnia assicurativa
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="nome">Nome Compagnia *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Es. Generali, Allianz, AXA..."
              disabled={isLoading}
            />
          </div>
          <div className="grid gap-2">
            <Label>Informazioni</Label>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>ID: {compagnia.id}</p>
              <p>Creata: {new Date(compagnia.created_at).toLocaleString()}</p>
              <p>Modificata: {new Date(compagnia.updated_at).toLocaleString()}</p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            Annulla
          </Button>
          <Button 
            onClick={updateCompagnia} 
            disabled={!formData.nome.trim() || isLoading || formData.nome === compagnia.nome}
          >
            {isLoading ? "Aggiornamento..." : "Aggiorna"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
