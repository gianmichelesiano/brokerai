export interface AutumnProduct {
  id: string;
  name: string;
  description?: string;
  type: 'service' | 'physical' | 'addon';
  display?: {
    name?: string;
    description?: string;
    recommend_text?: string;
    button_text?: string;
    button_url?: string;
    everything_from?: string;
  };
  properties?: {
    interval?: 'month' | 'year' | 'one_time';
    interval_group?: 'month' | 'year';
    is_free?: boolean;
  };
  items: Array<{
    id: string;
    type: 'flat' | 'unit' | 'tier';
    display?: {
      primary_text?: string;
      secondary_text?: string;
    };
    flat?: { amount: number; };
    unit?: { amount: number; quantity?: number; };
  }>;
}

export const BROKERAI_PRODUCTS: AutumnProduct[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Piano gratuito per iniziare',
    type: 'service',
    display: {
      name: 'Free',
      description: 'Perfetto per iniziare con BrokerAI',
      button_text: 'Inizia Gratis',
    },
    properties: { 
      is_free: true,
      interval: 'month',
      interval_group: 'month'
    },
    items: [
      {
        id: 'free-analyses',
        type: 'unit',
        display: {
          primary_text: '5 analisi polizze',
          secondary_text: 'al mese',
        },
        unit: { amount: 0, quantity: 5 }
      },
      {
        id: 'free-companies',
        type: 'unit',
        display: {
          primary_text: '2 compagnie',
          secondary_text: 'attive',
        },
        unit: { amount: 0, quantity: 2 }
      }
    ]
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Per broker professionisti',
    type: 'service',
    display: {
      name: 'Professional',
      description: 'Ideale per broker e agenti professionisti',
      recommend_text: 'Più Popolare',
      button_text: 'Inizia Trial Gratuito',
    },
    properties: {
      interval: 'month',
      interval_group: 'month'
    },
    items: [
      {
        id: 'pro-price',
        type: 'flat',
        display: {
          primary_text: '€29',
          secondary_text: 'al mese'
        },
        flat: { amount: 2900 } // in centesimi
      },
      {
        id: 'pro-analyses',
        type: 'unit',
        display: {
          primary_text: '100 analisi polizze',
          secondary_text: 'al mese',
        },
        unit: { amount: 0, quantity: 100 }
      },
      {
        id: 'pro-companies',
        type: 'unit',
        display: {
          primary_text: '10 compagnie',
          secondary_text: 'attive',
        },
        unit: { amount: 0, quantity: 10 }
      }
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Per grandi organizzazioni',
    type: 'service',
    display: {
      name: 'Enterprise',
      description: 'Soluzione completa per grandi broker e organizzazioni',
      button_text: 'Contatta Vendite',
    },
    properties: {
      interval: 'month',
      interval_group: 'month'
    },
    items: [
      {
        id: 'enterprise-price',
        type: 'flat',
        display: {
          primary_text: '€99',
          secondary_text: 'al mese'
        },
        flat: { amount: 9900 } // in centesimi
      },
      {
        id: 'enterprise-analyses',
        type: 'unit',
        display: {
          primary_text: 'Analisi illimitate',
          secondary_text: '',
        },
        unit: { amount: 0, quantity: -1 } // -1 per illimitato
      },
      {
        id: 'enterprise-companies',
        type: 'unit',
        display: {
          primary_text: 'Compagnie illimitate',
          secondary_text: '',
        },
        unit: { amount: 0, quantity: -1 } // -1 per illimitato
      }
    ]
  }
];

// Piano annuale con sconto
export const BROKERAI_PRODUCTS_YEARLY: AutumnProduct[] = [
  {
    id: 'professional-yearly',
    name: 'Professional Annuale',
    description: 'Piano annuale con 2 mesi gratis',
    type: 'service',
    display: {
      name: 'Professional',
      description: 'Piano annuale - Risparmia 2 mesi!',
      recommend_text: 'Miglior Valore',
      button_text: 'Inizia Trial Gratuito',
    },
    properties: {
      interval: 'year',
      interval_group: 'year'
    },
    items: [
      {
        id: 'pro-yearly-price',
        type: 'flat',
        display: {
          primary_text: '€290',
          secondary_text: 'all\'anno'
        },
        flat: { amount: 29000 } // 10 mesi invece di 12
      }
    ]
  },
  {
    id: 'enterprise-yearly',
    name: 'Enterprise Annuale',
    description: 'Piano enterprise annuale con sconto',
    type: 'service',
    display: {
      name: 'Enterprise',
      description: 'Piano annuale - Risparmia 2 mesi!',
      button_text: 'Contatta Vendite',
    },
    properties: {
      interval: 'year',
      interval_group: 'year'
    },
    items: [
      {
        id: 'enterprise-yearly-price',
        type: 'flat',
        display: {
          primary_text: '€990',
          secondary_text: 'all\'anno'
        },
        flat: { amount: 99000 } // 10 mesi invece di 12
      }
    ]
  }
];

// Features per piano
export const PLAN_FEATURES = {
  free: [
    '5 analisi polizze al mese',
    '2 compagnie attive',
    'Confronto base',
    'Support via email'
  ],
  professional: [
    '100 analisi polizze al mese',
    '10 compagnie attive',
    'AI analysis avanzata',
    'Export dati (PDF, Excel)',
    'Confronto avanzato',
    'Support prioritario',
    'Dashboard analytics'
  ],
  enterprise: [
    'Analisi polizze illimitate',
    'Compagnie illimitate',
    'AI analysis premium',
    'API access completo',
    'White-label disponibile',
    'Support dedicato 24/7',
    'Custom integrations',
    'Advanced analytics',
    'Multi-user management'
  ]
};

// Limiti per piano
export const PLAN_LIMITS = {
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
