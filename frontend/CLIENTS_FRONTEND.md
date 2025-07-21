# Gestione Clienti - Frontend

## Panoramica

Il sistema di gestione clienti permette ai broker di gestire i propri clienti, sia privati che aziende, con un'interfaccia moderna e intuitiva.

## Funzionalità Implementate

### 1. Dashboard Clienti (`/dashboard/clients`)
- **Tabella dei clienti** con informazioni principali
- **Ricerca** per nome, email, codice fiscale
- **Filtro per tipo** (Privato/Azienda)
- **Paginazione** per gestire grandi volumi di dati
- **Azioni rapide**: modifica ed eliminazione

### 2. Creazione Cliente (`/dashboard/clients/new`)
- **Form dinamico** che si adatta al tipo di cliente
- **Validazione completa** con Zod
- **Campi obbligatori** specifici per tipo:
  - **Privato**: nome, cognome, codice fiscale
  - **Azienda**: ragione sociale, partita IVA, codice fiscale

### 3. Modifica Cliente (`/dashboard/clients/[id]`)
- **Form pre-popolato** con i dati esistenti
- **Validazione** e aggiornamento in tempo reale
- **Gestione errori** completa

## Struttura dei File

```
frontend/
├── lib/
│   ├── types/client.ts          # Tipi TypeScript per i clienti
│   └── api/clients.ts           # API client per le chiamate al backend
├── hooks/
│   └── use-clients.ts           # Hook per gestione stato clienti
├── components/clients/
│   ├── clients-table.tsx        # Tabella principale dei clienti
│   ├── client-form.tsx          # Form per creazione/modifica
│   └── delete-client-dialog.tsx # Dialog di conferma eliminazione
└── app/dashboard/clients/
    ├── page.tsx                 # Pagina principale
    ├── loading.tsx              # Pagina di loading
    ├── new/
    │   └── page.tsx             # Pagina creazione
    └── [id]/
        └── page.tsx             # Pagina modifica
```

## API Endpoints Utilizzati

- `GET /api/v1/clients` - Lista clienti con filtri e paginazione
- `GET /api/v1/clients/{id}` - Dettagli cliente specifico
- `POST /api/v1/clients` - Creazione nuovo cliente
- `PUT /api/v1/clients/{id}` - Aggiornamento cliente
- `DELETE /api/v1/clients/{id}` - Eliminazione cliente

## Caratteristiche Tecniche

### Autenticazione
- Utilizza **Supabase Auth** per l'autenticazione
- Token JWT automaticamente incluso nelle chiamate API
- Gestione sessioni integrata

### Validazione
- **Zod** per la validazione dei form
- Validazione lato client in tempo reale
- Messaggi di errore localizzati in italiano

### UI/UX
- **Design responsive** per desktop e mobile
- **Loading states** per tutte le operazioni
- **Toast notifications** per feedback utente
- **Conferme** per azioni distruttive

### Gestione Stato
- **React Hook Form** per gestione form
- **Custom hooks** per logica di business
- **Ottimistico updates** per UX fluida

## Utilizzo

### Navigazione
1. Accedi alla dashboard
2. Clicca su "Clienti" nella sidebar
3. Usa i filtri per trovare i clienti
4. Clicca "Nuovo Cliente" per creare

### Creazione Cliente
1. Seleziona il tipo (Privato/Azienda)
2. Compila i campi obbligatori
3. I campi si adattano automaticamente al tipo
4. Clicca "Crea" per salvare

### Modifica Cliente
1. Clicca l'icona di modifica nella tabella
2. Modifica i campi desiderati
3. Clicca "Aggiorna" per salvare

### Eliminazione Cliente
1. Clicca l'icona di eliminazione
2. Conferma l'azione nel dialog
3. Il cliente viene eliminato definitivamente

## Configurazione

### Variabili d'Ambiente
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Dipendenze
Tutte le dipendenze necessarie sono già incluse nel `package.json`:
- `react-hook-form`
- `@hookform/resolvers`
- `zod`
- `lucide-react`
- `@radix-ui/react-*`

## Note per lo Sviluppo

### Aggiungere Nuovi Campi
1. Aggiorna i tipi in `lib/types/client.ts`
2. Modifica il form in `components/clients/client-form.tsx`
3. Aggiorna la tabella se necessario
4. Testa la validazione

### Personalizzazione UI
- I componenti usano **shadcn/ui**
- Stili con **Tailwind CSS**
- Icone da **Lucide React**

### Testing
- Testa la validazione dei form
- Verifica la gestione degli errori
- Controlla la responsività
- Testa l'accessibilità 