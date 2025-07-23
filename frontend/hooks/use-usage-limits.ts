import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api"
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from './use-auth';
import { toast } from './use-toast';
import { showUpgradeNotification } from '@/components/billing/upgrade-notification';
import { useLimitReachedActions } from '@/components/billing/limit-reached-actions';

interface UsageLimits {
  monthly_analyses: number;
  max_companies: number;
  ai_analysis: boolean;
  export_data: boolean;
  api_access: boolean;
  support_level: string;
}

interface CurrentUsage {
  analyses_used: number;
  companies_active: number;
  ai_analyses_used: number;
  exports_generated: number;
  api_calls_made: number;
}

interface UsageData {
  plan_type: string;
  status: string;
  usage: CurrentUsage;
  limits: UsageLimits;
  loading: boolean;
  error: string | null;
}

export function useUsageLimits(): UsageData & {
  checkLimit: (action: string) => Promise<{ allowed: boolean; reason?: string }>;
  checkLimitWithNotification: (action: string, actionName?: string) => Promise<boolean>;
  incrementUsage: (type: string, amount?: number) => Promise<void>;
  refreshUsage: () => Promise<void>;
} {
  const { user } = useAuth();
  const [data, setData] = useState<UsageData>({
    plan_type: 'free',
    status: 'active',
    usage: {
      analyses_used: 0,
      companies_active: 0,
      ai_analyses_used: 0,
      exports_generated: 0,
      api_calls_made: 0,
    },
    limits: {
      monthly_analyses: 5,
      max_companies: 2,
      ai_analysis: false,
      export_data: false,
      api_access: false,
      support_level: 'email',
    },
    loading: true,
    error: null,
  });

  const fetchUsageData = async () => {
    if (!user) return;

    try {
      setData(prev => ({ ...prev, loading: true, error: null }));

      const response = await fetch('/api/billing/stats', {
        headers: {
          'x-user-id': user.id,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch usage data: ${response.status}`);
      }

      const stats = await response.json();
      
      setData(prev => ({
        ...prev,
        plan_type: stats.plan_type,
        status: stats.status,
        usage: stats.usage,
        limits: stats.limits,
        loading: false,
      }));
    } catch (error) {
      console.error('Error fetching usage data:', error);
      setData(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error',
        loading: false,
      }));
    }
  };

  const checkLimit = async (action: string): Promise<{ allowed: boolean; reason?: string }> => {
    if (!user) return { allowed: false, reason: 'User not authenticated' };

    try {
      const response = await fetch(`/api/billing/limits/check/${action}`, {
        headers: {
          'x-user-id': user.id,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to check limits: ${response.status}`);
      }

      const result = await response.json();
      return {
        allowed: result.allowed,
        reason: result.reason,
      };
    } catch (error) {
      console.error('Error checking limits:', error);
      return { allowed: false, reason: 'Error checking limits' };
    }
  };

  const checkLimitWithNotification = async (action: string, actionName?: string): Promise<boolean> => {
    const result = await checkLimit(action);
    
    if (!result.allowed && result.reason) {
      const displayName = actionName || action;
      
      // Usa le notifiche di upgrade avanzate
      showUpgradeNotification({
        reason: result.reason,
        currentUsage: data.usage.analyses_used,
        limit: data.limits.monthly_analyses,
        planType: data.plan_type,
        actionName: displayName
      });
    }
    
    return result.allowed;
  };

  const incrementUsage = async (type: string, amount: number = 1): Promise<void> => {
    if (!user) return;

    try {
      const response = await fetch('/api/billing/usage/increment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({ usage_type: type, amount }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle billing limit errors specifically
        if (response.status === 403 && errorData.detail) {
          const { message, current_usage, limit, plan_type } = errorData.detail;
          
          // Usa le notifiche di upgrade avanzate
          showUpgradeNotification({
            reason: message,
            currentUsage: current_usage,
            limit: limit,
            planType: plan_type,
            actionName: type === 'analyses' ? 'analisi' : type
          });
          
          throw new Error(message);
        }
        
        throw new Error('Failed to increment usage');
      }

      // Show success notification for successful increment
      toast({
        title: "Azione completata",
        description: "L'utilizzo è stato aggiornato correttamente.",
      });

      // Refresh usage data after incrementing
      await fetchUsageData();
    } catch (error) {
      console.error('Error incrementing usage:', error);
      throw error;
    }
  };

  const refreshUsage = async (): Promise<void> => {
    await fetchUsageData();
  };

  useEffect(() => {
    fetchUsageData();
  }, [user]);

  return {
    ...data,
    checkLimit,
    checkLimitWithNotification,
    incrementUsage,
    refreshUsage,
  };
}
