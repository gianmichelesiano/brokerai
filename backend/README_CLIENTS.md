# Sistema di Gestione Clienti

## Panoramica

Il sistema di gestione clienti permette ai broker di gestire i propri clienti, sia individuali che aziendali. Il sistema supporta due tipi di clienti:

- **Clienti Individuali**: Persone fisiche con dati personali
- **Clienti Aziendali**: Aziende con dati societari

## Caratteristiche Principali

### ✅ Funzionalità Implementate

1. **Creazione Clienti Transazionale**
   - Creazione automatica del profilo appropriato (individuale o aziendale)
   - Operazioni atomiche: se una parte fallisce, tutto viene annullato
   - Validazione dei dati in tempo reale

2. **Gestione Profili**
   - Profili individuali con dati personali completi
   - Profili aziendali con dati societari e contatti
   - Aggiornamento selettivo dei campi

3. **Sicurezza e Accesso**
   - Autenticazione JWT obbligatoria
   - Row Level Security (RLS) a livello database
   - I broker possono accedere solo ai propri clienti

4. **API RESTful Completa**
   - CRUD completo per i clienti
   - Paginazione per le liste
   - Gestione errori consistente

## Struttura del Database

### Tabelle Principali

1. **`clients`** - Tabella principale dei clienti
   - `id` (UUID, Primary Key)
   - `broker_id` (UUID, Foreign Key → brokers.id)
   - `client_type` (TEXT: 'individual' | 'company')
   - `individual_profile_id` (UUID, Foreign Key → individual_profiles.id)
   - `company_profile_id` (UUID, Foreign Key → company_profiles.id)
   - `is_active` (BOOLEAN)
   - `notes` (TEXT)
   - `created_at`, `updated_at` (TIMESTAMPTZ)

2. **`individual_profiles`** - Profili clienti individuali
   - Dati personali completi (nome, cognome, codice fiscale, etc.)
   - Validazione del codice fiscale italiano (16 caratteri)

3. **`company_profiles`** - Profili clienti aziendali
   - Dati societari completi (ragione sociale, P.IVA, etc.)
   - Validazione P.IVA e codice fiscale

### Vincoli e Sicurezza

- **Vincolo di Consistenza**: Un cliente può avere solo un profilo (individuale O aziendale)
- **RLS Policies**: I broker vedono solo i propri clienti
- **Foreign Key Constraints**: Eliminazione a cascata dei profili
- **Unique Constraints**: Codice fiscale e P.IVA unici

## Installazione e Setup

### 1. Eseguire lo Script SQL

```bash
# Copiare e eseguire il contenuto di clients_database_setup.sql
# nel SQL Editor di Supabase
```

### 2. Verificare l'Installazione

```bash
# Testare la connessione
python test_clients_api.py
```

## Utilizzo dell'API

### Endpoint Principali

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| POST | `/api/v1/clients` | Crea un nuovo cliente |
| GET | `/api/v1/clients` | Lista clienti del broker |
| GET | `/api/v1/clients/{id}` | Dettagli cliente specifico |
| PUT | `/api/v1/clients/{id}` | Aggiorna cliente |
| DELETE | `/api/v1/clients/{id}` | Elimina cliente |

### Esempi di Utilizzo

#### Creazione Cliente Individuale

```bash
curl -X POST "http://localhost:8000/api/v1/clients" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "client_type": "individual",
    "is_active": true,
    "notes": "Cliente storico",
    "individual_profile": {
      "first_name": "Mario",
      "last_name": "Rossi",
      "birth_date": "1980-01-15T00:00:00Z",
      "fiscal_code": "RSSMRA80A15H501U",
      "phone": "+39 123 456 7890",
      "email": "mario.rossi@email.com",
      "address": "Via Roma 123",
      "city": "Milano",
      "postal_code": "20100",
      "province": "MI"
    }
  }'
```

#### Creazione Cliente Aziendale

