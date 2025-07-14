"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CreateSezioneDialogProps {
  onSezioneCreated: () => void
}

interface SezioneFormData {
  nome: string
  descrizione: string
}

const API_BASE_URL = "http://localhost:8000/api/sezioni"

export function CreateSezioneDialog({ onSezioneCreated }: CreateSezioneDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<SezioneFormData>({
    nome: "",
    descrizione: ""
  })
  const { toast } = useToast()

  const handleSubmit = async () => {
    if (!formData.nome.trim()) {
      toast({
        title: "Errore",
        description: "Il nome della sezione è obbligatorio",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
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
      
      // Reset form and close dialog
      setFormData({ nome: "", descrizione: "" })
      setIsOpen(false)
      onSezioneCreated()
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

  const handleCancel = () => {
    setFormData({ nome: "", descrizione: "" })
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
              disabled={isLoading}
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
              disabled={isLoading}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            Annulla
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!formData.nome.trim() || isLoading}
          >
            {isLoading ? "Creazione..." : "Crea Sezione"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
