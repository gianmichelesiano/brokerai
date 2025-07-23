"use client"
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { FileText, Calendar, Building, Hash, Loader2, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Compagnia {
  id: number
  nome: string
  created_at: string
  updated_at: string
}

interface CompagniaFile {
  relazione_id: number
  tipologia_id: number
  tipologia_nome: string
  filename: string
  path: string
  type: string
  size: number | null
  uploaded_at: string
  has_text: boolean
  attiva: boolean
}

interface CompagniaStats {
  total_compagnie: number
  compagnie_con_file: number
  compagnie_senza_file: number
  compagnie_con_testo: number
  compagnie_senza_testo: number
  file_types: Record<string, number>
  total_file_size: number
  average_text_length: number | null
  ultima_creazione: string | null
  ultima_modifica: string | null
  ultima_analisi: string | null
}

interface ViewCompagniaDialogProps {
  compagnia: Compagnia | null
  isOpen: boolean
  onClose: () => void
}

const API_BASE_URL = `${process.env.NEXT_PUBLIC_BASE_URL}/api/compagnie`

export function ViewCompagniaDialog({ compagnia, isOpen, onClose }: ViewCompagniaDialogProps) {
  const [files, setFiles] = useState<CompagniaFile[]>([])
  const [isLoadingFiles, setIsLoadingFiles] = useState(false)
  const [deletingFileId, setDeletingFileId] = useState<number | null>(null)
  const { toast } = useToast()

  // Load files when compagnia changes
  useEffect(() => {
    if (compagnia && isOpen) {
      loadFiles()
    }
  }, [compagnia, isOpen])

  // Load files for compagnia
  const loadFiles = async () => {
    if (!compagnia) return

    try {
      setIsLoadingFiles(true)
      const response = await apiGet(`${API_BASE_URL}/${compagnia.id}/files`)
      
      
      
      // response già contiene i dati JSON
const data = response
      setFiles(data.files || [])
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile caricare i file della compagnia",
        variant: "destructive"
      })
      setFiles([])
    } finally {
      setIsLoadingFiles(false)
    }
  }

  // Delete file (compagnia-tipologia relationship)
  const handleDeleteFile = async (relazioneId: number, filename: string) => {
    try {
      setDeletingFileId(relazioneId)
      
      const response = await apiDelete(`${process.env.NEXT_PUBLIC_BASE_URL}/api/compagnia-tipologia/${relazioneId}`)
      
      
      
      // Remove the file from the local state
      setFiles(prevFiles => prevFiles.filter(file => file.relazione_id !== relazioneId))
      
      toast({
        title: "Successo",
        description: `File "${filename}" eliminato con successo`,
      })
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile eliminare il file",
        variant: "destructive"
      })
    } finally {
      setDeletingFileId(null)
    }
  }

  // Handle dialog close
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose()
      setFiles([])
    }
  }

  if (!compagnia) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Dettagli Compagnia
          </DialogTitle>
          <DialogDescription>
            Informazioni complete sulla compagnia assicurativa
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Informazioni Base */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informazioni Generali</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Hash className="h-4 w-4" />
                    ID
                  </div>
                  <p className="font-medium">{compagnia.id}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Building className="h-4 w-4" />
                    Nome
                  </div>
                  <p className="font-medium">{compagnia.nome}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Calendar className="h-4 w-4" />
                    Data Creazione
                  </div>
                  <p className="text-sm">{new Date(compagnia.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Calendar className="h-4 w-4" />
                    Ultima Modifica
                  </div>
                  <p className="text-sm">{new Date(compagnia.updated_at).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* File e Polizze */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                File e Polizze
              </CardTitle>
              <CardDescription>
                File polizza associati alle tipologie di assicurazione
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingFiles ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Caricamento file...</span>
                </div>
              ) : files.length > 0 ? (
                <div className="space-y-3">
                  {files.map((file) => (
                    <div key={file.relazione_id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">{file.filename}</span>
                            <Badge variant={file.attiva ? "default" : "secondary"}>
                              {file.attiva ? "Attiva" : "Inattiva"}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p><strong>Tipologia:</strong> {file.tipologia_nome}</p>
                            <p><strong>Tipo:</strong> {file.type}</p>
                            {file.size && <p><strong>Dimensione:</strong> {(file.size / 1024 / 1024).toFixed(2)} MB</p>}
                            <p><strong>Caricato:</strong> {new Date(file.uploaded_at).toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col gap-1">
                            <Badge variant={file.has_text ? "default" : "secondary"} className="text-xs">
                              {file.has_text ? "Testo estratto" : "Nessun testo"}
                            </Badge>
                          </div>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                disabled={deletingFileId === file.relazione_id}
                              >
                                {deletingFileId === file.relazione_id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Sei sicuro di voler eliminare il file "{file.filename}" per la tipologia "{file.tipologia_nome}"?
                                  <br />
                                  <br />
                                  <strong>Questa azione non può essere annullata.</strong> Il file e tutti i dati associati verranno eliminati definitivamente.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annulla</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteFile(file.relazione_id, file.filename)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Elimina
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nessun file polizza associato</p>
                  <p className="text-sm">Aggiungi relazioni con tipologie per caricare file polizza</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Statistiche Rapide */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Statistiche</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{files.length}</div>
                  <div className="text-sm text-muted-foreground">File Totali</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {files.filter(f => f.has_text).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Con Testo</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {files.filter(f => f.attiva).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Attivi</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button onClick={() => handleOpenChange(false)}>
            Chiudi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
