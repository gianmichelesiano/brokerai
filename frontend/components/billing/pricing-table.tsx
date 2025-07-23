import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api"
'use client';

import { useState } from 'react';
import { usePricingTable } from "autumn-js/react";
import { useCustomer } from "@/hooks/useAutumnCustomer";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Check, Star, Zap, Crown, Loader2 } from 'lucide-react';
import { BROKERAI_PRODUCTS, BROKERAI_PRODUCTS_YEARLY, PLAN_FEATURES } from '@/config/autumn-products';
import AttachDialog from './attach-dialog';

export default function PricingTable() {
  const { attach } = useCustomer();
  const { products, isLoading, error } = usePricingTable();
  const [isYearly, setIsYearly] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Usa i prodotti locali se l'API non è ancora configurata
  const rawProducts = products || (isYearly ? BROKERAI_PRODUCTS_YEARLY : BROKERAI_PRODUCTS);
  
  // Filtra i prodotti per assicurarsi che abbiano la struttura corretta
  // e che corrispondano alla modalità selezionata (mensile/annuale)
  const displayProducts = rawProducts.filter(product => {
    const isValid = product && product.items && Array.isArray(product.items);
    if (!isValid && product) {
      console.warn('Prodotto con struttura non valida filtrato:', product);
      return false;
    }
    
    // Se stiamo usando i prodotti dall'API Autumn, filtra in base al toggle
    if (products) {
      // Escludi sempre il piano "pro" che non serve
      if (product.id === 'pro') {
        return false;
      }
      
      if (isYearly) {
        // Modalità annuale: mostra solo prodotti annuali e free
        return product.id === 'free' || product.id.includes('yearly');
      } else {
        // Modalità mensile: mostra solo prodotti mensili (escludi yearly)
        return !product.id.includes('yearly');
      }
    }
    
    // Se stiamo usando prodotti locali, sono già filtrati correttamente
    return true;
  });

  const handleSelectPlan = async (product: any) => {
    // Se è il piano gratuito, gestiscilo diversamente
    if (product.id === 'free' || product.properties?.is_free) {
      await handleFreePlan();
      return;
    }
    
    setSelectedProduct(product);
    setIsDialogOpen(true);
  };

  const handleFreePlan = async () => {
    setIsProcessing(true);
    try {
      // Per il piano gratuito, non usiamo Autumn/Stripe ma il nostro backend
      const response = await fetch('/api/billing/subscription/free', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        // Reindirizza alla dashboard con messaggio di successo
        window.location.href = '/dashboard?plan=free&success=true';
      } else {
        console.error('Error setting free plan');
      }
    } catch (error) {
      console.error('Error setting free plan:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmPurchase = async () => {
    if (!selectedProduct) return;
    
    setIsProcessing(true);
    try {
      // Chiama Autumn per gestire il pagamento
      const attachResult = await attach({
        productId: selectedProduct.id,
        successUrl: window.location.origin + '/dashboard?success=true',
      });
      
      // Controlla se Autumn ha avuto successo
      console.log('Autumn attach result:', attachResult);
      
      // Il risultato di attach può essere diverso, per ora gestiamo il caso base
      // I dettagli della subscription verranno gestiti tramite webhook di Stripe
      if (attachResult) {
        console.log('Autumn attach completed, user will be redirected to Stripe checkout');
        
        // Determina il tipo di piano
        let planType = 'professional';
        if (selectedProduct.id.includes('enterprise')) {
          planType = 'enterprise';
        }
        
        // Salva nel database tramite il nostro backend
        // Nota: questo potrebbe essere chiamato prima che l'utente completi il pagamento
        // I dettagli completi verranno aggiornati tramite webhook di Stripe
        try {
          const saveResponse = await fetch('/api/billing/subscription/paid', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              productId: selectedProduct.id,
              planType: planType,
              // I dettagli Stripe verranno aggiornati tramite webhook
              autumnCustomerId: null, // Verrà aggiornato tramite webhook
            }),
          });
          
          if (saveResponse.ok) {
            console.log('Subscription preparation saved successfully');
          } else {
            console.error('Error saving subscription preparation to database');
          }
        } catch (saveError) {
          console.error('Error calling save API:', saveError);
        }
      }
    } catch (error) {
      console.error('Error attaching product:', error);
    } finally {
      setIsProcessing(false);
      setIsDialogOpen(false);
    }
  };

  const getPlanIcon = (planId: string) => {
    if (planId.includes('free')) return <Zap className="h-5 w-5" />;
    if (planId.includes('professional')) return <Star className="h-5 w-5" />;
    if (planId.includes('enterprise')) return <Crown className="h-5 w-5" />;
    return <Zap className="h-5 w-5" />;
  };

  const getPlanFeatures = (planId: string) => {
    const planKey = planId.replace('-yearly', '') as keyof typeof PLAN_FEATURES;
    return PLAN_FEATURES[planKey] || [];
  };

  const getPrice = (product: any) => {
    if (!product || !product.items) return 'Gratis';
    
    // Gestisce prodotti locali (tipo 'flat')
    const flatPriceItem = product.items.find((item: any) => item.type === 'flat');
    if (flatPriceItem?.display?.primary_text) {
      return flatPriceItem.display.primary_text;
    }
    
    // Gestisce prodotti dall'API Autumn - cerca prima un item di tipo 'price'
    const priceItem = product.items.find((item: any) => item.type === 'price');
    if (priceItem?.display?.primary_text) {
      return priceItem.display.primary_text;
    }
    
    // Gestisce prodotti dall'API Autumn (tipo 'priced_feature')
    const pricedFeatureItem = product.items.find((item: any) => item.type === 'priced_feature');
    if (pricedFeatureItem?.display?.primary_text) {
      // Converte da dollari a euro e formatta correttamente
      const priceText = pricedFeatureItem.display.primary_text;
      
      // Mapping specifico per i feature_id
      if (pricedFeatureItem.feature_id === 'pro-price') {
        return '€29';
      }
      if (pricedFeatureItem.feature_id === 'enterprise-price') {
        return '€99';
      }
      if (pricedFeatureItem.feature_id === 'pro-yearly-price') {
        return '€290';
      }
      if (pricedFeatureItem.feature_id === 'enterprise-yearly-price') {
        return '€990';
      }
      
      // Fallback: usa il prezzo dall'API ma convertilo in euro
      return priceText.replace('$', '€').replace(',', '');
    }
    
    // Per il piano free o qualsiasi altro caso
    return 'Gratis';
  };

  const getPriceSubtext = (product: any) => {
    if (!product || !product.items) return '';
    
    // Gestisce prodotti locali (tipo 'flat')
    const flatPriceItem = product.items.find((item: any) => item.type === 'flat');
    if (flatPriceItem?.display?.secondary_text) {
      return flatPriceItem.display.secondary_text;
    }
    
    // Gestisce prodotti dall'API Autumn - cerca prima un item di tipo 'price'
    const priceItem = product.items.find((item: any) => item.type === 'price');
    if (priceItem?.display?.secondary_text) {
      return priceItem.display.secondary_text;
    }
    
    // Gestisce prodotti dall'API Autumn (tipo 'priced_feature')
    const pricedFeatureItem = product.items.find((item: any) => item.type === 'priced_feature');
    if (pricedFeatureItem) {
      // Mapping specifico per i feature_id
      if (pricedFeatureItem.feature_id === 'pro-price') {
        return 'al mese';
      }
      if (pricedFeatureItem.feature_id === 'enterprise-price') {
        return 'al mese';
      }
      if (pricedFeatureItem.feature_id === 'pro-yearly-price') {
        return 'all\'anno';
      }
      if (pricedFeatureItem.feature_id === 'enterprise-yearly-price') {
        return 'all\'anno';
      }
    }
    
    return '';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Errore nel caricamento dei piani. Riprova più tardi.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Toggle Mensile/Annuale */}
      <div className="flex items-center justify-center gap-4">
        <span className={`text-sm ${!isYearly ? 'font-medium' : 'text-muted-foreground'}`}>
          Mensile
        </span>
        <Switch
          checked={isYearly}
          onCheckedChange={setIsYearly}
        />
        <span className={`text-sm ${isYearly ? 'font-medium' : 'text-muted-foreground'}`}>
          Annuale
        </span>
        {isYearly && (
          <Badge variant="secondary" className="ml-2">
            Risparmia 2 mesi
          </Badge>
        )}
      </div>

      {/* Griglia dei piani */}
      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {displayProducts.map((product: any) => {
          const isPopular = product.display?.recommend_text;
          const features = getPlanFeatures(product.id);
          
          return (
            <Card 
              key={product.id} 
              className={`relative ${isPopular ? 'border-primary shadow-lg scale-105' : ''}`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    {product.display.recommend_text}
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <div className="flex items-center justify-center mb-2">
                  {getPlanIcon(product.id)}
                </div>
                <CardTitle className="text-xl">
                  {product.display?.name || product.name}
                </CardTitle>
                <CardDescription>
                  {product.display?.description || product.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Prezzo */}
                <div className="text-center">
                  <div className="text-3xl font-bold">
                    {getPrice(product)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {getPriceSubtext(product)}
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-2">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  variant={isPopular ? 'default' : 'outline'}
                  onClick={() => handleSelectPlan(product)}
                  disabled={isProcessing}
                >
                  {product.display?.button_text || 'Seleziona Piano'}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Dialog di conferma */}
      <AttachDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={handleConfirmPurchase}
        productId={selectedProduct?.id || ''}
        productName={selectedProduct?.display?.name || selectedProduct?.name || ''}
        price={getPrice(selectedProduct)}
        isLoading={isProcessing}
      />
    </div>
  );
}
