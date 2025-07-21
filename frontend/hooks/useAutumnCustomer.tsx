'use client';

import { createContext, useContext, useCallback, ReactNode } from 'react';
import { useCustomer as useAutumnCustomer } from 'autumn-js/react';

interface AutumnCustomerContextType {
  refetchCustomer: () => Promise<void>;
}

const AutumnCustomerContext = createContext<AutumnCustomerContextType | null>(null);

export function AutumnCustomerProvider({ children }: { children: ReactNode }) {
  const { refetch } = useAutumnCustomer();

  const refetchCustomer = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return (
    <AutumnCustomerContext.Provider value={{ refetchCustomer }}>
      {children}
    </AutumnCustomerContext.Provider>
  );
}

export function useCustomer(params?: any) {
  const autumnCustomer = useAutumnCustomer(params);
  const context = useContext(AutumnCustomerContext);

  const globalRefetch = useCallback(async () => {
    const result = await autumnCustomer.refetch();
    if (context?.refetchCustomer) {
      await context.refetchCustomer();
    }
    return result;
  }, [autumnCustomer, context]);

  return {
    ...autumnCustomer,
    refetch: globalRefetch,
  };
}

// Hook per ottenere i limiti del piano corrente
export function usePlanLimits() {
  const { customer } = useCustomer();
  
  const getCurrentPlan = useCallback(() => {
    if (!customer?.products || customer.products.length === 0) {
      return 'free';
    }
    
    const activeProduct = customer.products[0];
    const productId = activeProduct.id;
    
    if (productId.includes('professional')) {
      return 'professional';
    } else if (productId.includes('enterprise')) {
      return 'enterprise';
    }
    return 'free';
  }, [customer]);

  const getPlanLimits = useCallback(() => {
    const plan = getCurrentPlan();
    
    const limits = {
      free: {
        monthly_analyses: 5,
        max_companies: 2,
        ai_analysis: false,
        export_data: false,
        api_access: false
      },
      professional: {
        monthly_analyses: 100,
        max_companies: 10,
        ai_analysis: true,
        export_data: true,
        api_access: false
      },
      enterprise: {
        monthly_analyses: -1, // illimitato
        max_companies: -1, // illimitato
        ai_analysis: true,
        export_data: true,
        api_access: true
      }
    };

    return limits[plan as keyof typeof limits];
  }, [getCurrentPlan]);

  const canPerformAction = useCallback((action: string) => {
    const limits = getPlanLimits();
    
    switch (action) {
      case 'ai_analysis':
        return limits.ai_analysis;
      case 'export_data':
        return limits.export_data;
      case 'api_access':
        return limits.api_access;
      default:
        return true;
    }
  }, [getPlanLimits]);

  const getRemainingUsage = useCallback((usageType: 'analyses' | 'companies') => {
    const limits = getPlanLimits();
    // Per ora usiamo valori mock, poi integreremo con il backend
    const usage = {
      monthly_analyses: 0,
      active_companies: 0
    };
    
    if (usageType === 'analyses') {
      if (limits.monthly_analyses === -1) return -1; // illimitato
      const used = usage.monthly_analyses || 0;
      return Math.max(0, limits.monthly_analyses - used);
    }
    
    if (usageType === 'companies') {
      if (limits.max_companies === -1) return -1; // illimitato
      const used = usage.active_companies || 0;
      return Math.max(0, limits.max_companies - used);
    }
    
    return 0;
  }, [getPlanLimits]);

  const isSubscribed = useCallback(() => {
    return customer?.products && customer.products.length > 0;
  }, [customer]);

  return {
    currentPlan: getCurrentPlan(),
    limits: getPlanLimits(),
    canPerformAction,
    getRemainingUsage,
    isSubscribed: isSubscribed()
  };
}
