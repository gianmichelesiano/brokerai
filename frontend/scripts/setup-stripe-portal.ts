import Stripe from 'stripe';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

if (!STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY non trovata nel file .env.local');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-06-30.basil',
});

async function setupBillingPortal() {
  console.log('🚀 Configurazione Stripe Billing Portal per BrokerAI...\n');

  try {
    // Controlla se esiste già una configurazione
    const existingConfigs = await stripe.billingPortal.configurations.list({
      limit: 1,
    });

    if (existingConfigs.data.length > 0) {
      console.log('⚠️  Configurazione Billing Portal già esistente');
      console.log(`📋 ID configurazione: ${existingConfigs.data[0].id}`);
      console.log(`🔗 URL di test: ${NEXT_PUBLIC_APP_URL}/api/create-portal-session`);
      return;
    }

    // Crea nuova configurazione
    const configuration = await stripe.billingPortal.configurations.create({
      business_profile: {
        headline: 'BrokerAI - Gestisci il tuo abbonamento',
        privacy_policy_url: `${NEXT_PUBLIC_APP_URL}/privacy`,
        terms_of_service_url: `${NEXT_PUBLIC_APP_URL}/terms`,
      },
      features: {
        customer_update: {
          enabled: true,
          allowed_updates: ['email', 'tax_id', 'address'],
        },
        invoice_history: { 
          enabled: true 
        },
        payment_method_update: { 
          enabled: true 
        },
        subscription_cancel: {
          enabled: true,
          mode: 'at_period_end',
          cancellation_reason: {
            enabled: true,
            options: [
              'too_expensive',
              'missing_features', 
              'switched_service',
              'unused',
              'other'
            ],
          },
        },
        subscription_update: {
          enabled: true,
          default_allowed_updates: ['price', 'quantity'],
          proration_behavior: 'create_prorations',
        },
      },
      default_return_url: `${NEXT_PUBLIC_APP_URL}/dashboard`,
    });

    console.log('✅ Billing Portal configurato con successo!');
    console.log(`📋 ID configurazione: ${configuration.id}`);
    console.log(`🔗 URL di test: ${NEXT_PUBLIC_APP_URL}/api/create-portal-session`);
    
    console.log('\n📋 Features abilitate:');
    console.log('• ✅ Aggiornamento informazioni cliente');
    console.log('• ✅ Storico fatture');
    console.log('• ✅ Aggiornamento metodi di pagamento');
    console.log('• ✅ Cancellazione abbonamento');
    console.log('• ✅ Modifica abbonamento');

    console.log('\n🔧 Prossimi passi:');
    console.log('1. Crea un endpoint API per generare session del portal');
    console.log('2. Integra il portal nel dashboard utente');
    console.log('3. Testa il flusso completo di gestione abbonamento');

  } catch (error) {
    console.error('❌ Errore nella configurazione del Billing Portal:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      console.error(`Codice errore Stripe: ${error.code}`);
      console.error(`Messaggio: ${error.message}`);
    }
    
    process.exit(1);
  }
}

async function createPortalSession(customerId: string) {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${NEXT_PUBLIC_APP_URL}/dashboard`,
    });

    return session.url;
  } catch (error) {
    console.error('❌ Errore nella creazione della sessione portal:', error);
    throw error;
  }
}

// Esegui setup se chiamato direttamente
if (require.main === module) {
  setupBillingPortal();
}

export { setupBillingPortal, createPortalSession };
