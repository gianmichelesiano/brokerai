# API Brokers

Questa documentazione descrive gli endpoint per la gestione dei dati dei broker.

## Autenticazione

Tutti gli endpoint richiedono autenticazione tramite Bearer Token. Il token deve essere incluso nell'header `Authorization`:

```
Authorization: Bearer <your-jwt-token>
```

## Endpoint

### POST /api/v1/brokers/
**Descrizione:** Crea un nuovo broker (solo per amministratori)

**Metodo:** POST

**Headers richiesti:**
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

**Autorizzazione:** Solo utenti con ruolo `ADMIN`

**Body della richiesta:**
```json
{
  "id": "uuid-del-utente",
  "first_name": "Mario",
  "last_name": "Rossi",
  "rui_number": "A000123456",
  "role": "BROKER",
  "is_active": true
}
```

**Risposta di successo (200):**
```json
{
  "success": true,
  "message": "Broker creato con successo",
  "broker": {
    "id": "uuid-del-broker",
    "first_name": "Mario",
    "last_name": "Rossi",
    "rui_number": "A000123456",
    "role": "BROKER",
    "is_active": true,
    "full_name": "Mario Rossi"
  }
}
```

**Risposta di errore (403):**
```json
{
  "detail": "Solo gli amministratori possono creare nuovi broker"
}
```

### POST /api/v1/brokers/me
**Descrizione:** Crea il profilo broker per l'utente attualmente autenticato

**Metodo:** POST

**Headers richiesti:**
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

**Body della richiesta:**
```json
{
  "id": "uuid-del-utente-autenticato",
  "first_name": "Mario",
  "last_name": "Rossi",
  "rui_number": "A000123456",
  "role": "BROKER",
  "is_active": true
}
```

**Nota:** L'ID deve corrispondere all'utente autenticato

**Risposta di successo (200):**
```json
{
  "success": true,
  "message": "Broker creato con successo",
  "broker": {
    "id": "uuid-del-broker",
    "first_name": "Mario",
    "last_name": "Rossi",
    "rui_number": "A000123456",
    "role": "BROKER",
    "is_active": true,
    "full_name": "Mario Rossi"
  }
}
```

### GET /api/v1/brokers/me

**Descrizione:** Endpoint protetto che restituisce i dati del broker attualmente autenticato (presi dalla tabella brokers).

**Metodo:** GET

**Headers richiesti:**
- `Authorization: Bearer <token>`

**Risposta di successo (200):**
```json
{
  "success": true,
  "message": "Broker trovato con successo",
  "broker": {
    "id": "uuid-del-broker",
    "first_name": "Mario",
    "last_name": "Rossi",
    "rui_number": "A000123456",
    "role": "BROKER",
    "is_active": true,
    "full_name": "Mario Rossi"
  }
}
```

**Risposta di errore (401):**
```json
{
  "detail": "Token di accesso mancante"
}
```

**Risposta di errore (404):**
```json
{
  "detail": "Broker non trovato"
}
```

### PUT /api/v1/brokers/me

**Descrizione:** Endpoint protetto per aggiornare il proprio profilo (es. nome, cognome, numero RUI).

**Metodo:** PUT

**Headers richiesti:**
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

**Body della richiesta:**
```json
{
  "first_name": "Mario",
  "last_name": "Rossi",
  "rui_number": "A000123456",
  "role": "BROKER",
  "is_active": true
}
```

**Nota:** Tutti i campi sono opzionali. Solo i campi forniti verranno aggiornati.

**Risposta di successo (200):**
```json
{
  "success": true,
  "message": "Broker aggiornato con successo",
  "broker": {
    "id": "uuid-del-broker",
    "first_name": "Mario",
    "last_name": "Rossi",
    "rui_number": "A000123456",
    "role": "BROKER",
    "is_active": true,
    "full_name": "Mario Rossi"
  }
}
```

**Risposta di errore (400):**
```json
{
  "detail": "Numero RUI già in uso"
}
```

**Risposta di errore (401):**
```json
{
  "detail": "Token di accesso mancante"
}
```

### GET /api/v1/brokers/me/profile

**Descrizione:** Endpoint protetto che restituisce il profilo del broker con informazioni aggiuntive.

**Metodo:** GET

**Headers richiesti:**
- `Authorization: Bearer <token>`

**Risposta di successo (200):**
```json
{
  "success": true,
  "message": "Profilo broker recuperato con successo",
  "profile": {
    "id": "uuid-del-broker",
    "first_name": "Mario",
    "last_name": "Rossi",
    "rui_number": "A000123456",
    "role": "BROKER",
    "is_active": true,
    "full_name": "Mario Rossi",
    "profile_complete": true
  }
}
```

## Struttura Dati

### BrokerProfile

```typescript
interface BrokerProfile {
  id: string;           // UUID del broker (stesso ID di auth.users)
  first_name: string;   // Nome del broker
  last_name: string;    // Cognome del broker
  rui_number: string;   // Numero RUI (Registro Unico degli Intermediari)
  role: string;         // Ruolo: 'ADMIN', 'BROKER', 'ASSISTANT'
  is_active: boolean;   // Se l'account è attivo
  full_name: string;    // Nome completo (first_name + last_name)
}
```

### BrokerUpdate

```typescript
interface BrokerUpdate {
  first_name?: string;  // Nome del broker (opzionale)
  last_name?: string;   // Cognome del broker (opzionale)
  rui_number?: string;  // Numero RUI (opzionale)
  role?: string;        // Ruolo (opzionale)
  is_active?: boolean;  // Stato attivo (opzionale)
}
```

## Codici di Errore

- **401 Unauthorized:** Token mancante o non valido
- **403 Forbidden:** Accesso negato (es. non sei amministratore)
- **404 Not Found:** Broker non trovato
- **400 Bad Request:** Dati non validi (es. RUI già in uso, ID non corrisponde)
- **500 Internal Server Error:** Errore interno del server

## Note

1. **Sicurezza:** Gli endpoint utilizzano Row Level Security (RLS) di Supabase per garantire che ogni broker possa accedere solo ai propri dati.

2. **Trigger Automatico:** Quando un nuovo utente si registra, viene automaticamente creata una riga nella tabella `brokers` tramite un trigger PostgreSQL.

3. **Unicità RUI:** Il numero RUI deve essere unico per ogni broker.

4. **Ruoli:** I ruoli disponibili sono:
   - `ADMIN`: Amministratore del sistema
   - `BROKER`: Broker standard
   - `ASSISTANT`: Assistente broker

## Setup Database

Per utilizzare questi endpoint, è necessario eseguire lo script SQL `brokers_table_setup.sql` nel database Supabase per:

1. Creare la tabella `brokers`
2. Abilitare Row Level Security
3. Creare le policy di sicurezza
4. Creare il trigger per la creazione automatica dei profili broker
5. Creare gli indici per le performance 