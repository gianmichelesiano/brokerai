"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { 
  Crown, 
  AlertTriangle, 
  TrendingUp, 
  Clock,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

interface LimitReachedActionsProps {
  limitType: 'analyses' | 'ai_analyses' | 'exports' | 'companies';
  currentUsage: number;
  limit: number;
  planType: string;
  onDismiss?: () => void;
}

export function LimitReachedActions({
  limitType,
  currentUsage,
  limit,
  planType,
  onDismiss
}: LimitReachedActionsProps) {
  const router = useRouter();
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const getLimitInfo = () => {
    switch (limitType) {
      case 'analyses':
        return {
          title: 'Limite Analisi Raggiunto',
          description: 'Hai utilizzato tutte le analisi disponibili questo mese',
          icon: <TrendingUp className="h-5 w-5" />,
          nextReset: 'Le analisi si resettano il 1° del prossimo mese',
          upgradeMessage: 'Con il piano Professional avrai analisi illimitate!'
        };
      case 'ai_analyses':
        return {
          title: 'Analisi AI Non Disponibile',
          description: 'Le analisi AI sono disponibili solo nei piani a pagamento',
          icon: <Crown className="h-5 w-5" />,
          nextReset: null,
          upgradeMessage: 'Sblocca l\'AI e tutte le funzionalità avanzate!'
        };
      case 'exports':
        return {
          title: 'Export Non Disponibile',
          description: 'L\'export dati è disponibile solo nei piani a pagamento',
          icon: <Crown className="h-5 w-5" />,
          nextReset: null,
          upgradeMessage: 'Esporta i tuoi dati in Excel, CSV e PDF!'
        };
      case 'companies':
        return {
          title: 'Limite Compagnie Raggiunto',
          description: 'Hai raggiunto il numero massimo di compagnie attive',
          icon: <AlertTriangle className="h-5 w-5" />,
          nextReset: 'Rimuovi una compagnia per aggiungerne una nuova',
          upgradeMessage: 'Con il piano Professional gestisci compagnie illimitate!'
        };
      default:
        return {
          title: 'Limite Raggiunto',
          description: 'Hai raggiunto un limite del tuo piano',
          icon: <AlertTriangle className="h-5 w-5" />,
          nextReset: null,
          upgradeMessage: 'Upgrade per continuare!'
        };
    }
  };

  const info = getLimitInfo();

  const handleUpgrade = () => {
    router.push('/pricing?highlight=professional&source=limit-reached');
    onDismiss?.();
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  return (
    <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-red-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {info.icon}
            <CardTitle className="text-lg text-orange-800">
              {info.title}
            </CardTitle>
            <Badge variant="destructive" className="ml-2">
              {currentUsage}/{limit}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-orange-600 hover:text-orange-800"
          >
            ✕
          </Button>
        </div>
        <CardDescription className="text-orange-700">
          {info.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Opzioni disponibili */}
        <div className="space-y-3">
          <h4 className="font-semibold text-orange-800 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Cosa puoi fare ora:
          </h4>
          
          <div className="space-y-2">
            {/* Opzione 1: Upgrade (Raccomandato) */}
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-200">
              <div className="flex items-center gap-3">
                <Crown className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="font-medium text-gray-900">Upgrade al Piano Professional</p>
                  <p className="text-sm text-gray-600">{info.upgradeMessage}</p>
                </div>
              </div>
              <Button 
                onClick={handleUpgrade}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              >
                <Crown className="h-4 w-4 mr-2" />
                Upgrade Ora
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>

            {/* Opzione 2: Aspettare (se applicabile) */}
            {info.nextReset && (
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium text-gray-900">Aspetta il Reset</p>
                    <p className="text-sm text-gray-600">{info.nextReset}</p>
                  </div>
                </div>
                <Badge variant="outline">Gratuito</Badge>
              </div>
            )}

            {/* Opzione 3: Gestire risorse esistenti (per compagnie) */}
            {limitType === 'companies' && (
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium text-gray-900">Gestisci Compagnie Esistenti</p>
                    <p className="text-sm text-gray-600">Rimuovi una compagnia per aggiungerne una nuova</p>
                  </div>
                </div>
                <Button 
                  variant="outline"
                  onClick={() => router.push('/dashboard/compagnie')}
                >
                  Gestisci
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Benefici upgrade */}
        <div className="bg-white p-3 rounded-lg border border-orange-200">
          <h5 className="font-semibold text-orange-800 mb-2">
            🚀 Benefici del Piano Professional:
          </h5>
          <ul className="text-sm text-orange-700 space-y-1">
            <li>• ✅ Analisi illimitate ogni mese</li>
            <li>• 🤖 Analisi AI avanzate</li>
            <li>• 📊 Export completi (Excel, CSV, PDF)</li>
            <li>• 🏢 Compagnie illimitate</li>
            <li>• 🎯 Supporto prioritario</li>
            <li>• 📈 Dashboard analytics avanzate</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

// Hook per gestire la visualizzazione delle azioni post-limite
export function useLimitReachedActions() {
  const [showActions, setShowActions] = useState<{
    show: boolean;
    limitType?: 'analyses' | 'ai_analyses' | 'exports' | 'companies';
    currentUsage?: number;
    limit?: number;
    planType?: string;
  }>({ show: false });

  const showLimitActions = (
    limitType: 'analyses' | 'ai_analyses' | 'exports' | 'companies',
    currentUsage: number,
    limit: number,
    planType: string
  ) => {
    setShowActions({
      show: true,
      limitType,
      currentUsage,
      limit,
      planType
    });
  };

  const hideLimitActions = () => {
    setShowActions({ show: false });
  };

  return {
    showActions: showActions.show,
    limitActionsProps: showActions,
    showLimitActions,
    hideLimitActions
  };
}
