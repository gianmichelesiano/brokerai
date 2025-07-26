"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Trash2, Eye, Building } from "lucide-react"
import { createClient } from "@/lib/supabase"

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

interface CompagnieTableProps {
  compagnie: Compagnia[]
  isLoading: boolean
  onView: (compagnia: Compagnia) => void
  onEdit: (compagnia: Compagnia) => void
  onDelete: (compagnia: Compagnia) => void
  onUpload?: (compagnia: Compagnia) => void
  onAnalyze?: (compagnia: Compagnia) => void
}

export function CompagnieTable({ compagnie, isLoading, onView, onEdit, onDelete, onUpload, onAnalyze }: CompagnieTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded" />
        ))}
      </div>
    )
  }

  if (compagnie.length === 0) {
    return (
      <div className="text-center py-12">
        <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground mb-2">
          Nessuna compagnia trovata
        </h3>
        <p className="text-sm text-muted-foreground">
          Inizia creando la tua prima compagnia assicurativa
        </p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Tipologie con Polizza</TableHead>
          <TableHead className="w-[220px]">Azioni</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {compagnie.map((compagnia) => (
          <TableRow key={compagnia.id}>
            <TableCell>
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{compagnia.nome}</span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {compagnia.tipologie && compagnia.tipologie.length > 0 ? (
                  compagnia.tipologie.map((tip: TipologiaConPolizza) => (
                    <span
                      key={tip.tipologia_id}
                      title={tip.tipologia_descrizione || ""}
                    >
                      {tip.polizza_path ? (
                        <SupabasePolizzaLink polizzaPath={tip.polizza_path}>
                          <Badge
                            variant={
                              tip.has_text
                                ? "default"
                                : tip.polizza_filename
                                ? "secondary"
                                : "outline"
                            }
                            className={
                              tip.has_text
                                ? "bg-green-100 text-green-800 cursor-pointer underline"
                                : tip.polizza_filename
                                ? "bg-yellow-100 text-yellow-800 cursor-pointer underline"
                                : "bg-gray-100 text-gray-600"
                            }
                          >
                            {tip.tipologia_nome}
                          </Badge>
                        </SupabasePolizzaLink>
                      ) : (
                        <Badge
                          variant={
                            tip.has_text
                              ? "default"
                              : tip.polizza_filename
                              ? "secondary"
                              : "outline"
                          }
                          className={
                            tip.has_text
                              ? "bg-green-100 text-green-800"
                              : tip.polizza_filename
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-600"
                          }
                        >
                          {tip.tipologia_nome}
                        </Badge>
                      )}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">
                    Nessuna tipologia
                  </span>
                )}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUpload && onUpload(compagnia)}
                >
                  Upload Polizza
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAnalyze && onAnalyze(compagnia)}
                >
                  Analizza Polizza
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onView(compagnia)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Visualizza
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(compagnia)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Modifica
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(compagnia)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Elimina
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

// Utility component to generate a signed Supabase URL for download/view
import { useEffect, useState } from "react"
interface SupabasePolizzaLinkProps {
  polizzaPath: string
  children: React.ReactNode
}
function SupabasePolizzaLink({ polizzaPath, children }: SupabasePolizzaLinkProps) {
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const getSignedUrl = async () => {
      try {
        const { data, error } = await supabase.storage
          .from('polizze')
          .createSignedUrl(polizzaPath, 3600) // URL valido per 1 ora
        
        if (error) {
          console.error('Errore nel creare URL firmato:', error)
          return
        }
        
        setDownloadUrl(data.signedUrl)
      } catch (error) {
        console.error('Errore nel ottenere URL firmato:', error)
      }
    }

    if (polizzaPath) {
      getSignedUrl()
    }
  }, [polizzaPath, supabase])

  if (downloadUrl) {
    return (
      <a 
        href={downloadUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        className="hover:opacity-80 transition-opacity"
      >
        {children}
      </a>
    )
  }
  
  return <span>{children}</span>
}
