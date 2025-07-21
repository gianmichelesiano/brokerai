"use client";

import { toast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Crown, Zap, TrendingUp } from 'lucide-react';

interface UpgradeNotificationProps {
  reason: string;
  currentUsage?: number;
  limit?: number;
  planType: string;
  actionName?: string;
}

export function showUpgradeNotification({
  reason,
  currentUsage,
  limit,
  planType,
  actionName = 'questa azione'
}: UpgradeNotificationProps) {
  // Determina il tipo di notifica e il messaggio appropriato
  const getNotificationContent = () => {
    if (reason.includes('limit reached')) {
      return {
        title: '🚫 Limite Raggiunto!',
        description: `Hai utilizzato ${currentUsage}/${limit} ${actionName} disponibili questo mese.`,
        upgradeMessage: 'Passa al piano Professional per analisi illimitate!',
      };
    } else if (reason.includes('not available')) {
      return {
        title: '⭐ Funzionalità Premium',
        description: `"${actionName}" è disponibile solo nei piani a pagamento.`,
        upgradeMessage: 'Sblocca tutte le funzionalità avanzate!',
      };
    } else {
      return {
        title: '🔒 Accesso Limitato',
        description: reason,
        upgradeMessage: 'Upgrade per accedere a tutte le funzionalità!',
      };
    }
  };

  const content = getNotificationContent();

  // Mostra toast con pulsante upgrade
  toast({
    variant: "destructive",
    title: content.title,
    description: (
      <div className="space-y-2">
        <p>{content.description}</p>
        <p className="text-sm font-medium text-orange-200">
          {content.upgradeMessage}
        </p>
      </div>
    ),
    action: (
      <ToastAction 
        altText="Upgrade Now" 
        onClick={() => window.location.href = '/pricing'}
        className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-none"
      >
        <div className="flex items-center gap-1">
          <Crown className="h-4 w-4" />
          Upgrade
        </div>
      </ToastAction>
    ),
    duration: 8000, // Toast più lungo per dare tempo di leggere
  });
}

// Componente per mostrare dialog di upgrade più dettagliato
export function UpgradeDialog({ 
  isOpen, 
  onClose, 
  reason, 
  actionName 
}: {
  isOpen: boolean;
  onClose: () => void;
  reason: string;
  actionName: string;
}) {
  const router = useRouter();

  const handleUpgrade = () => {
    router.push('/pricing');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
            <Crown className="h-8 w-8 text-white" />
          </div>
          
          <h2 className="text-xl font-bold text-gray-900">
            Upgrade Richiesto
          </h2>
          
          <p className="text-gray-600">
            Per continuare ad utilizzare "{actionName}", è necessario passare a un piano superiore.
          </p>
          
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h3 className="font-semibold text-orange-800 mb-2">
              🚀 Con il Piano Professional ottieni:
            </h3>
            <ul className="text-sm text-orange-700 space-y-1 text-left">
              <li>• ✅ Analisi illimitate</li>
              <li>• 🤖 Analisi AI avanzate</li>
              <li>• 📊 Export dati completi</li>
              <li>• 🏢 Compagnie illimitate</li>
              <li>• 🎯 Supporto prioritario</li>
            </ul>
          </div>
          
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
            >
              Più tardi
            </Button>
            <Button 
              onClick={handleUpgrade}
              className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              <Crown className="h-4 w-4 mr-2" />
              Upgrade Ora
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook per gestire le notifiche di upgrade
export function useUpgradeNotifications() {
  const router = useRouter();

  const showLimitReached = (actionName: string, currentUsage: number, limit: number) => {
    showUpgradeNotification({
      reason: 'limit reached',
      currentUsage,
      limit,
      planType: 'free',
      actionName
    });
  };

  const showFeatureNotAvailable = (actionName: string) => {
    showUpgradeNotification({
      reason: 'not available',
      planType: 'free',
      actionName
    });
  };

  const redirectToUpgrade = () => {
    router.push('/pricing?highlight=professional');
  };

  return {
    showLimitReached,
    showFeatureNotAvailable,
    redirectToUpgrade
  };
}
