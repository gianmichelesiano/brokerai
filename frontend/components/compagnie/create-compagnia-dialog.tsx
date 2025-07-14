"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CreateCompagniaDialogProps {
  onSuccess: () => void
}

const API_BASE_URL = `${process.env.NEXT_PUBLIC_BASE_URL}/api/compagnie`

export function CreateCompagniaDialog({ onSuccess }: CreateCompagniaDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({ nome: "" })
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Reset form
  const resetForm = () => {
    setFormData({ nome: "" })
  }

  // Create compagnia
  const createCompagnia = async () => {
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
          nome: formData.nome.trim()
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Errore nella creazione")
      }
      
      toast({
        title: "Successo",
        description: "Compagnia creata con successo"
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
          Nuova Compagnia
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Crea Nuova Compagnia</DialogTitle>
          <DialogDescription>
            Inserisci il nome della nuova compagnia assicurativa
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
            onClick={createCompagnia} 
            disabled={!formData.nome.trim() || isLoading}
          >
            {isLoading ? "Creazione..." : "Crea Compagnia"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
