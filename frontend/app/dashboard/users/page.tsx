"use client"

import React, { useState, useEffect } from "react"
import { User, getUsers } from "@/lib/api/users"
import { UsersTable } from "@/components/users/users-table"
import { CompanyAssignmentDialog } from "@/components/users/company-assignment-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  
  // Dialog states
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false)
  
  const { toast } = useToast()

  // Load users
  const loadUsers = async () => {
    try {
      setIsLoading(true)
      const response = await getUsers(1, 100, searchTerm || undefined)
      setUsers(response.users)
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile caricare gli utenti",
        variant: "destructive"
      })
      setUsers([])
    } finally {
      setIsLoading(false)
    }
  }

  // Filter users based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredUsers(users)
    } else {
      const filtered = users.filter((user) =>
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.company?.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredUsers(filtered)
    }
  }, [users, searchTerm])

  // Load users on mount and when refresh trigger changes
  useEffect(() => {
    loadUsers()
  }, [refreshTrigger])

  // Handle refresh
  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  // Handle success operations
  const handleSuccess = () => {
    handleRefresh()
  }

  // Handle assign company
  const handleAssignCompany = (user: User) => {
    setSelectedUser(user)
    setIsAssignmentDialogOpen(true)
  }

  // Handle edit assignment
  const handleEditAssignment = (user: User) => {
    setSelectedUser(user)
    setIsAssignmentDialogOpen(true)
  }

  // Handle remove from company
  const handleRemoveFromCompany = (user: User) => {
    setSelectedUser(user)
    setIsAssignmentDialogOpen(true)
  }

  // Close dialogs
  const closeDialogs = () => {
    setSelectedUser(null)
    setIsAssignmentDialogOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 font-display">Gestione Utenti</h1>
          <p className="text-slate-600 mt-1">Gestisci gli utenti e le loro assegnazioni aziendali</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Aggiorna
          </Button>
        </div>
      </div>

      {/* Filtri */}
      <Card>
        <CardHeader>
          <CardTitle>Filtri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Cerca utenti per nome, email o azienda..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabella Utenti */}
      <Card>
        <CardHeader>
          <CardTitle>Utenti Registrati</CardTitle>
          <CardDescription>
            Lista di tutti gli utenti registrati nel sistema
            {filteredUsers.length !== users.length && (
              <span className="ml-2 text-sm">
                ({filteredUsers.length} di {users.length} mostrati)
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UsersTable
            users={filteredUsers}
            isLoading={isLoading}
            onAssignCompany={handleAssignCompany}
            onEditAssignment={handleEditAssignment}
            onRemoveFromCompany={handleRemoveFromCompany}
          />
        </CardContent>
      </Card>

      {/* Dialog */}
      <CompanyAssignmentDialog
        user={selectedUser}
        isOpen={isAssignmentDialogOpen}
        onClose={closeDialogs}
        onSuccess={handleSuccess}
      />
    </div>
  )
} 