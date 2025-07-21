import { autumnHandler } from "autumn-js/next";
import { createClient } from "@/lib/supabase-server";

export const { GET, POST } = autumnHandler({
  identify: async (request) => {
    try {
      const supabase = await createClient();
      
      // Ottieni l'utente corrente da Supabase
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        console.log('[Autumn] No authenticated user found, using fallback');
        
        // Fallback per testing - usa un customer ID temporaneo
        // In produzione, questo dovrebbe reindirizzare al login
        const fallbackCustomerId = 'temp-customer-' + Date.now();
        
        return {
          customerId: fallbackCustomerId,
          customerData: {
            name: 'Test User',
            email: 'test@example.com',
            metadata: {
              is_fallback: true,
              created_at: new Date().toISOString()
            }
          },
        };
      }

      console.log('[Autumn] Authenticated user found:', user.id);
      
      return {
        customerId: user.id,
        customerData: {
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          email: user.email || '',
          metadata: {
            supabase_id: user.id,
            created_at: user.created_at,
            last_sign_in: user.last_sign_in_at
          }
        },
      };
    } catch (error) {
      console.error('[Autumn] Error in identify:', error);
      
      // Fallback anche in caso di errore
      const fallbackCustomerId = 'error-customer-' + Date.now();
      
      return {
        customerId: fallbackCustomerId,
        customerData: {
          name: 'Fallback User',
          email: 'fallback@example.com',
          metadata: {
            is_error_fallback: true,
            error: error instanceof Error ? error.message : 'Unknown error',
            created_at: new Date().toISOString()
          }
        },
      };
    }
  },
});
