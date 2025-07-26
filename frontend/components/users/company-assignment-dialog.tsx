"use client"

import React, { useState, useEffect } from "react"
import { User, Company, getCompanies, assignUserToCompany, removeUserFromCompany } from "@/lib/api/users"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Building2, User as UserIcon } from "lucide-react"

interface CompanyAssignmentDialogProps {
  user: User | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export const CompanyAssignmentDialog: React.FC<CompanyAssignmentDialogProps> = ({
  user,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("none")
  const [selectedRole, setSelectedRole] = useState<string>("member")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false)
  const { toast } = useToast()

  // Load companies when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadCompanies()
      // Set current values if user has a company
      if (user?.company) {
        setSelectedCompanyId(user.company.id)
        setSelectedRole(user.company.role)
      } else {
        setSelectedCompanyId("none")
        setSelectedRole("member")
      }
    }
  }, [isOpen, user])

  const loadCompanies = async () => {
    try {
      setIsLoadingCompanies(true)
      const response = await getCompanies()
      setCompanies(response.companies)
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile caricare le aziende",
        variant: "destructive"
      })
    } finally {
      setIsLoadingCompanies(false)
    }
  }

  const handleSave = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      
      if (selectedCompanyId && selectedCompanyId !== "none") {
        // Assign to company
        await assignUserToCompany(user.id, {
          company_id: selectedCompanyId,
          role: selectedRole
        })
        toast({
          title: "Successo",
          description: "Utente assegnato all'azienda con successo"
        })
      } else {
        // Remove from company
        await removeUserFromCompany(user.id)
        toast({
          title: "Successo", 
          description: "Utente rimosso dall'azienda con successo"
        })
      }
      
      onSuccess()
      onClose()
    } catch (error) {
      toast({
        title: "Errore",
        description: "Errore durante l'aggiornamento dell'assegnazione",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemove = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      await removeUserFromCompany(user.id)
      toast({
        title: "Successo",
        description: "Utente rimosso dall'azienda con successo"
      })
      onSuccess()
      onClose()
    } catch (error) {
      toast({
        title: "Errore",
        description: "Errore durante la rimozione dell'utente",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner': return 'Proprietario'
      case 'admin': return 'Amministratore' 
      case 'member': return 'Membro'
      default: return role
    }
  }

  const selectedCompany = companies.find(c => c.id === selectedCompanyId)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            Gestione Azienda Utente
          </DialogTitle>
          <DialogDescription>
            Modifica l'assegnazione dell'utente ad un'azienda
          </DialogDescription>
        </DialogHeader>

        {user && (
          <div className="space-y-6">
            {/* User Info */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                <UserIcon className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="font-medium">{user.full_name || "N/A"}</p>
                <p className="text-sm text-slate-600">{user.email}</p>
              </div>
            </div>

            {/* Current Assignment */}
            {user.company && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Assegnazione Corrente</Label>
                <div className="flex items-center gap-2 p-2 bg-blue-50 rounded border-l-4 border-blue-200">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">{user.company.name}</span>
                  <Badge variant="outline">{getRoleLabel(user.company.role)}</Badge>
                </div>
              </div>
            )}

            {/* Company Selection */}
            <div className="space-y-2">
              <Label htmlFor="company">Azienda</Label>
              <Select
                value={selectedCompanyId}
                onValueChange={setSelectedCompanyId}
                disabled={isLoadingCompanies}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    isLoadingCompanies ? "Caricamento..." : "Seleziona azienda"
                  } />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-slate-500 italic">Nessuna azienda</span>
                  </SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {company.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Role Selection (only if company selected) */}
            {selectedCompanyId && selectedCompanyId !== "none" && (
              <div className="space-y-2">
                <Label htmlFor="role">Ruolo</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Membro</SelectItem>
                    <SelectItem value="admin">Amministratore</SelectItem>
                    <SelectItem value="owner">Proprietario</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Preview */}
            {selectedCompany && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Anteprima</Label>
                <div className="flex items-center gap-2 p-2 bg-green-50 rounded border-l-4 border-green-200">
                  <Building2 className="h-4 w-4 text-green-600" />
                  <span className="font-medium">{selectedCompany.name}</span>
                  <Badge variant="outline">{getRoleLabel(selectedRole)}</Badge>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex gap-2">
          {user?.company && (
            <Button
              variant="destructive"
              onClick={handleRemove}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Rimuovi da Azienda
            </Button>
          )}
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Annulla
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salva
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}