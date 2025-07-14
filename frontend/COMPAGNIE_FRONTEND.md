# Frontend Compagnie - Documentazione

## Panoramica

Questo documento descrive l'implementazione del frontend per la gestione delle compagnie assicurative, aggiornato per supportare la nuova struttura del database con relazioni compagnia-tipologia.

## Struttura dei File

### Pagine

#### `/app/dashboard/compagnie/page.tsx`
Pagina principale per la gestione delle compagnie assicurative.

**Funzionalità:**
- Lista paginata delle compagnie
- Statistiche in tempo reale
- Ricerca per nome
- Operazioni CRUD complete
- Visualizzazione file associati tramite relazioni

#### `/app/dashboard/compagnie-tipologie/page.tsx`
Pagina per la gestione delle relazioni tra compagnie e tipologie di assicurazione.

**Funzionalità:**
- Lista delle relazioni compagnia-tipologia
- Filtri avanzati (compagnia, tipologia, stato)
- Statistiche delle relazioni
- Gestione file polizza per tipologia

### Componenti

#### `/components/compagnie/create-compagnia-dialog.tsx`
Dialog per la creazione di nuove compagnie.

**Props:**
- `onSuccess: () => void` - Callback chiamato dopo creazione riuscita

**Funzionalità:**
- Form di validazione
- Gestione errori
- Toast notifications
- Reset automatico del form

#### `/components/compagnie/edit-compagnia-dialog.tsx`
Dialog per la modifica di compagnie esistenti.

**Props:**
- `compagnia: Compagnia | null` - Compagnia da modificare
- `isOpen: boolean` - Stato di apertura del dialog
- `onClose: () => void` - Callback per chiusura
- `onSuccess: () => void` - Callback per successo

**Funzionalità:**
- Pre-popolamento dei campi
- Validazione in tempo reale
- Controllo modifiche
- Informazioni di sistema (ID, date)

#### `/components/compagnie/delete-compagnia-dialog.tsx`
Dialog per l'eliminazione di compagnie.

**Props:**
- `compagnia: Compagnia | null` - Compagnia da eliminare
- `isOpen: boolean` - Stato di apertura
- `onClose: () => void` - Callback per chiusura
- `onSuccess: () => void` - Callback per successo

**Funzionalità:**
- Conferma di eliminazione
- Avvisi sui dati correlati
- Informazioni di impatto
- Eliminazione cascade

#### `/components/compagnie/view-compagnia-dialog.tsx`
Dialog per la visualizzazione dettagliata di una compagnia.

**Props:**
- `compagnia: Compagnia | null` - Compagnia da visualizzare
- `isOpen: boolean` - Stato di apertura
- `onClose: () => void` - Callback per chiusura

**Funzionalità:**
- Informazioni complete della compagnia
- Lista file polizza dalle relazioni
- Statistiche rapide
- Caricamento dinamico dei file

#### `/components/compagnie/compagnie-stats.tsx`
Componente per le statistiche delle compagnie.

**Props:**
- `refreshTrigger?: number` - Trigger per aggiornamento

**Funzionalità:**
- Statistiche in tempo reale
- Grafici dei tipi di file
- Date importanti
- Percentuali di completamento

#### `/components/compagnie/compagnie-table.tsx`
Tabella per la visualizzazione delle compagnie.

**Props:**
- `compagnie: Compagnia[]` - Lista compagnie
- `isLoading: boolean` - Stato di caricamento
- `onView: (compagnia: Compagnia) => void` - Callback visualizzazione
- `onEdit: (compagnia: Compagnia) => void` - Callback modifica
- `onDelete: (compagnia: Compagnia) => void` - Callback eliminazione

**Funzionalità:**
- Tabella responsive
- Azioni per riga
- Stati di caricamento
- Empty state

## Modelli TypeScript

### Compagnia
```typescript
interface Compagnia {
  id: number
  nome: string
  created_at: string
  updated_at: string
}
```

### CompagniaFile
```typescript
interface CompagniaFile {
  relazione_id: number
  tipologia_id: number
  tipologia_nome: string
  filename: string
  path: string
  type: string
  size: number | null
  uploaded_at: string
  has_text: boolean
  attiva: boolean
}
```

### CompagniaStats
```typescript
interface CompagniaStats {
  total_compagnie: number
  compagnie_con_file: number
  compagnie_senza_file: number
  compagnie_con_testo: number
  compagnie_senza_testo: number
  file_types: Record<string, number>
  total_file_size: number
  average_text_length: number | null
  ultima_creazione: string | null
  ultima_modifica: string | null
  ultima_analisi: string | null
}
```

