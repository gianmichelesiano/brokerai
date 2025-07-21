import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('Free plan API called');
    
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
    console.log('Backend URL:', process.env.BACKEND_URL);
    
    // Verifica che il backend URL sia configurato
    if (!process.env.BACKEND_URL) {
      throw new Error('BACKEND_URL non configurato nelle variabili d\'ambiente');
    }

    // Chiama il backend per salvare la subscription nel database
    const backendResponse = await fetch(`${process.env.BACKEND_URL}/api/billing/subscription/free`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({
        user_id: userId,
        plan_type: 'free'
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
      message: 'Piano gratuito attivato con successo',
      subscription: result.subscription
    });

  } catch (error) {
    console.error('Error setting free plan:', error);
    
    // Se il backend non è disponibile, usa un fallback temporaneo
    // ma logga l'errore per il debugging
    console.warn('Backend non disponibile, usando fallback temporaneo');
    
    return NextResponse.json(
      { 
        success: false, 
        error: `Errore nell'attivazione del piano gratuito: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error instanceof Error ? error.stack : undefined,
        fallback_used: true
      },
      { status: 500 }
    );
  }
}
