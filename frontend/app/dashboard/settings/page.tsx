'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { PasswordChange } from '@/components/settings/password-change'
import { UsageDashboard } from '@/components/billing/usage-dashboard'
import { Settings, User, CreditCard } from 'lucide-react'
import Link from 'next/link'

export default function SettingsPage() {
  const { user } = useAuth()

  // Ottieni le informazioni dell'utente
  const getUserDisplayName = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name
    }
    if (user?.email) {
      return user.email.split('@')[0]
    }
    return 'Utente'
  }

  const formatLastSignIn = () => {
    if (user?.last_sign_in_at) {
      return new Date(user.last_sign_in_at).toLocaleString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
    return 'Non disponibile'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Impostazioni</h1>
          <p className="text-muted-foreground">
            Gestisci il tuo account, la sicurezza e il piano di abbonamento
          </p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-1">
          <Settings className="h-3 w-3" />
          v1.0.0
        </Badge>
      </div>

      {/* Informazioni Account */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informazioni Account
          </CardTitle>
          <CardDescription>
            Visualizza e gestisci le informazioni del tuo account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Nome Utente</label>
              <p className="text-sm font-medium">{getUserDisplayName()}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <p className="text-sm font-medium">{user?.email || 'Non disponibile'}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">ID Utente</label>
              <p className="text-sm font-mono text-xs bg-muted p-2 rounded">
                {user?.id || 'Non disponibile'}
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Ultimo Accesso</label>
              <p className="text-sm font-medium">{formatLastSignIn()}</p>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium">Profilo Broker</h4>
                <p className="text-sm text-muted-foreground">
                  Completa il tuo profilo broker per accedere a tutte le funzionalità
                </p>
              </div>
              <Link href="/dashboard/profile">
                <Button variant="outline" size="sm">
                  Gestisci Profilo
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cambio Password */}
      <PasswordChange />

      {/* Piano & Fatturazione */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Piano & Fatturazione
          </CardTitle>
          <CardDescription>
            Monitora il tuo utilizzo e gestisci il piano di abbonamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UsageDashboard />
        </CardContent>
      </Card>

      {/* Link Rapidi */}
      <Card>
        <CardHeader>
          <CardTitle>Link Rapidi</CardTitle>
          <CardDescription>
            Accesso rapido alle sezioni più utilizzate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/dashboard/profile">
              <Button variant="outline" className="w-full justify-start">
                <User className="h-4 w-4 mr-2" />
                Gestisci Profilo
              </Button>
            </Link>
            <Link href="/dashboard/support">
              <Button variant="outline" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-2" />
                Supporto & FAQ
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="outline" className="w-full justify-start">
                <CreditCard className="h-4 w-4 mr-2" />
                Piani & Prezzi
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
