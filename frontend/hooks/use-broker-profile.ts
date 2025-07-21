import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'

interface BrokerProfile {
  id: string
  first_name: string
  last_name: string
  rui_number: string
  role: string
  is_active: boolean
  profile_complete?: boolean
}

interface ProfileFormData {
  first_name: string
  last_name: string
  rui_number: string
}

export function useBrokerProfile() {
  const [profile, setProfile] = useState<BrokerProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  // Load profile data
  const loadProfile = async () => {
    try {
      setIsLoading(true)

      const response = await fetch('/api/v1/brokers/me', {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        if (response.status === 404) {
          // Profile doesn't exist yet
          setProfile(null)
          return { success: true, profile: null }
        }
        throw new Error('Errore nel caricamento del profilo')
      }

      const data = await response.json()
      if (data.success && data.broker) {
        setProfile(data.broker)
        return { success: true, profile: data.broker }
      } else {
        throw new Error(data.error || 'Errore nel caricamento del profilo')
      }
    } catch (error) {
      console.error('Errore nel caricamento del profilo:', error)
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Impossibile caricare il profilo",
        variant: "destructive"
      })
      return { success: false, error }
    } finally {
      setIsLoading(false)
    }
  }

  // Save profile data
  const saveProfile = async (formData: ProfileFormData) => {
    try {
      setIsSaving(true)

      const response = await fetch('/api/v1/brokers/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Errore nel salvataggio del profilo')
      }

      const data = await response.json()
      if (data.success && data.broker) {
        setProfile(data.broker)
        toast({
          title: "Successo",
          description: "Profilo aggiornato con successo"
        })
        return { success: true, profile: data.broker }
      } else {
        throw new Error(data.error || 'Errore nel salvataggio del profilo')
      }
    } catch (error) {
      console.error('Errore nel salvataggio del profilo:', error)
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Impossibile salvare il profilo",
        variant: "destructive"
      })
      return { success: false, error }
    } finally {
      setIsSaving(false)
    }
  }

  // Create new profile (if it doesn't exist)
  const createProfile = async (formData: ProfileFormData) => {
    try {
      setIsSaving(true)

      const response = await fetch('/api/v1/brokers/me', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Errore nella creazione del profilo')
      }

      const data = await response.json()
      if (data.success && data.broker) {
        setProfile(data.broker)
        toast({
          title: "Successo",
          description: "Profilo creato con successo"
        })
        return { success: true, profile: data.broker }
      } else {
        throw new Error(data.error || 'Errore nella creazione del profilo')
      }
    } catch (error) {
      console.error('Errore nella creazione del profilo:', error)
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Impossibile creare il profilo",
        variant: "destructive"
      })
      return { success: false, error }
    } finally {
      setIsSaving(false)
    }
  }

  // Refresh profile data
  const refreshProfile = () => {
    loadProfile()
  }

  return {
    profile,
    isLoading,
    isSaving,
    loadProfile,
    saveProfile,
    createProfile,
    refreshProfile
  }
} 