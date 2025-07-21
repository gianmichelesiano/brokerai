'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'
import { useBrokerProfile } from '@/hooks/use-broker-profile'
import { Loader2, User, Shield, Edit, Save, X, CheckCircle, AlertCircle, Plus } from 'lucide-react'

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    rui_number: ''
  })
  const { user } = useAuth()
  const { profile, isLoading, isSaving, loadProfile, saveProfile, createProfile } = useBrokerProfile()

  // Initialize form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        rui_number: profile.rui_number || ''
      })
    } else if (!isLoading) {
      // Profile doesn't exist, start in edit mode
      setIsEditing(true)
    }
  }, [profile, isLoading])

  // Load profile on mount
  useEffect(() => {
    loadProfile()
  }, [])

  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Handle save profile
  const handleSaveProfile = async () => {
    if (!formData.first_name || !formData.last_name || !formData.rui_number) {
      return
    }

    let result
    if (profile) {
      // Update existing profile
      result = await saveProfile(formData)
    } else {
      // Create new profile
      result = await createProfile(formData)
    }

    if (result?.success) {
      setIsEditing(false)
    }
  }

  // Handle edit mode toggle
  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing - reset form data
      setFormData({
        first_name: profile?.first_name || '',
        last_name: profile?.last_name || '',
        rui_number: profile?.rui_number || ''
      })
    }
    setIsEditing(!isEditing)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Caricamento profilo...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mio Profilo</h1>
          <p className="text-muted-foreground">
            Gestisci le informazioni del tuo profilo broker
          </p>
        </div>
        <Button
          onClick={handleEditToggle}
          variant={isEditing ? "outline" : "default"}
          disabled={isSaving}
        >
          {isEditing ? (
            <>
              <X className="h-4 w-4 mr-2" />
              Annulla
            </>
          ) : (
            <>
              <Edit className="h-4 w-4 mr-2" />
              Modifica
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Profile Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Stato Profilo
            </CardTitle>
            <CardDescription>
              Informazioni sullo stato del tuo profilo broker
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              {profile?.profile_complete ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-green-700 font-medium">Profilo Completo</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  <span className="text-yellow-700 font-medium">Profilo Incompleto</span>
                </>
              )}
            </div>
            
            {profile && (
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  <Shield className="h-3 w-3 mr-1" />
                  {profile.role}
                </Badge>
                <Badge variant={profile.is_active ? "default" : "destructive"}>
                  {profile.is_active ? "Attivo" : "Inattivo"}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profile Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Informazioni Personali</CardTitle>
            <CardDescription>
              I tuoi dati personali e professionali
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">Nome *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Inserisci il tuo nome"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="last_name">Cognome *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Inserisci il tuo cognome"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rui_number">Numero RUI *</Label>
              <Input
                id="rui_number"
                value={formData.rui_number}
                onChange={(e) => handleInputChange('rui_number', e.target.value)}
                disabled={!isEditing}
                placeholder="Inserisci il tuo numero RUI"
              />
              <p className="text-sm text-muted-foreground">
                RUI = Registro Unico degli Intermediari
              </p>
            </div>

            {isEditing && (
              <div className="flex items-center gap-2 pt-4">
                <Button
                  onClick={handleSaveProfile}
                  disabled={isSaving || !formData.first_name || !formData.last_name || !formData.rui_number}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvataggio...
                    </>
                  ) : (
                    <>
                      {profile ? (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Salva Modifiche
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Crea Profilo
                        </>
                      )}
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Information Card */}
        {user && (
          <Card>
            <CardHeader>
              <CardTitle>Informazioni Account</CardTitle>
              <CardDescription>
                Dati del tuo account di autenticazione
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user.email || ''} disabled />
              </div>
              
              <div className="space-y-2">
                <Label>ID Utente</Label>
                <Input value={user.id} disabled />
              </div>
              
              <div className="space-y-2">
                <Label>Data Ultimo Accesso</Label>
                <Input 
                  value={user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('it-IT') : 'Non disponibile'} 
                  disabled 
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 