```bash
curl -X POST "http://localhost:8000/api/v1/clients" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "client_type": "company",
    "is_active": true,
    "notes": "Azienda cliente",
    "company_profile": {
      "company_name": "Azienda SRL",
      "vat_number": "12345678901",
      "fiscal_code": "1234567890123456",
      "legal_address": "Via delle Aziende 456",
      "city": "Roma",
      "postal_code": "00100",
      "province": "RM",
      "phone": "+39 06 123 4567",
      "email": "info@azienda.it",
      "contact_person": "Giuseppe Verdi",
      "contact_phone": "+39 333 123 4567",
      "contact_email": "g.verdi@azienda.it"
    }
  }'
```

## Validazione Dati

### Campi Obbligatori Individuali
- `first_name`, `last_name`
- `fiscal_code` (esattamente 16 caratteri)

### Campi Obbligatori Aziendali
- `company_name`, `vat_number` (11-20 caratteri)
- `legal_address`, `city`, `postal_code`, `province` (2 lettere)

### Validazioni Automatiche
- Codice fiscale unico per individui
- P.IVA unica per aziende
- Formato province (2 lettere maiuscole)
- Lunghezza codici fiscali

## Gestione Errori

### Codici di Errore Comuni

- `400 Bad Request`: Dati invalidi o campi mancanti
- `401 Unauthorized`: Token mancante o invalido
- `403 Forbidden`: Accesso negato al cliente
- `404 Not Found`: Cliente non trovato
- `500 Internal Server Error`: Errore server

### Esempio di Risposta Errore

```json
{
  "success": false,
  "message": "Errore nella creazione del cliente",
  "error": "Codice fiscale già esistente"
}
```

## Sicurezza

### Autenticazione
- Tutti gli endpoint richiedono token JWT
- Il token viene estratto dall'header `Authorization: Bearer <token>`

### Autorizzazione
- I broker possono accedere solo ai propri clienti
- RLS policies a livello database
- Verifica ownership prima di ogni operazione

### Validazione Input
- Validazione Pydantic su tutti i campi
- Sanitizzazione automatica dei dati
- Controlli di formato e lunghezza

## Testing

### Eseguire i Test

```bash
# Installare dipendenze
pip install requests

# Configurare il token nel file di test
# Modificare TEST_BROKER_TOKEN in test_clients_api.py

# Eseguire i test
python test_clients_api.py
```

### Test Disponibili
- ✅ Creazione cliente individuale
- ✅ Creazione cliente aziendale
- ✅ Recupero lista clienti
- ✅ Recupero cliente specifico
- ✅ Aggiornamento cliente
- ✅ Eliminazione cliente
- ✅ Test scenari invalidi

## Monitoraggio e Logging

### Log Disponibili
- Creazione clienti: `✅ Client created successfully`
- Aggiornamenti: `✅ Client updated successfully`
- Eliminazioni: `✅ Client deleted successfully`
- Errori: `❌ Error creating client: <details>`

### Metriche Suggerite
- Numero clienti per broker
- Distribuzione clienti individuali vs aziendali
- Tasso di successo delle operazioni
- Tempi di risposta API

## Estensioni Future

### Funzionalità Suggerite
1. **Ricerca Avanzata**
   - Ricerca per nome, codice fiscale, P.IVA
   - Filtri per tipo cliente, stato, data creazione

2. **Import/Export**
   - Importazione da CSV/Excel
   - Export dati clienti
   - Backup automatici

3. **Notifiche**
   - Notifiche per aggiornamenti profili
   - Promemoria per scadenze
   - Email di conferma operazioni

4. **Analytics**
   - Dashboard clienti per broker
   - Statistiche di utilizzo
   - Report personalizzati

## Supporto

Per problemi o domande:
1. Controllare i log dell'applicazione
2. Verificare la connessione al database
3. Testare con il file `test_clients_api.py`
4. Consultare la documentazione API completa in `CLIENTS_API.md` 