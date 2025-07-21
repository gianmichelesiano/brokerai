'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, CreditCard, Loader2 } from 'lucide-react';
import { PLAN_FEATURES } from '@/config/autumn-products';

interface AttachDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  productId: string;
  productName: string;
  price: string;
  isLoading?: boolean;
}

export default function AttachDialog({
  isOpen,
  onClose,
  onConfirm,
  productId,
  productName,
  price,
  isLoading = false
}: AttachDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await onConfirm();
    } finally {
      setIsProcessing(false);
    }
  };

  const getPlanFeatures = (planId: string) => {
    const planKey = planId.replace('-yearly', '') as keyof typeof PLAN_FEATURES;
    return PLAN_FEATURES[planKey] || [];
  };

  const isYearlyPlan = productId.includes('yearly');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Conferma Abbonamento
          </DialogTitle>
          <DialogDescription>
            Stai per sottoscrivere il piano <strong>{productName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Prezzo */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Prezzo</span>
              <div className="text-right">
                <div className="text-lg font-semibold">{price}</div>
                {isYearlyPlan && (
                  <Badge variant="secondary" className="text-xs">
                    Risparmia 2 mesi!
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Features incluse */}
          <div>
            <h4 className="text-sm font-medium mb-2">Cosa include:</h4>
            <div className="space-y-1">
              {getPlanFeatures(productId).slice(0, 4).map((feature, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Trial info per piani a pagamento */}
          {productId !== 'free' && (
            <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Trial gratuito di 7 giorni</strong> - Puoi cancellare in qualsiasi momento
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isProcessing || isLoading}
            className="w-full sm:w-auto"
          >
            Annulla
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isProcessing || isLoading}
            className="w-full sm:w-auto"
          >
            {isProcessing || isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Elaborazione...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                {productId === 'free' ? 'Conferma' : 'Inizia Trial'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
