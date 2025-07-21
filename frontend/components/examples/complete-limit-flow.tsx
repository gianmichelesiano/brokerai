"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUsageLimits } from '@/hooks/use-usage-limits';
import { LimitReachedActions } from '@/components/billing/limit-reached-actions';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Brain, 
  Download, 
  Building2,
  AlertCircle,
  CheckCircle,
  ArrowDown
} from 'lucide-react';

export function CompleteLimitFlow() {
  const { 
    checkLimitWithNotification, 
    incrementUsage, 
    usage, 
    limits, 
    plan_type 
  } = useUsageLimits();
  
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [showLimitActions, setShowLimitActions] = useState<{
    show: boolean;
    limitType?: 'analyses' | 'ai_analyses' | 'exports' | 'companies';
    currentUsage?: number;
    limit?: number;
  }>({ show: false });

  // Simula analisi polizza con gestione completa del limite
  const handleAnalyzePolicy = async () => {
    setIsLoading('analyze');
    
    try {
      // 1. Controlla limiti PRIMA dell'azione
      const canAnalyze = await checkLimitWithNotification('analysis', 'analisi polizza');
      if (!canAnalyze) {
        setIsLoading(null);
        return;
      }

      // 2. Simula l'analisi
      console.log('🔄 Eseguendo analisi polizza...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 3. Incrementa utilizzo
      await incrementUsage('analyses');
      
      console.log('✅ Analisi completata con successo!');
      
      // 4. Controlla se abbiamo raggiunto il limite DOPO l'incremento
      const newUsage = usage.analyses_used + 1;
      if (newUsage >= limits.monthly_analyses && plan_type === 'free') {
        // Mostra le azioni disponibili per l'utente
        setShowLimitActions({
          show: true,
          limitType: 'analyses',
          currentUsage: newUsage,
          limit: limits.monthly_analyses
        });
      }
      
    } catch (error) {
      console.error('❌ Errore durante l\'analisi:', error);
      
      // Se l'errore è dovuto al limite raggiunto, mostra le azioni
      if (error instanceof Error && error.message.includes('limit reached')) {
        setShowLimitActions({
          show: true,
          limitType: 'analyses',
          currentUsage: usage.analyses_used,
          limit: limits.monthly_analyses
        });
      }
    } finally {
      setIsLoading(null);
    }
  };

  // Simula tentativo di analisi AI
  const handleAIAnalysis = async () => {
    setIsLoading('ai');
    
    try {
      const canUseAI = await checkLimitWithNotification('ai_analysis', 'analisi AI avanzata');
      if (!canUseAI) {
        // Mostra immediatamente le azioni per funzionalità non disponibile
        setShowLimitActions({
          show: true,
          limitType: 'ai_analyses',
          currentUsage: 0,
          limit: 0
        });
        setIsLoading(null);
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 1500));
      await incrementUsage('ai_analyses');
      console.log('🤖 Analisi AI completata!');
    } catch (error) {
      console.error('❌ Errore AI:', error);
    } finally {
      setIsLoading(null);
    }
  };

  const getUsageStatus = () => {
    const analysisPercentage = (usage.analyses_used / limits.monthly_analyses) * 100;
    const companiesPercentage = (usage.companies_active / limits.max_companies) * 100;
    
    return {
      analyses: {
        percentage: analysisPercentage,
        status: analysisPercentage >= 100 ? 'danger' : analysisPercentage >= 80 ? 'warning' : 'safe',
        color: analysisPercentage >= 100 ? 'text-red-600' : analysisPercentage >= 80 ? 'text-orange-600' : 'text-green-600'
      },
      companies: {
        percentage: companiesPercentage,
        status: companiesPercentage >= 100 ? 'danger' : companiesPercentage >= 80 ? 'warning' : 'safe',
        color: companiesPercentage >= 100 ? 'text-red-600' : companiesPercentage >= 80 ? 'text-orange-600' : 'text-green-600'
      }
    };
  };

  const status = getUsageStatus();

  return (
    <div className="space-y-6">
      {/* Header con stato utilizzo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Flusso Completo Gestione Limiti
          </CardTitle>
          <CardDescription>
            Testa il flusso completo: controllo → azione → incremento → gestione limite raggiunto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Analisi Polizze</span>
                <Badge variant={status.analyses.status === 'danger' ? 'destructive' : status.analyses.status === 'warning' ? 'secondary' : 'default'}>
                  {usage.analyses_used}/{limits.monthly_analyses}
                </Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    status.analyses.status === 'danger' ? 'bg-red-500' : 
                    status.analyses.status === 'warning' ? 'bg-orange-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(status.analyses.percentage, 100)}%` }}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Compagnie Attive</span>
                <Badge variant={status.companies.status === 'danger' ? 'destructive' : 'default'}>
                  {usage.companies_active}/{limits.max_companies}
                </Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    status.companies.status === 'danger' ? 'bg-red-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(status.companies.percentage, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pulsanti di test */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              Test Analisi Polizza
            </CardTitle>
            <CardDescription>
              Testa il flusso completo con controllo limiti
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={handleAnalyzePolicy}
              disabled={isLoading === 'analyze'}
              className="w-full"
              variant={usage.analyses_used >= limits.monthly_analyses ? "outline" : "default"}
            >
              {isLoading === 'analyze' ? 'Analizzando...' : 'Analizza Polizza'}
            </Button>
            
            <div className="text-sm space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>1. Controllo limiti preventivo</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>2. Esecuzione analisi</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>3. Incremento utilizzo</span>
              </div>
              <div className="flex items-center gap-2">
                <ArrowDown className="h-4 w-4 text-orange-500" />
                <span>4. Gestione limite raggiunto</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Brain className="h-5 w-5" />
              Test Funzionalità Premium
            </CardTitle>
            <CardDescription>
              Testa funzionalità non disponibile nel piano gratuito
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={handleAIAnalysis}
              disabled={isLoading === 'ai'}
              variant="outline"
              className="w-full"
            >
              {isLoading === 'ai' ? 'Analizzando...' : '🤖 Analisi AI'}
            </Button>
            
            <div className="text-sm space-y-1">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                <span>Funzionalità Premium</span>
              </div>
              <div className="flex items-center gap-2">
                <ArrowDown className="h-4 w-4 text-orange-500" />
                <span>Mostra opzioni upgrade</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Componente azioni limite raggiunto */}
      {showLimitActions.show && showLimitActions.limitType && (
        <LimitReachedActions
          limitType={showLimitActions.limitType}
          currentUsage={showLimitActions.currentUsage || 0}
          limit={showLimitActions.limit || 0}
          planType={plan_type}
          onDismiss={() => setShowLimitActions({ show: false })}
        />
      )}

      {/* Istruzioni */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">📋 Flusso Completo</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700 space-y-3">
          <div>
            <h4 className="font-semibold mb-2">🔄 Quando l'utente clicca "Analizza Polizza":</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li><strong>Controllo preventivo:</strong> Verifica se può fare l'azione</li>
              <li><strong>Esecuzione:</strong> Se permesso, esegue l'analisi</li>
              <li><strong>Incremento:</strong> Aggiorna il contatore utilizzo</li>
              <li><strong>Controllo post-azione:</strong> Se limite raggiunto, mostra opzioni</li>
            </ol>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">⚡ Opzioni mostrate all'utente:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><strong>Upgrade (Raccomandato):</strong> Pulsante diretto a /pricing</li>
              <li><strong>Aspetta Reset:</strong> Per limiti mensili (1° del mese)</li>
              <li><strong>Gestisci Risorse:</strong> Per compagnie (rimuovi per aggiungere)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
