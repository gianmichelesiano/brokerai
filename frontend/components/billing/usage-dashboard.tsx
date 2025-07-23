"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUsageLimits } from "@/hooks/use-usage-limits";
import { AlertTriangle, CheckCircle, Crown, Mail, Zap } from "lucide-react";
import Link from "next/link";

export function UsageDashboard() {
  const { plan_type, usage, limits, loading, error } = useUsageLimits();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Piano e Utilizzo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Piano e Utilizzo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-600">
            Errore nel caricamento dei dati: {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Protezione per usage undefined o mancante
  if (!usage || typeof usage !== 'object') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Piano e Utilizzo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-600">
            Dati di utilizzo non disponibili
          </div>
        </CardContent>
      </Card>
    );
  }

  const getPlanBadge = () => {
    switch (plan_type) {
      case 'free':
        return <Badge variant="secondary">Piano Gratuito</Badge>;
      case 'professional':
        return <Badge variant="default" className="bg-blue-600"><Crown className="w-3 h-3 mr-1" />Professionale</Badge>;
      case 'enterprise':
        return <Badge variant="default" className="bg-purple-600"><Zap className="w-3 h-3 mr-1" />Enterprise</Badge>;
      default:
        return <Badge variant="outline">Sconosciuto</Badge>;
    }
  };

  const getProgressColor = (used: number, limit: number) => {
    if (limit === -1) return "bg-green-500"; // Unlimited
    const percentage = (used / limit) * 100;
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 75) return "bg-yellow-500";
    return "bg-blue-500";
  };

  const getProgressPercentage = (used: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((used / limit) * 100, 100);
  };

  const isLimitReached = (used: number, limit: number) => {
    return limit !== -1 && used >= limit;
  };

  return (
    <div className="space-y-6">
      {/* Piano Attuale */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Piano Attuale
                {getPlanBadge()}
              </CardTitle>
              <CardDescription>
                Gestisci il tuo piano e monitora l'utilizzo
              </CardDescription>
            </div>
            {plan_type === 'free' && (
              <Link href="/pricing">
                <Button>
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade
                </Button>
              </Link>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Utilizzo Mensile */}
      <Card>
        <CardHeader>
          <CardTitle>Utilizzo Mensile</CardTitle>
          <CardDescription>
            Monitoraggio dell'utilizzo per il mese corrente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Analisi Polizze */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium">Analisi Polizze</span>
                {isLimitReached(usage.analyses_used || 0, limits.monthly_analyses) && (
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                )}
              </div>
              <span className="text-sm text-gray-600">
                {usage.analyses_used || 0} / {limits.monthly_analyses === -1 ? '∞' : limits.monthly_analyses}
              </span>
            </div>
            <Progress 
              value={getProgressPercentage(usage.analyses_used || 0, limits.monthly_analyses)}
              className="h-2"
            />
            {isLimitReached(usage.analyses_used || 0, limits.monthly_analyses) && (
              <p className="text-sm text-red-600">
                Limite mensile raggiunto. Effettua l'upgrade per continuare.
              </p>
            )}
          </div>

          {/* Compagnie Attive */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium">Compagnie Attive</span>
                {isLimitReached(usage.companies_active || 0, limits.max_companies) && (
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                )}
              </div>
              <span className="text-sm text-gray-600">
                {usage.companies_active || 0} / {limits.max_companies === -1 ? '∞' : limits.max_companies}
              </span>
            </div>
            <Progress 
              value={getProgressPercentage(usage.companies_active || 0, limits.max_companies)}
              className="h-2"
            />
            {isLimitReached(usage.companies_active || 0, limits.max_companies) && (
              <p className="text-sm text-red-600">
                Limite compagnie raggiunto. Effettua l'upgrade per aggiungerne altre.
              </p>
            )}
          </div>

          {/* Analisi AI (se disponibile) */}
          {limits.ai_analysis && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Analisi AI</span>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
                <span className="text-sm text-gray-600">
                  {usage.ai_analyses_used || 0} utilizzate
                </span>
              </div>
              <Progress value={0} className="h-2" />
              <p className="text-sm text-green-600">
                Analisi AI illimitate disponibili nel tuo piano.
              </p>
            </div>
          )}

          {/* Export Dati (se disponibile) */}
          {limits.export_data && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Export Generati</span>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
                <span className="text-sm text-gray-600">
                  {usage.exports_generated || 0} generati
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Funzionalità del Piano */}
      <Card>
        <CardHeader>
          <CardTitle>Funzionalità del Piano</CardTitle>
          <CardDescription>
            Cosa è incluso nel tuo piano attuale
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              {limits.ai_analysis ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
              )}
              <span className={limits.ai_analysis ? "text-green-700" : "text-gray-500"}>
                Analisi AI
              </span>
            </div>

            <div className="flex items-center gap-3">
              {limits.export_data ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
              )}
              <span className={limits.export_data ? "text-green-700" : "text-gray-500"}>
                Export Dati
              </span>
            </div>

            <div className="flex items-center gap-3">
              {limits.api_access ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
              )}
              <span className={limits.api_access ? "text-green-700" : "text-gray-500"}>
                Accesso API
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-blue-500" />
              <span className="text-blue-700">
                Support {limits.support_level === 'email' ? 'Email' : 
                        limits.support_level === 'priority' ? 'Prioritario' : 
                        'Dedicato'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Call to Action per Piano Gratuito */}
      {plan_type === 'free' && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Crown className="w-12 h-12 text-blue-600 mx-auto" />
              <h3 className="text-lg font-semibold text-blue-900">
                Sblocca tutto il potenziale di BrokerAI
              </h3>
              <p className="text-blue-700">
                Upgrade al piano Professionale per analisi illimitate, AI avanzata e molto altro.
              </p>
              <Link href="/pricing">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Visualizza Piani
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
