import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('Paid plan API called');
    
    const body = await request.json();
    const { productId, planType, stripeCustomerId, stripeSubscriptionId, autumnCustomerId } = body;
    
    // Ottieni l'ID utente dal token di autenticazione o usa un fallback per testing
    let userId = request.headers.get('x-user-id');
    
    if (!userId) {
      // Prova a ottenere l'utente da Supabase
      try {
        const { createClient } = await import('@/lib/supabase-server');
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id || `temp-user-${Date.now()}`;
      } catch (error) {
        console.warn('Could not get user from Supabase, using fallback');
        userId = `temp-user-${Date.now()}`;
      }
    }
    
    console.log('User ID:', userId);
    console.log('Product ID:', productId);
    console.log('Plan Type:', planType);
    console.log('Backend URL:', process.env.BACKEND_URL);
    
    // Verifica che il backend URL sia configurato
    if (!process.env.BACKEND_URL) {
      throw new Error('BACKEND_URL non configurato nelle variabili d\'ambiente');
    }

    // Determina il tipo di piano basato sul productId
    let determinedPlanType = planType;
    if (!determinedPlanType) {
      if (productId.includes('professional') || productId.includes('pro')) {
        determinedPlanType = 'professional';
      } else if (productId.includes('enterprise')) {
        determinedPlanType = 'enterprise';
      } else {
        determinedPlanType = 'professional'; // default fallback
      }
    }

    // Determina l'intervallo di fatturazione
    const billingInterval = productId.includes('yearly') ? 'year' : 'month';

    // Chiama il backend per salvare la subscription nel database
    const backendResponse = await fetch(`${process.env.BACKEND_URL}/api/billing/subscription/paid`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({
        user_id: userId,
        plan_type: determinedPlanType,
        billing_interval: billingInterval,
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: stripeSubscriptionId,
        autumn_customer_id: autumnCustomerId,
        product_id: productId
      }),
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error('Backend error:', errorText);
      throw new Error(`Backend error: ${backendResponse.status} - ${errorText}`);
    }

    const result = await backendResponse.json();
    
    console.log('Backend response:', result);

    return NextResponse.json({
      success: true,
      message: `Piano ${determinedPlanType} attivato con successo`,
      subscription: result.subscription
    });

  } catch (error) {
    console.error('Error setting paid plan:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: `Errore nell'attivazione del piano: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