### CompagniaTipologia
```typescript
interface CompagniaTipologia {
  id: number
  compagnia_id: number
  tipologia_assicurazione_id: number
  polizza_filename: string | null
  polizza_path: string | null
  polizza_text: string | null
  attiva: boolean
  created_at: string
  updated_at: string
  compagnia_nome: string
  tipologia_nome: string
  tipologia_descrizione: string | null
}
```

## API Integration

### Endpoint Compagnie

#### GET `/api/compagnie`
Recupera lista paginata di compagnie.

**Query Parameters:**
- `search?: string` - Ricerca per nome
- `page?: number` - Numero pagina (default: 1)
- `size?: number` - Dimensione pagina (default: 20)
- `sort_by?: string` - Campo ordinamento
- `sort_order?: "asc" | "desc"` - Ordine

#### GET `/api/compagnie/stats`
Recupera statistiche delle compagnie.

#### GET `/api/compagnie/{id}`
Recupera dettagli di una compagnia specifica.

#### POST `/api/compagnie`
Crea una nuova compagnia.

**Body:**
```json
{
  "nome": "string"
}
```

#### PUT `/api/compagnie/{id}`
Aggiorna una compagnia esistente.

#### DELETE `/api/compagnie/{id}`
Elimina una compagnia.

#### GET `/api/compagnie/{id}/files`
Recupera file associati a una compagnia dalle relazioni.

### Endpoint Relazioni Compagnia-Tipologia

#### GET `/api/compagnia-tipologia`
Recupera lista delle relazioni.

**Query Parameters:**
- `compagnia_id?: number` - Filtra per compagnia
- `tipologia_assicurazione_id?: number` - Filtra per tipologia
- `attiva?: boolean` - Filtra per stato
- `has_file?: boolean` - Filtra per presenza file
- `has_text?: boolean` - Filtra per presenza testo

#### GET `/api/compagnia-tipologia/stats`
Recupera statistiche delle relazioni.

#### POST `/api/compagnia-tipologia/search`
Ricerca full-text nelle polizze.

## Gestione Stato

### State Management
Ogni pagina gestisce il proprio stato locale usando React hooks:

- `useState` per dati e UI state
- `useEffect` per side effects e data fetching
- `useToast` per notifiche

### Refresh Pattern
```typescript
const [refreshTrigger, setRefreshTrigger] = useState(0)

const handleRefresh = () => {
  setRefreshTrigger(prev => prev + 1)
}

useEffect(() => {
  loadData()
}, [refreshTrigger])
```

### Error Handling
```typescript
try {
  const response = await fetch(url)
  if (!response.ok) throw new Error("Errore API")
  // Handle success
} catch (error) {
  toast({
    title: "Errore",
    description: error.message,
    variant: "destructive"
  })
}
```

## Styling e UI

### Design System
- **Shadcn/ui** per componenti base
- **Tailwind CSS** per styling
- **Lucide React** per icone

### Responsive Design
- Grid responsive per statistiche
- Tabelle scrollabili su mobile
- Dialog adattivi

### Loading States
- Skeleton components durante caricamento
- Spinner per azioni
- Disabilitazione controlli durante operazioni

## Funzionalità Avanzate

### Ricerca e Filtri
- Ricerca in tempo reale
- Filtri multipli combinabili
- Clear filters functionality

### Paginazione
- Controllo dimensione pagina
- Navigazione pagine
- Contatori risultati

### File Management
- Visualizzazione file dalle relazioni
- Informazioni dettagliate file
- Stati di elaborazione testo

### Statistiche Real-time
- Aggiornamento automatico
- Grafici e metriche
- Percentuali di completamento

## Best Practices

### Performance
- Lazy loading dei componenti
- Memoization dove necessario
- Debouncing per ricerca

### Accessibilità
- Keyboard navigation
- Screen reader support
- Focus management

### UX
- Loading states chiari
- Error messages informativi
- Conferme per azioni distruttive
- Toast notifications per feedback

## Testing

### Unit Tests
```typescript
// Esempio test componente
import { render, screen } from '@testing-library/react'
import { CompagnieTable } from './compagnie-table'

test('renders empty state when no companies', () => {
  render(
    <CompagnieTable 
      compagnie={[]} 
      isLoading={false}
      onView={jest.fn()}
      onEdit={jest.fn()}
      onDelete={jest.fn()}
    />
  )
  
  expect(screen.getByText('Nessuna compagnia trovata')).toBeInTheDocument()
})
```

### Integration Tests
- Test API calls
- Test user workflows
- Test error scenarios

## Deployment

### Build
```bash
npm run build
```

### Environment Variables
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### Production Considerations
- API URL configuration
- Error boundary implementation
- Performance monitoring
