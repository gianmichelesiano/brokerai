"use client"

import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Search, Edit, Trash2, Building, Calendar, Users, Crown, Shield, UserPlus, Settings } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Company {
  id: string
  name: string
  slug: string
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

interface CompanyWithUserRole extends Company {
  user_role: "owner" | "admin" | "member" | "viewer"
  joined_at: string
  is_user_active: boolean
}

interface CompanyList {
  items: Company[]
  total: number
  page: number
  size: number
  pages: number
}

interface CompanyMember {
  id: string
  user_id: string
  company_id: string
  role: "owner" | "admin" | "member" | "viewer"
  joined_at: string
  is_active: boolean
  user_email: string | null
  user_full_name: string | null
}

interface CompanyMemberList {
  company_id: string
  company_name: string
  members: CompanyMember[]
  total_members: number
  owners: number
  admins: number
  members_count: number
  viewers: number
}

const API_BASE_URL = `${process.env.NEXT_PUBLIC_BASE_URL}/api/companies`

export default function CompanyPage() {
  const [myCompanies, setMyCompanies] = useState<CompanyWithUserRole[]>([])
  const [allCompanies, setAllCompanies] = useState<Company[]>([])
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null)
  const [companyMembers, setCompanyMembers] = useState<CompanyMemberList | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [formData, setFormData] = useState({ name: "", description: "" })
  const [activeTab, setActiveTab] = useState<"my-companies" | "all-companies" | "current-company" | "members">("my-companies")
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Fetch my companies
  const fetchMyCompanies = async () => {
    try {
      const data: CompanyWithUserRole[] = await apiGet<CompanyWithUserRole[]>(`${API_BASE_URL}/users/me/companies`)
      setMyCompanies(data)
      
      // Check if user is super admin (has owner role in any company)
      const hasOwnerRole = data.some(company => company.user_role === "owner")
      setIsSuperAdmin(hasOwnerRole)
      
      // Set current company (first one or the one with owner role)
      const ownerCompany = data.find(company => company.user_role === "owner")
      const firstCompany = data[0]
      if (ownerCompany) {
        setCurrentCompany(ownerCompany)
        fetchCompanyMembers(ownerCompany.id)
      } else if (firstCompany) {
        setCurrentCompany(firstCompany)
        fetchCompanyMembers(firstCompany.id)
      }
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile caricare le tue companies",
        variant: "destructive"
      })
    }
  }

  // Fetch all companies (super admin only)
  const fetchAllCompanies = async (page = 1, search = "") => {
    if (!isSuperAdmin) return
    
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        size: "10"
      })
      
      if (search) {
        params.append("search", search)
      }

      const data: CompanyList = await apiGet<CompanyList>(`${API_BASE_URL}/?${params}`)
      setAllCompanies(data.items)
      setTotalPages(data.pages)
      setCurrentPage(data.page)
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile caricare tutte le companies",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Fetch company members
  const fetchCompanyMembers = async (companyId: string) => {
    try {
      const data: CompanyMemberList = await apiGet<CompanyMemberList>(`${API_BASE_URL}/me/members`)
      setCompanyMembers(data)
    } catch (error) {
      console.error("Errore nel caricamento dei membri:", error)
    }
  }

  // Create company
  const createCompany = async () => {
    try {
      const newCompany: Company = await apiPost(API_BASE_URL, formData)
      
      toast({
        title: "Successo",
        description: "Company creata con successo"
      })
      
      setIsCreateDialogOpen(false)
      setFormData({ name: "", description: "" })
      fetchMyCompanies()
      if (isSuperAdmin) {
        fetchAllCompanies(currentPage, searchTerm)
      }
    } catch (error) {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Errore nella creazione",
        variant: "destructive"
      })
    }
  }

  // Update company
  const updateCompany = async () => {
    if (!editingCompany) return
    
    try {
      const updatedCompany: Company = await apiPut(`${API_BASE_URL}/${editingCompany.id}`, formData)
      
      toast({
        title: "Successo",
        description: "Company aggiornata con successo"
      })
      
      setIsEditDialogOpen(false)
      setEditingCompany(null)
      setFormData({ name: "", description: "" })
      fetchMyCompanies()
      if (isSuperAdmin) {
        fetchAllCompanies(currentPage, searchTerm)
      }
    } catch (error) {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Errore nell'aggiornamento",
        variant: "destructive"
      })
    }
  }

  // Delete company
  const deleteCompany = async (id: string, name: string) => {
    if (!confirm(`Sei sicuro di voler eliminare la company "${name}"?`)) return
    
    try {
      await apiDelete(`${API_BASE_URL}/${id}`)
      
      toast({
        title: "Successo",
        description: "Company eliminata con successo"
      })
      
      fetchMyCompanies()
      if (isSuperAdmin) {
        fetchAllCompanies(currentPage, searchTerm)
      }
    } catch (error) {
      toast({
        title: "Errore",
        description: "Errore nell'eliminazione della company",
        variant: "destructive"
      })
    }
  }

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
    if (isSuperAdmin) {
      fetchAllCompanies(1, value)
    }
  }

  // Open edit dialog
  const openEditDialog = (company: Company) => {
    setEditingCompany(company)
    setFormData({
      name: company.name,
      description: company.description || ""
    })
    setIsEditDialogOpen(true)
  }

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

  // Get role badge variant
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "owner": return "default"
      case "admin": return "secondary"
      case "member": return "outline"
      case "viewer": return "outline"
      default: return "outline"
    }
  }

  // Get role icon
  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner": return <Crown className="h-3 w-3" />
      case "admin": return <Shield className="h-3 w-3" />
      case "member": return <Users className="h-3 w-3" />
      case "viewer": return <Users className="h-3 w-3" />
      default: return <Users className="h-3 w-3" />
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await fetchMyCompanies()
      setLoading(false)
    }
    loadData()
  }, [])

  useEffect(() => {
    if (isSuperAdmin && activeTab === "all-companies") {
      fetchAllCompanies()
    }
  }, [isSuperAdmin, activeTab])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestione Companies</h1>
          <p className="text-muted-foreground">
            Gestisci le tue companies e i membri del team
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuova Company
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crea Nuova Company</DialogTitle>
              <DialogDescription>
                Inserisci i dettagli per la nuova company
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Es. La Mia Company"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Descrizione</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrizione della company..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Annulla
              </Button>
              <Button onClick={createCompany} disabled={!formData.name.trim()}>
                Crea Company
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
        <Button
          variant={activeTab === "my-companies" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("my-companies")}
        >
          <Building className="mr-2 h-4 w-4" />
          Le Mie Companies
        </Button>
        {currentCompany && (
          <Button
            variant={activeTab === "current-company" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("current-company")}
          >
            <Settings className="mr-2 h-4 w-4" />
            Company Corrente
          </Button>
        )}
        {currentCompany && (
          <Button
            variant={activeTab === "members" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("members")}
          >
            <Users className="mr-2 h-4 w-4" />
            Membri
          </Button>
        )}
        {isSuperAdmin && (
          <Button
            variant={activeTab === "all-companies" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("all-companies")}
          >
            <Crown className="mr-2 h-4 w-4" />
            Tutte le Companies
          </Button>
        )}
      </div>

      {/* My Companies Tab */}
      {activeTab === "my-companies" && (
        <Card>
          <CardHeader>
            <CardTitle>Le Mie Companies</CardTitle>
            <CardDescription>
              Companies di cui fai parte e il tuo ruolo
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Caricamento...</div>
            ) : myCompanies.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Non fai parte di nessuna company
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {myCompanies.map((company) => (
                  <Card key={company.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{company.name}</CardTitle>
                        <Badge variant={getRoleBadgeVariant(company.user_role)} className="flex items-center gap-1">
                          {getRoleIcon(company.user_role)}
                          {company.user_role}
                        </Badge>
                      </div>
                      {company.description && (
                        <CardDescription className="line-clamp-2">
                          {company.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Membro dal: {formatDate(company.joined_at)}</span>
                        <Badge variant={company.is_active ? "default" : "secondary"}>
                          {company.is_active ? "Attivo" : "Inattivo"}
                        </Badge>
                      </div>
                      {company.user_role === "owner" && (
                        <div className="flex gap-2 mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(company)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Modifica
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteCompany(company.id, company.name)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Elimina
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Current Company Tab */}
      {activeTab === "current-company" && currentCompany && (
        <Card>
          <CardHeader>
            <CardTitle>Company Corrente: {currentCompany.name}</CardTitle>
            <CardDescription>
              Dettagli e impostazioni della company corrente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Nome</Label>
                  <p className="text-lg">{currentCompany.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Slug</Label>
                  <p className="text-sm text-muted-foreground">{currentCompany.slug}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Descrizione</Label>
                  <p className="text-sm text-muted-foreground">
                    {currentCompany.description || "Nessuna descrizione"}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Stato</Label>
                  <div className="mt-1">
                    <Badge variant={currentCompany.is_active ? "default" : "secondary"}>
                      {currentCompany.is_active ? "Attiva" : "Inattiva"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Creata il</Label>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(currentCompany.created_at)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Ultima modifica</Label>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(currentCompany.updated_at)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Members Tab */}
      {activeTab === "members" && companyMembers && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Membri di {companyMembers.company_name}</CardTitle>
                <CardDescription>
                  Gestisci i membri e i loro ruoli nella company
                </CardDescription>
              </div>
              <Button variant="outline">
                <UserPlus className="mr-2 h-4 w-4" />
                Invita Membro
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Members Stats */}
            <div className="grid gap-4 md:grid-cols-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{companyMembers.total_members}</div>
                  <p className="text-xs text-muted-foreground">Totale Membri</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{companyMembers.owners}</div>
                  <p className="text-xs text-muted-foreground">Proprietari</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{companyMembers.admins}</div>
                  <p className="text-xs text-muted-foreground">Amministratori</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{companyMembers.members_count}</div>
                  <p className="text-xs text-muted-foreground">Membri</p>
                </CardContent>
              </Card>
            </div>

            {/* Members Table */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utente</TableHead>
                  <TableHead>Ruolo</TableHead>
                  <TableHead>Membro dal</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companyMembers.members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {member.user_full_name || "Nome non disponibile"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {member.user_email || "Email non disponibile"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(member.role)} className="flex items-center gap-1 w-fit">
                        {getRoleIcon(member.role)}
                        {member.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatDate(member.joined_at)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={member.is_active ? "default" : "secondary"}>
                        {member.is_active ? "Attivo" : "Inattivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* All Companies Tab (Super Admin Only) */}
      {activeTab === "all-companies" && isSuperAdmin && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Tutte le Companies</CardTitle>
                <CardDescription>
                  Visualizza e gestisci tutte le companies del sistema (Super Admin)
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cerca companies..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-8 w-[300px]"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Caricamento...</div>
            ) : allCompanies.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? "Nessuna company trovata" : "Nessuna company presente"}
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Descrizione</TableHead>
                      <TableHead>Stato</TableHead>
                      <TableHead>Creata il</TableHead>
                      <TableHead className="text-right">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allCompanies.map((company) => (
                      <TableRow key={company.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-2">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            <span>{company.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-sm bg-muted px-2 py-1 rounded">
                            {company.slug}
                          </code>
                        </TableCell>
                        <TableCell>
                          {company.description ? (
                            <div className="max-w-[300px] truncate" title={company.description}>
                              {company.description}
                            </div>
                          ) : (
                            <Badge variant="secondary">Nessuna descrizione</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={company.is_active ? "default" : "secondary"}>
                            {company.is_active ? "Attiva" : "Inattiva"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatDate(company.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(company)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteCompany(company.id, company.name)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center space-x-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newPage = currentPage - 1
                        setCurrentPage(newPage)
                        fetchAllCompanies(newPage, searchTerm)
                      }}
                      disabled={currentPage <= 1}
                    >
                      Precedente
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Pagina {currentPage} di {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newPage = currentPage + 1
                        setCurrentPage(newPage)
                        fetchAllCompanies(newPage, searchTerm)
                      }}
                      disabled={currentPage >= totalPages}
                    >
                      Successiva
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica Company</DialogTitle>
            <DialogDescription>
              Modifica i dettagli della company
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nome *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Es. La Mia Company"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Descrizione</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrizione della company..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={updateCompany} disabled={!formData.name.trim()}>
              Salva Modifiche
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
