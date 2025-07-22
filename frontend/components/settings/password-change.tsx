'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

interface PasswordRequirement {
  label: string
  test: (password: string) => boolean
}

const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  { label: 'Almeno 8 caratteri', test: (pwd) => pwd.length >= 8 },
  { label: 'Almeno una lettera maiuscola', test: (pwd) => /[A-Z]/.test(pwd) },
  { label: 'Almeno una lettera minuscola', test: (pwd) => /[a-z]/.test(pwd) },
  { label: 'Almeno un numero', test: (pwd) => /\d/.test(pwd) },
  { label: 'Almeno un carattere speciale', test: (pwd) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd) }
]

export function PasswordChange() {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [isChanging, setIsChanging] = useState(false)
  const { updatePassword } = useAuth()
  const { toast } = useToast()

  // Valida i requisiti della password
  const getPasswordStrength = (password: string) => {
    const passedRequirements = PASSWORD_REQUIREMENTS.filter(req => req.test(password))
    return {
      score: passedRequirements.length,
      total: PASSWORD_REQUIREMENTS.length,
      requirements: PASSWORD_REQUIREMENTS.map(req => ({
        ...req,
        passed: req.test(password)
      }))
    }
  }

  const passwordStrength = getPasswordStrength(formData.newPassword)
  const isPasswordValid = passwordStrength.score === passwordStrength.total
  const doPasswordsMatch = formData.newPassword === formData.confirmPassword && formData.confirmPassword !== ''

  // Gestisce il cambio di input
  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Toggle visibilità password
  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }))
  }

  // Gestisce il submit del form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isPasswordValid) {
      toast({
        title: 'Password non valida',
        description: 'La nuova password non soddisfa tutti i requisiti',
        variant: 'destructive'
      })
      return
    }

    if (!doPasswordsMatch) {
      toast({
        title: 'Password non corrispondenti',
        description: 'La conferma password non corrisponde alla nuova password',
        variant: 'destructive'
      })
      return
    }

    if (!formData.currentPassword) {
      toast({
        title: 'Password attuale richiesta',
        description: 'Inserisci la tua password attuale per confermare il cambio',
        variant: 'destructive'
      })
      return
    }

    setIsChanging(true)

    try {
      // Per ora simuliamo il cambio password
      // In futuro qui useremo updatePassword(formData.newPassword)
      await new Promise(resolve => setTimeout(resolve, 1500)) // Simula API call
      
      toast({
        title: 'Password aggiornata',
        description: 'La tua password è stata cambiata con successo'
      })

      // Reset del form
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error) {
      toast({
        title: 'Errore',
        description: 'Impossibile aggiornare la password. Riprova più tardi.',
        variant: 'destructive'
      })
    } finally {
      setIsChanging(false)
    }
  }

  // Reset del form
  const handleReset = () => {
    setFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Cambio Password
        </CardTitle>
        <CardDescription>
          Aggiorna la password del tuo account per mantenere la sicurezza
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Password Attuale */}
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Password Attuale *</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showPasswords.current ? 'text' : 'password'}
                value={formData.currentPassword}
                onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                placeholder="Inserisci la password attuale"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => togglePasswordVisibility('current')}
              >
                {showPasswords.current ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Nuova Password */}
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nuova Password *</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPasswords.new ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={(e) => handleInputChange('newPassword', e.target.value)}
                placeholder="Inserisci la nuova password"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => togglePasswordVisibility('new')}
              >
                {showPasswords.new ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Requisiti Password */}
            {formData.newPassword && (
              <div className="mt-3 space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Requisiti password ({passwordStrength.score}/{passwordStrength.total}):
                </p>
                <div className="grid grid-cols-1 gap-1">
                  {passwordStrength.requirements.map((req, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      {req.passed ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-gray-400" />
                      )}
                      <span className={req.passed ? 'text-green-700' : 'text-gray-500'}>
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Conferma Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Conferma Nuova Password *</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showPasswords.confirm ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                placeholder="Conferma la nuova password"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => togglePasswordVisibility('confirm')}
              >
                {showPasswords.confirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Feedback conferma password */}
            {formData.confirmPassword && (
              <div className="flex items-center gap-2 text-sm">
                {doPasswordsMatch ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-green-700">Le password corrispondono</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-red-700">Le password non corrispondono</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Alert informativo */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Dopo aver cambiato la password, dovrai effettuare nuovamente l'accesso su tutti i dispositivi.
            </AlertDescription>
          </Alert>

          {/* Pulsanti */}
          <div className="flex items-center gap-3 pt-4">
            <Button
              type="submit"
              disabled={!isPasswordValid || !doPasswordsMatch || !formData.currentPassword || isChanging}
            >
              {isChanging ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Aggiornamento...
                </>
              ) : (
                'Aggiorna Password'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={isChanging}
            >
              Annulla
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
