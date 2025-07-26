"use client"

import React from "react"
import { User } from "@/lib/api/users"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { UserPlus, UserMinus, Edit } from "lucide-react"
import { format } from "date-fns"

interface UsersTableProps {
  users: User[]
  isLoading?: boolean
  onAssignCompany: (user: User) => void
  onEditAssignment: (user: User) => void
  onRemoveFromCompany: (user: User) => void
}

export const UsersTable: React.FC<UsersTableProps> = ({ 
  users, 
  isLoading = false,
  onAssignCompany,
  onEditAssignment,
  onRemoveFromCompany
}) => {
  if (isLoading) {
    return (
      <div className="w-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Azienda</TableHead>
              <TableHead>Ruolo</TableHead>
              <TableHead>Data Registrazione</TableHead>
              <TableHead className="text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell><div className="h-4 bg-slate-200 rounded animate-pulse"></div></TableCell>
                <TableCell><div className="h-4 bg-slate-200 rounded animate-pulse"></div></TableCell>
                <TableCell><div className="h-4 bg-slate-200 rounded animate-pulse"></div></TableCell>
                <TableCell><div className="h-4 bg-slate-200 rounded animate-pulse"></div></TableCell>
                <TableCell><div className="h-4 bg-slate-200 rounded animate-pulse"></div></TableCell>
                <TableCell><div className="h-4 bg-slate-200 rounded animate-pulse"></div></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <p>Nessun utente trovato</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Azienda</TableHead>
            <TableHead>Ruolo</TableHead>
            <TableHead>Data Registrazione</TableHead>
            <TableHead className="text-right">Azioni</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">
                {user.full_name || "N/A"}
              </TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                {user.company ? (
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{user.company.name}</span>
                    {!user.company.is_active && (
                      <Badge variant="secondary" className="w-fit">
                        Inattiva
                      </Badge>
                    )}
                  </div>
                ) : (
                  <span className="text-slate-400 italic">Nessuna azienda</span>
                )}
              </TableCell>
              <TableCell>
                {user.company ? (
                  <Badge 
                    variant={
                      user.company.role === 'owner' ? 'default' : 
                      user.company.role === 'admin' ? 'secondary' : 
                      'outline'
                    }
                  >
                    {user.company.role === 'owner' ? 'Proprietario' :
                     user.company.role === 'admin' ? 'Amministratore' :
                     'Membro'}
                  </Badge>
                ) : (
                  <span className="text-slate-400">-</span>
                )}
              </TableCell>
              <TableCell>
                {format(new Date(user.created_at), "dd/MM/yyyy")}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  {user.company ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEditAssignment(user)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRemoveFromCompany(user)}
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onAssignCompany(user)}
                    >
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
} 