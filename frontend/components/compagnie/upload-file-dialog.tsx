"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileInput } from "@/components/ui/file-input"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Upload, FileText } from "lucide-react"

interface Compagnia {
  id: number
  nome: string
  created_at: string
  updated_at: string
}

interface TipologiaAssicurazione {
  id: number
  nome: string
  descrizione?: string
  created_at: string
  updated_at: string
}

interface UploadFileDialogProps {
  compagnia: Compagnia | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const API_BASE_URL = `${process.env.NEXT_PUBLIC_BASE_URL}/api`

export function UploadFileDialog({ compagnia, isOpen, onClose, onSuccess }: UploadFileDialogProps) {
  const [tipologie, setTipologie] = useState<TipologiaAssicurazione[]>([])
  const [selectedTipologia, setSelectedTipologia] = useState<string>("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isLoadingTipologie, setIsLoadingTipologie] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  
  const { toast } = useToast()

  // Load tipologie when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadTipologie()
    } else {
      // Reset form when dialog closes
      setSelectedTipologia("")
      setSelectedFile(null)
    }
  }, [isOpen])

  const loadTipologie = async () => {
    try {
      setIsLoadingTipologie(true)
      const response = await fetch(`${API_BASE_URL}/tipologia-assicurazione/?page=1&size=100&sort_order=desc`)
      
      if (!response.ok) {
        throw new Error("Errore nel caricamento delle tipologie")
      }
      
      const data = await response.json()
      setTipologie(data.items || [])
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile caricare le tipologie assicurazione",
        variant: "destructive"
      })
      setTipologie([])
    } finally {
      setIsLoadingTipologie(false)
    }
  }

  const handleUpload = async () => {
    if (!compagnia || !selectedTipologia || !selectedFile) {
      toast({
        title: "Errore",
        description: "Seleziona una tipologia e un file prima di procedere",
        variant: "destructive"
      })
      return
    }

    try {
      setIsUploading(true)
      
      // Prepare form data
      const formData = new FormData()
      formData.append("compagnia_id", compagnia.id.toString())
      formData.append("tipologia_assicurazione_id", selectedTipologia)
      formData.append("file", selectedFile)

      const response = await fetch(`${API_BASE_URL}/upload/compagnia-tipologia`, {
        method: "POST",
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Errore durante l'upload")
      }

      const result = await response.json()

      toast({
        title: "Successo",
        description: `File caricato con successo per ${result.relation_info.compagnia_nome} - ${result.relation_info.tipologia_nome}`,
      })

      onSuccess()
      onClose()
      
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Errore durante l'upload del file",
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleClose = () => {
    if (!isUploading) {
      onClose()
    }
  }

  const isFormValid = selectedTipologia && selectedFile && !isUploading

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload File Polizza
          </DialogTitle>
          <DialogDescription>
            {compagnia ? (
              <>Carica un file polizza per <strong>{compagnia.nome}</strong></>
            ) : (
              "Carica un file polizza per la compagnia selezionata"
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Tipologia Selection */}
          <div className="space-y-2">
            <Label htmlFor="tipologia">Tipologia Assicurazione *</Label>
            {isLoadingTipologie ? (
              <div className="flex items-center justify-center p-4 border rounded-md">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Caricamento tipologie...</span>
              </div>
            ) : (
              <Select value={selectedTipologia} onValueChange={setSelectedTipologia}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona una tipologia assicurazione" />
                </SelectTrigger>
                <SelectContent>
                  {tipologie.map((tipologia) => (
                    <SelectItem key={tipologia.id} value={tipologia.id.toString()}>
                      <div className="flex flex-col">
                        <span className="font-medium">{tipologia.nome}</span>
                        {tipologia.descrizione && (
                          <span className="text-xs text-muted-foreground">
                            {tipologia.descrizione}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {tipologie.length === 0 && !isLoadingTipologie && (
              <p className="text-xs text-muted-foreground">
                Nessuna tipologia disponibile. Crea prima una tipologia assicurazione.
              </p>
            )}
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label>File Polizza *</Label>
            <FileInput
              onFileSelect={setSelectedFile}
              acceptedTypes={["pdf", "docx", "doc", "txt"]}
              maxSize={50}
              showPreview={true}
            />
            <p className="text-xs text-muted-foreground">
              Formati supportati: PDF, DOCX, DOC, TXT • Dimensione massima: 50MB
            </p>
          </div>

          {/* Selected Info Preview */}
          {selectedTipologia && selectedFile && (
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Riepilogo Upload</span>
              </div>
              <div className="text-sm space-y-1">
                <p><strong>Compagnia:</strong> {compagnia?.nome}</p>
                <p><strong>Tipologia:</strong> {tipologie.find(t => t.id.toString() === selectedTipologia)?.nome}</p>
                <p><strong>File:</strong> {selectedFile.name}</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isUploading}>
            Annulla
          </Button>
          <Button onClick={handleUpload} disabled={!isFormValid}>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Caricamento...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Carica File
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
