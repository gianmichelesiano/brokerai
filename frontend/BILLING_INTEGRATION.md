# 🚀 Integrazione Stripe + Autumn per BrokerAI

Questa documentazione descrive l'integrazione completa del sistema di billing Stripe + Autumn nel progetto BrokerAI.

## 📋 Panoramica

L'integrazione include:
- **Stripe**: Gestione pagamenti e abbonamenti
- **Autumn**: Billing management e pricing table dinamiche
- **Supabase**: Autenticazione utenti integrata
- **Next.js**: Frontend con componenti React

## 🏗️ Struttura File

```
frontend/
├── config/
│   └── autumn-products.ts          # Definizione piani BrokerAI
├── scripts/
│   ├── setup-autumn.ts            # Setup automatico prodotti Autumn
│   └── setup-stripe-portal.ts     # Configurazione Stripe Portal
├── hooks/
│   └── useAutumnCustomer.tsx      # Hook personalizzato per gestione clienti
├── components/billing/
│   ├── pricing-table.tsx          # Tabella prezzi dinamica
│   ├── attach-dialog.tsx          # Dialog per conferma acquisti
│   └── subscription-status.tsx    # Status abbonamento utente
├── app/
│   ├── api/autumn/[...all]/
│   │   └── route.ts               # API handler Autumn
│   ├── pricing/
│   │   └── page.tsx               # Pagina prezzi pubblica
│   └── layout.tsx                 # Layout con provider Autumn
└── .env.local.example             # Variabili d'ambiente
```

## 💰 Piani di Abbonamento

### Free Plan
- 5 analisi polizze/mese
- 2 compagnie attive
- Confronto base
- Support via email

### Professional Plan (€29/mese)
- 100 analisi polizze/mese
- 10 compagnie attive
- AI analysis avanzata
- Export dati (PDF, Excel)
- Support prioritario
- Dashboard analytics

### Enterprise Plan (€99/mese)
- Analisi polizze illimitate
- Compagnie illimitate
- AI analysis premium
- API access completo
- White-label disponibile
- Support dedicato 24/7
- Custom integrations

## 🔧 Setup Iniziale

### 1. Installazione Dipendenze

```bash
cd frontend
npm install stripe autumn-js tsx
```

### 2. Configurazione Variabili d'Ambiente

Copia `.env.local.example` in `.env.local` e configura:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Autumn Billing
AUTUMN_SECRET_KEY=your-autumn-api-key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase (già configurato)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### 3. Setup Automatico

```bash
# Setup completo (Autumn + Stripe Portal)
npm run setup:billing

# Oppure individualmente:
npm run setup:autumn
npm run setup:stripe-portal
```

## 🎯 Componenti Principali

### PricingTable
Tabella prezzi dinamica con toggle mensile/annuale:

```tsx
import PricingTable from '@/components/billing/pricing-table';

<PricingTable />
```

### SubscriptionStatus
Dashboard status abbonamento utente:

```tsx
import SubscriptionStatus from '@/components/billing/subscription-status';

<SubscriptionStatus />
```

### Hook useCustomer
Hook personalizzato per gestione clienti:

```tsx
import { useCustomer, usePlanLimits } from '@/hooks/useAutumnCustomer';

const { customer, attach } = useCustomer();
const { currentPlan, limits, canPerformAction } = usePlanLimits();
```

## 🔐 Controllo Accessi

### Middleware di Controllo
Il sistema implementa controlli automatici basati sui limiti del piano:

```tsx
const { canPerformAction, getRemainingUsage } = usePlanLimits();

// Controlla se l'utente può usare AI analysis
if (!canPerformAction('ai_analysis')) {
  // Mostra upgrade prompt
}

// Controlla analisi rimanenti
const remaining = getRemainingUsage('analyses');
if (remaining === 0) {
  // Blocca funzionalità
}
```

### Limiti per Piano

```typescript
const PLAN_LIMITS = {
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
```

## 🔄 Flusso di Pagamento

1. **Selezione Piano**: Utente sceglie piano dalla pricing table
2. **Dialog Conferma**: Mostra dettagli piano e features incluse
3. **Autumn Attach**: Reindirizza a Stripe Checkout
4. **Pagamento**: Stripe gestisce il pagamento
5. **Webhook**: Autumn riceve conferma e attiva abbonamento
6. **Redirect**: Utente torna alla dashboard con piano attivo

## 🎨 Personalizzazione UI

### Temi e Colori
I componenti utilizzano il sistema di design Tailwind CSS con variabili CSS personalizzabili:

```css
:root {
  --primary: 222.2 84% 4.9%;
  --primary-foreground: 210 40% 98%;
  /* ... altre variabili */
}
```

### Icone per Piani
- **Free**: ⚡ Zap (blu)
- **Professional**: ⭐ Star (giallo)
- **Enterprise**: 👑 Crown (viola)

## 📊 Analytics e Monitoring

### Metriche Tracciabili
- Conversioni per piano
- Churn rate
- Revenue per utente
- Utilizzo features per piano

### Dashboard Autumn
Accedi al dashboard Autumn per:
- Monitorare metriche di billing
- Gestire prodotti e prezzi
- Configurare webhook
- Analizzare performance

## 🚨 Troubleshooting

### Errori Comuni

**1. Autumn API Key non valida**
```
❌ AUTUMN_SECRET_KEY non trovata nel file .env.local
```
Soluzione: Verifica che la chiave sia configurata correttamente in `.env.local`

**2. Stripe API Version mismatch**
```
Type '"2024-12-18.acacia"' is not assignable
```
Soluzione: Aggiorna alla versione API corrente in `setup-stripe-portal.ts`

**3. Prodotti già esistenti**
```
⚠️ Prodotto Professional già esistente, skip...
```
Soluzione: Normale, lo script salta prodotti esistenti

### Debug Mode

Abilita logging dettagliato:

```typescript
// In useAutumnCustomer.tsx
console.log('[Autumn] Customer data:', customer);
console.log('[Autumn] Plan limits:', limits);
```

## 🔄 Aggiornamenti

### Modificare Piani
1. Aggiorna `config/autumn-products.ts`
2. Esegui `npm run setup:autumn`
3. Testa il flusso completo

### Aggiungere Features
1. Aggiorna `PLAN_LIMITS` in `autumn-products.ts`
2. Implementa controlli in `usePlanLimits`
3. Aggiorna UI components

## 📞 Support

Per problemi con l'integrazione:
1. Controlla i log del browser (DevTools)
2. Verifica configurazione variabili d'ambiente
3. Testa con chiavi Stripe di test
4. Consulta documentazione Autumn: https://docs.useautumn.com

## 🎉 Go Live Checklist

- [ ] Configurare chiavi Stripe di produzione
- [ ] Aggiornare webhook URLs
- [ ] Testare flusso completo di pagamento
- [ ] Configurare monitoring e alerting
- [ ] Aggiornare URLs privacy/terms
- [ ] Testare cancellazione abbonamenti
- [ ] Verificare email di conferma
- [ ] Setup backup e recovery
