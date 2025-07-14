'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const supabase = createClient()

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    if (!email) {
      setError('Inserisci il tuo indirizzo email')
      setLoading(false)
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Inserisci un indirizzo email valido')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        setError(error.message)
      } else {
        setMessage('Ti abbiamo inviato un link per reimpostare la password. Controlla la tua email.')
        setEmailSent(true)
      }
    } catch (err) {
      setError('Si è verificato un errore durante l\'invio dell\'email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Password dimenticata?
          </CardTitle>
          <CardDescription className="text-center">
            {emailSent 
              ? 'Controlla la tua email per il link di reset'
              : 'Inserisci il tuo indirizzo email per ricevere il link di reset'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {message && (
            <Alert>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {!emailSent ? (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="nome@esempio.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Invio in corso...
                  </>
                ) : (
                  'Invia link di reset'
                )}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="text-center text-sm text-muted-foreground">
                Se non ricevi l'email entro qualche minuto, controlla la cartella spam o riprova.
              </div>
              
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setEmailSent(false)
                  setMessage('')
                  setError('')
                }}
              >
                Invia di nuovo
              </Button>
            </div>
          )}

          <div className="text-center">
            <Link
              href="/auth/login"
              className="inline-flex items-center text-sm font-medium text-primary hover:underline"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Torna al login
            </Link>
          </div>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Non hai un account? </span>
            <Link
              href="/auth/register"
              className="font-medium text-primary hover:underline"
            >
              Registrati
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
