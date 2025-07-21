'use client';

import { useCustomer, usePlanLimits } from '@/hooks/useAutumnCustomer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CreditCard, 
  Calendar, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Settings,
  Zap,
  Star,
  Crown
} from 'lucide-react';

export default function SubscriptionStatus() {
  const { customer, isLoading } = useCustomer();
  const { currentPlan, limits, getRemainingUsage, isSubscribed } = usePlanLimits();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-8 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'free': return <Zap className="h-5 w-5 text-blue-500" />;
      case 'professional': return <Star className="h-5 w-5 text-yellow-500" />;
      case 'enterprise': return <Crown className="h-5 w-5 text-purple-500" />;
      default: return <Zap className="h-5 w-5" />;
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'free': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'professional': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'enterprise': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const analysesRemaining = getRemainingUsage('analyses');
  const companiesRemaining = getRemainingUsage('companies');
  
  const analysesUsagePercent = limits.monthly_analyses === -1 ? 0 : 
    ((limits.monthly_analyses - analysesRemaining) / limits.monthly_analyses) * 100;
  
  const companiesUsagePercent = limits.max_companies === -1 ? 0 : 
    ((limits.max_companies - companiesRemaining) / limits.max_companies) * 100;

  return (
    <div className="space-y-6">
      {/* Piano Corrente */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Piano Corrente</CardTitle>
          {getPlanIcon(currentPlan)}
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold capitalize">{currentPlan}</div>
              <Badge className={getPlanColor(currentPlan)}>
                {isSubscribed ? 'Attivo' : 'Gratuito'}
              </Badge>
            </div>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Gestisci
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Utilizzo */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Analisi Polizze */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Analisi Polizze</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analysesRemaining === -1 ? '∞' : analysesRemaining}
            </div>
            <p className="text-xs text-muted-foreground">
              {limits.monthly_analyses === -1 ? 'Illimitate' : `di ${limits.monthly_analyses} questo mese`}
            </p>
            {limits.monthly_analyses !== -1 && (
              <div className="mt-2">
                <Progress value={analysesUsagePercent} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Compagnie Attive */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compagnie Attive</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {companiesRemaining === -1 ? '∞' : companiesRemaining}
            </div>
            <p className="text-xs text-muted-foreground">
              {limits.max_companies === -1 ? 'Illimitate' : `di ${limits.max_companies} disponibili`}
            </p>
            {limits.max_companies !== -1 && (
              <div className="mt-2">
                <Progress value={companiesUsagePercent} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Features Disponibili */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Features Disponibili</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">AI Analysis</span>
            {limits.ai_analysis ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Export Dati</span>
            {limits.export_data ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">API Access</span>
            {limits.api_access ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upgrade CTA per piano gratuito */}
      {currentPlan === 'free' && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Star className="h-4 w-4 text-primary" />
              Sblocca il Potenziale Completo
            </CardTitle>
            <CardDescription>
              Passa a Professional per analisi illimitate e features avanzate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">
              <CreditCard className="h-4 w-4 mr-2" />
              Upgrade a Professional
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
