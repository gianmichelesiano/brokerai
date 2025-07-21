"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUsageLimits } from '@/hooks/use-usage-limits';
import { UpgradeDialog } from '@/components/billing/upgrade-notification';
import { 
  FileText, 
  Brain, 
  Download, 
  Building2, 
  Zap,
  Crown,
  TrendingUp
} from 'lucide-react';

export function UpgradeDemo() {
  const { 
    checkLimitWithNotification, 
    incrementUsage, 
    usage, 
    limits, 
    plan_type 
  } = useUsageLimits();
  
  const [showDialog, setShowDialog] = useState(false);
  const [isLoading, setIsLoading] = useState<string | null>(null);

  // Simula analisi polizza
  const handleAnalyzePolicy = async () => {
    setIsLoading('analyze');
    
    // 1. Controlla limiti con notifica upgrade
    const canAnalyze = await checkLimitWithNotification('analysis', 'analisi polizza');
    if (!canAnalyze) {
      setIsLoading(null);
      return;
    }

    try {
      // 2. Simula l'analisi
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 3. Incrementa utilizzo (con notifica upgrade se limite raggiunto)
      await incrementUsage('analyses');
      
      console.log('✅ Analisi completata con successo!');
    } catch (error) {
      console.error('❌ Errore durante l\'analisi:', error);
    } finally {
      setIsLoading(null);
    }
  };

  // Simula analisi AI
  const handleAIAnalysis = async () => {
    setIsLoading('ai');
    
    const canUseAI = await checkLimitWithNotification('ai_analysis', 'analisi AI avanzata');
    if (!canUseAI) {
      setIsLoading(null);
      return;
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      await incrementUsage('ai_analyses');
      console.log('🤖 Analisi AI completata!');
    } catch (error) {
      console.error('❌ Errore AI:', error);
    } finally {
      setIsLoading(null);
    }
  };

  // Simula export dati
  const handleExportData = async () => {
    setIsLoading('export');
    
    const canExport = await checkLimitWithNotification('export', 'export dati');
    if (!canExport) {
      setIsLoading(null);
      return;
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await incrementUsage('exports');
      console.log('📊 Export completato!');
    } catch (error) {
      console.error('❌ Errore export:', error);
    } finally {
      setIsLoading(null);
    }
  };

  // Simula aggiunta compagnia
  const handleAddCompany = async () => {
    setIsLoading('company');
    
    const canAdd = await checkLimitWithNotification('add_company', 'aggiunta compagnia');
    if (!canAdd) {
      setIsLoading(null);
      return;
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      console.log('🏢 Compagnia aggiunta!');
    } catch (error) {
      console.error('❌ Errore aggiunta compagnia:', error);
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header con stato piano */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {plan_type === 'free' ? (
              <Zap className="h-5 w-5 text-blue-500" />
            ) : (
              <Crown className="h-5 w-5 text-yellow-500" />
            )}
            Demo Sistema Notifiche Upgrade
          </CardTitle>
          <CardDescription>
            Piano attuale: <span className="font-semibold capitalize">{plan_type}</span>
            {plan_type === 'free' && (
              <span className="ml-2 text-orange-600">
                • Analisi: {usage.analyses_used}/{limits.monthly_analyses}
                • Compagnie: {usage.companies_active}/{limits.max_companies}
              </span>
            )}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Pulsanti demo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Analisi Polizza */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              Analisi Polizza
            </CardTitle>
            <CardDescription>
              Testa il controllo limiti per le analisi mensili
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleAnalyzePolicy}
              disabled={isLoading === 'analyze'}
              className="w-full"
            >
              {isLoading === 'analyze' ? 'Analizzando...' : 'Analizza Polizza'}
            </Button>
            <p className="text-sm text-gray-500 mt-2">
              Limite: {usage.analyses_used}/{limits.monthly_analyses} analisi
            </p>
          </CardContent>
        </Card>

        {/* Analisi AI */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Brain className="h-5 w-5" />
              Analisi AI
            </CardTitle>
            <CardDescription>
              Funzionalità disponibile solo nei piani a pagamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleAIAnalysis}
              disabled={isLoading === 'ai'}
              variant={limits.ai_analysis ? "default" : "outline"}
              className="w-full"
            >
              {isLoading === 'ai' ? 'Analizzando...' : '🤖 Analisi AI'}
            </Button>
            <p className="text-sm text-gray-500 mt-2">
              {limits.ai_analysis ? 'Disponibile' : 'Solo piani Premium'}
            </p>
          </CardContent>
        </Card>

        {/* Export Dati */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Download className="h-5 w-5" />
              Export Dati
            </CardTitle>
            <CardDescription>
              Esporta i tuoi dati in formato Excel/CSV
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleExportData}
              disabled={isLoading === 'export'}
              variant={limits.export_data ? "default" : "outline"}
              className="w-full"
            >
              {isLoading === 'export' ? 'Esportando...' : '📊 Esporta Dati'}
            </Button>
            <p className="text-sm text-gray-500 mt-2">
              {limits.export_data ? 'Disponibile' : 'Solo piani Premium'}
            </p>
          </CardContent>
        </Card>

        {/* Aggiungi Compagnia */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5" />
              Aggiungi Compagnia
            </CardTitle>
            <CardDescription>
              Testa il limite massimo di compagnie attive
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleAddCompany}
              disabled={isLoading === 'company'}
              className="w-full"
            >
              {isLoading === 'company' ? 'Aggiungendo...' : '➕ Aggiungi Compagnia'}
            </Button>
            <p className="text-sm text-gray-500 mt-2">
              Limite: {usage.companies_active}/{limits.max_companies} compagnie
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pulsante per mostrare dialog upgrade */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Dialog Upgrade
          </CardTitle>
          <CardDescription>
            Mostra il dialog di upgrade dettagliato
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => setShowDialog(true)}
            variant="outline"
            className="w-full"
          >
            Mostra Dialog Upgrade
          </Button>
        </CardContent>
      </Card>

      {/* Dialog upgrade */}
      <UpgradeDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        reason="Demo upgrade dialog"
        actionName="funzionalità premium"
      />

      {/* Istruzioni */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">📋 Come Testare</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700 space-y-2">
          <p><strong>1. Analisi Polizza:</strong> Clicca più volte per raggiungere il limite (5 analisi)</p>
          <p><strong>2. Analisi AI:</strong> Testa funzionalità non disponibile nel piano gratuito</p>
          <p><strong>3. Export Dati:</strong> Testa altra funzionalità premium</p>
          <p><strong>4. Aggiungi Compagnia:</strong> Testa limite compagnie (max 2)</p>
          <p><strong>5. Dialog:</strong> Vedi il dialog di upgrade dettagliato</p>
        </CardContent>
      </Card>
    </div>
  );
}
