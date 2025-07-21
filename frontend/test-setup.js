#!/usr/bin/env node

/**
 * Script di test per verificare l'integrazione Stripe + Autumn
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Test Setup Stripe + Autumn per BrokerAI\n');

// Verifica che le dipendenze siano installate
console.log('1. Verifico dipendenze...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredDeps = ['stripe', 'autumn-js', 'tsx'];
  
  for (const dep of requiredDeps) {
    if (!packageJson.dependencies[dep]) {
      console.log(`❌ Dipendenza mancante: ${dep}`);
      console.log(`   Esegui: npm install ${dep}`);
      process.exit(1);
    } else {
      console.log(`✅ ${dep} installato`);
    }
  }
} catch (error) {
  console.log('❌ Errore nella lettura del package.json');
  process.exit(1);
}

// Verifica file .env.local
console.log('\n2. Verifico configurazione .env.local...');
if (!fs.existsSync('.env.local')) {
  console.log('❌ File .env.local non trovato');
  console.log('   Copia .env.local.example in .env.local e configura le chiavi');
  process.exit(1);
}

const envContent = fs.readFileSync('.env.local', 'utf8');
const requiredEnvVars = [
  'AUTUMN_SECRET_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_PUBLISHABLE_KEY',
  'NEXT_PUBLIC_APP_URL'
];

for (const envVar of requiredEnvVars) {
  if (envContent.includes(`${envVar}=`) && !envContent.includes(`${envVar}=your-`) && !envContent.includes(`${envVar}=...`)) {
    console.log(`✅ ${envVar} configurato`);
  } else {
    console.log(`❌ ${envVar} non configurato correttamente`);
  }
}

// Verifica struttura file
console.log('\n3. Verifico struttura file...');
const requiredFiles = [
  'config/autumn-products.ts',
  'hooks/useAutumnCustomer.tsx',
  'components/billing/pricing-table.tsx',
  'components/billing/attach-dialog.tsx',
  'components/billing/subscription-status.tsx',
  'app/api/autumn/[...all]/route.ts',
  'app/pricing/page.tsx',
  'scripts/setup-autumn.ts',
  'scripts/setup-stripe-portal.ts'
];

for (const file of requiredFiles) {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} mancante`);
  }
}

// Test connessione Autumn (se le chiavi sono configurate)
console.log('\n4. Test connessione Autumn...');
if (envContent.includes('AUTUMN_SECRET_KEY=am_sk_test_')) {
  console.log('✅ Chiave Autumn configurata (test mode)');
  console.log('   Puoi eseguire: npm run setup:autumn');
} else {
  console.log('⚠️  Chiave Autumn non configurata o non valida');
}

// Test connessione Stripe
console.log('\n5. Test connessione Stripe...');
if (envContent.includes('STRIPE_SECRET_KEY=sk_test_')) {
  console.log('✅ Chiave Stripe configurata (test mode)');
  console.log('   Puoi eseguire: npm run setup:stripe-portal');
} else {
  console.log('⚠️  Chiave Stripe non configurata o non valida');
}

console.log('\n🎉 Setup completato!');
console.log('\n📋 Prossimi passi:');
console.log('1. Configura le chiavi Supabase in .env.local');
console.log('2. Esegui: npm run setup:billing');
console.log('3. Avvia il server: npm run dev');
console.log('4. Visita: http://localhost:3000/pricing');
console.log('\n📖 Documentazione completa: BILLING_INTEGRATION.md');
