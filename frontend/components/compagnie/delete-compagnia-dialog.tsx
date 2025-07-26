"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { apiDelete } from "@/lib/api"

interface Compagnia {
  id: number
  nome: string
  created_at: string
  updated_at: string
}

interface DeleteCompagniaDialogProps {
  compagnia: Compagnia | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const API_BASE_URL = `${process.env.NEXT_PUBLIC_BASE_URL}/api/compagnie`

export function DeleteCompagniaDialog({ compagnia, isOpen, onClose, onSuccess }: DeleteCompagniaDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Delete compagnia
  const deleteCompagnia = async () => {
    if (!compagnia) return

    try {
      setIsLoading(true)
      await apiDelete(`${API_BASE_URL}/${compagnia.id}`)
      
      toast({
        title: "Successo",
        description: "Compagnia eliminata con successo"
      })
      
      onClose()
      onSuccess()
    } catch (error) {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Errore nell'eliminazione",
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
    }
  }

  if (!compagnia) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Elimina Compagnia
          </DialogTitle>
          <DialogDescription>
            Questa azione non può essere annullata. La compagnia e tutte le sue relazioni con le tipologie di assicurazione verranno eliminate definitivamente.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <h4 className="font-medium text-destructive mb-2">Compagnia da eliminare:</h4>
            <div className="space-y-1 text-sm">
              <p><strong>Nome:</strong> {compagnia.nome}</p>
              <p><strong>ID:</strong> {compagnia.id}</p>
              <p><strong>Creata:</strong> {new Date(compagnia.created_at).toLocaleString()}</p>
            </div>
          </div>
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Attenzione:</strong> Eliminando questa compagnia verranno eliminate anche:
            </p>
            <ul className="text-sm text-yellow-700 mt-2 list-disc list-inside">
              <li>Tutte le relazioni con le tipologie di assicurazione</li>
              <li>Tutti i file polizza associati</li>
              <li>Tutti i mapping e le analisi correlate</li>
            </ul>
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
            variant="destructive"
            onClick={deleteCompagnia} 
            disabled={isLoading}
          >
            {isLoading ? "Eliminazione..." : "Elimina Definitivamente"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
