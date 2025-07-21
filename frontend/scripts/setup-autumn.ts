import { BROKERAI_PRODUCTS, BROKERAI_PRODUCTS_YEARLY } from '../config/autumn-products';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const AUTUMN_API_URL = 'https://api.useautumn.com/v1';
const AUTUMN_SECRET_KEY = process.env.AUTUMN_SECRET_KEY;

if (!AUTUMN_SECRET_KEY) {
  console.error('❌ AUTUMN_SECRET_KEY non trovata nel file .env.local');
  process.exit(1);
}

interface AutumnProduct {
  id: string;
  name: string;
  is_add_on?: boolean;
  is_default?: boolean;
  items: Array<{
    feature_id: string;
    feature_type: 'static';
    price: number;
    included_usage?: number;
    usage_model: 'prepaid';
  }>;
}

async function createProduct(product: any) {
  console.log(`🔄 Creazione prodotto: ${product.name}...`);
  
  // Controlla se il prodotto esiste già
  try {
    const checkResponse = await fetch(`${AUTUMN_API_URL}/products/${product.id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${AUTUMN_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (checkResponse.ok) {
      console.log(`⚠️  Prodotto ${product.name} già esistente, skip...`);
      return { skipped: true };
    }
  } catch (error) {
    // Prodotto non esiste, procediamo con la creazione
  }

  // Trasforma il prodotto per l'API Autumn
  const autumnProduct: AutumnProduct = {
    id: product.id,
    name: product.name,
    is_add_on: product.type === 'addon',
    is_default: product.properties?.is_free || false,
    items: product.items
      .filter((item: any) => item.flat?.amount > 0 || item.unit?.amount > 0 || product.properties?.is_free)
      .map((item: any) => ({
        feature_id: item.id,
        feature_type: 'static' as const,
        price: item.flat?.amount || item.unit?.amount || 0,
        included_usage: item.unit?.quantity,
        usage_model: 'prepaid' as const,
      })),
  };

  try {
    const response = await fetch(`${AUTUMN_API_URL}/products`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AUTUMN_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(autumnProduct),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error: ${response.status} - ${error}`);
    }

    const result = await response.json();
    console.log(`✅ Prodotto ${product.name} creato con successo`);
    return result;
  } catch (error) {
    console.error(`❌ Errore nella creazione del prodotto ${product.name}:`, error);
    throw error;
  }
}

async function setupAutumnProducts() {
  console.log('🚀 Inizio setup prodotti Autumn per BrokerAI...\n');

  try {
    // Crea prodotti mensili
    console.log('📦 Creazione prodotti mensili...');
    for (const product of BROKERAI_PRODUCTS) {
      await createProduct(product);
    }

    // Crea prodotti annuali
    console.log('\n📦 Creazione prodotti annuali...');
    for (const product of BROKERAI_PRODUCTS_YEARLY) {
      await createProduct(product);
    }

    console.log('\n🎉 Setup Autumn completato con successo!');
    console.log('\n📋 Prossimi passi:');
    console.log('1. Configura i webhook Stripe nel dashboard Autumn');
    console.log('2. Testa il flusso di pagamento in modalità test');
    console.log('3. Configura le chiavi di produzione quando sei pronto');

  } catch (error) {
    console.error('\n❌ Setup fallito:', error);
    process.exit(1);
  }
}

// Esegui setup se chiamato direttamente
if (require.main === module) {
  setupAutumnProducts();
}

export { setupAutumnProducts };
