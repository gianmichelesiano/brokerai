"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit, Trash2, Layers, Shield } from "lucide-react"

interface Sezione {
  id: number
  nome: string
  descrizione: string | null
  created_at: string
  updated_at: string
}

interface SezioniTableProps {
  sezioni: Sezione[]
  onEdit: (sezione: Sezione) => void
  onDelete: (id: number) => void
  onViewGaranzie: (sezioneId: number, sezioneNome: string) => void
}

export function SezioniTable({ sezioni, onEdit, onDelete, onViewGaranzie }: SezioniTableProps) {
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

  if (sezioni.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nessuna sezione presente
      </div>
    )
  }

  return (
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
        {sezioni.map((sezione) => (
          <TableRow key={sezione.id}>
            <TableCell className="font-medium">
              <div className="flex items-center space-x-2">
                <Layers className="h-4 w-4 text-muted-foreground" />
                <span>{sezione.nome}</span>
              </div>
            </TableCell>
            <TableCell>
              {sezione.descrizione ? (
                <div className="max-w-[300px] truncate" title={sezione.descrizione}>
                  {sezione.descrizione}
                </div>
              ) : (
                <Badge variant="secondary">Nessuna descrizione</Badge>
              )}
            </TableCell>
            <TableCell>{formatDate(sezione.created_at)}</TableCell>
            <TableCell>{formatDate(sezione.updated_at)}</TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end space-x-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => onViewGaranzie(sezione.id, sezione.nome)}
                  title={`Visualizza garanzie per ${sezione.nome}`}
                >
                  <Shield className="h-4 w-4 mr-1" />
                  Garanzie
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(sezione)}
                  title="Modifica sezione"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(sezione.id)}
                  title="Elimina sezione"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
