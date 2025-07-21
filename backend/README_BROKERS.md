# Implementazione Brokers API

Questo documento descrive l'implementazione degli endpoint per la gestione dei dati dei broker nell'applicazione FastAPI.

## 🎯 Obiettivo

Implementare gli endpoint richiesti:
- `GET /api/v1/brokers/me`: Endpoint protetto che restituisce i dati del broker attualmente autenticato
- `PUT /api/v1/brokers/me`: Endpoint protetto per aggiornare il proprio profilo

**Plus endpoint aggiuntivi:**
- `POST /api/v1/brokers/me`: Crea il profilo broker per l'utente autenticato
- `POST /api/v1/brokers/`: Crea un nuovo broker (solo per amministratori)
- `GET /api/v1/brokers/me/profile`: Ottieni il profilo completo con informazioni aggiuntive

## 📁 File Creati/Modificati

### Nuovi File
- `app/models/brokers.py` - Modelli Pydantic per i broker
- `app/services/broker_service.py` - Servizio per gestire le operazioni sui broker
- `app/routers/brokers.py` - Router con gli endpoint dei broker
- `brokers_table_setup.sql` - Script SQL per creare la tabella brokers
- `BROKERS_API.md` - Documentazione completa degli endpoint
- `test_brokers_api.py` - Script di test per gli endpoint
- `test_brokers_api_complete.py` - Script di test completo con tutti gli endpoint
- `README_BROKERS.md` - Questo file

### File Modificati
- `app/main.py` - Aggiunto il router dei broker
- `app/models/__init__.py` - Importati i modelli dei broker
- `app/routers/__init__.py` - Importato il router dei broker
- `app/services/__init__.py` - Importato il servizio dei broker

## 🗄️ Struttura Database

La tabella `brokers` è collegata alla tabella `auth.users` di Supabase tramite una relazione uno-a-uno:

```sql
CREATE TABLE brokers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  rui_number TEXT UNIQUE,
  role TEXT DEFAULT 'BROKER' NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  CONSTRAINT role_check CHECK (role IN ('ADMIN', 'BROKER', 'ASSISTANT'))
);
```

### Caratteristiche:
- **Row Level Security (RLS)** abilitato
- **Trigger automatico** per creare profili broker quando si registra un nuovo utente
- **Indici** per ottimizzare le performance
- **Constraint** per validare i ruoli

## 🔐 Sicurezza

- **Autenticazione**: Tutti gli endpoint richiedono un JWT token valido
- **Autorizzazione**: Row Level Security garantisce che ogni broker possa accedere solo ai propri dati
- **Validazione**: Controlli sui dati in input tramite Pydantic models

## 🚀 Setup

### 1. Eseguire lo Script SQL

Nel database Supabase, esegui il contenuto di `brokers_table_setup.sql`:

```sql
-- Copia e incolla il contenuto del file brokers_table_setup.sql
-- nell'editor SQL di Supabase
```

### 2. Verificare l'Installazione

Avvia l'applicazione FastAPI:

```bash
python -m uvicorn app.main:app --reload
```

### 3. Testare gli Endpoint

Esegui lo script di test completo:

```bash
python test_brokers_api_complete.py
```

Oppure il test base:

```bash
python test_brokers_api.py
```

## 📋 Endpoint Disponibili

### POST /api/v1/brokers/me
- **Descrizione**: Crea il profilo broker per l'utente autenticato
- **Autenticazione**: Richiesta (Bearer Token)
- **Body**: Dati completi del broker
- **Validazioni**: ID deve corrispondere all'utente autenticato

### GET /api/v1/brokers/me
- **Descrizione**: Recupera i dati del broker autenticato
- **Autenticazione**: Richiesta (Bearer Token)
- **Risposta**: Dati del broker dal database

### PUT /api/v1/brokers/me
- **Descrizione**: Aggiorna il profilo del broker autenticato
- **Autenticazione**: Richiesta (Bearer Token)
- **Body**: Campi opzionali da aggiornare
- **Validazioni**: Unicità del numero RUI

### GET /api/v1/brokers/me/profile
- **Descrizione**: Recupera il profilo completo con informazioni aggiuntive
- **Autenticazione**: Richiesta (Bearer Token)
- **Risposta**: Profilo con flag `profile_complete`

### POST /api/v1/brokers/
- **Descrizione**: Crea un nuovo broker (solo per amministratori)
- **Autenticazione**: Richiesta (Bearer Token)
- **Autorizzazione**: Solo ruolo ADMIN
- **Body**: Dati completi del broker
- **Validazioni**: Controllo ruolo amministratore

## 🔧 Utilizzo

### Esempio di Richiesta POST (Crea Profilo)

```bash
curl -X POST "http://localhost:8000/api/v1/brokers/me" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "YOUR_USER_ID",
    "first_name": "Mario",
    "last_name": "Rossi",
    "rui_number": "A000123456",
    "role": "BROKER",
    "is_active": true
  }'
```

### Esempio di Richiesta GET

```bash
curl -X GET "http://localhost:8000/api/v1/brokers/me" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Esempio di Richiesta PUT

```bash
curl -X PUT "http://localhost:8000/api/v1/brokers/me" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Mario",
    "last_name": "Rossi",
    "rui_number": "A000123456"
  }'
```

### Esempio di Richiesta POST (Admin - Crea Altro Broker)

```bash
curl -X POST "http://localhost:8000/api/v1/brokers/" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "OTHER_USER_ID",
    "first_name": "Giovanni",
    "last_name": "Bianchi",
    "rui_number": "A000789012",
    "role": "BROKER",
    "is_active": true
  }'
```

## 🧪 Testing

Il file `test_brokers_api.py` include test per:

1. **Accesso non autorizzato** - Verifica che gli endpoint richiedano autenticazione
2. **GET /me** - Test del recupero dati broker
3. **PUT /me** - Test dell'aggiornamento profilo
4. **GET /me/profile** - Test del profilo completo

Per eseguire i test:

```bash
# Modifica le credenziali nel file test_brokers_api.py
python test_brokers_api.py
```

## 📚 Documentazione

- **BROKERS_API.md**: Documentazione completa degli endpoint
- **Swagger UI**: Disponibile su `http://localhost:8000/docs` quando l'app è in modalità debug

## 🔄 Workflow

1. **Registrazione Utente**: Quando un utente si registra, il trigger crea automaticamente un profilo broker
2. **Login**: L'utente ottiene un JWT token
3. **Accesso Dati**: Gli endpoint usano il token per identificare il broker e recuperare/aggiornare i suoi dati
4. **Sicurezza**: RLS garantisce che ogni broker veda solo i propri dati

## 🐛 Troubleshooting

### Problemi Comuni

1. **Errore 401**: Verifica che il token JWT sia valido
2. **Errore 404**: Il broker potrebbe non esistere nella tabella `brokers`
3. **Errore 400**: Verifica la validità dei dati (es. RUI già in uso)

### Debug

Abilita i log dettagliati modificando il livello di logging in `app/main.py`:

```python
logging.basicConfig(level=logging.DEBUG)
```

## 🔮 Estensioni Future

Possibili miglioramenti:

1. **Endpoint Admin**: Gestione di tutti i broker per gli amministratori
2. **Validazione RUI**: Integrazione con API esterne per validare i numeri RUI
3. **Notifiche**: Invio email quando il profilo viene aggiornato
4. **Audit Log**: Tracciamento delle modifiche ai profili
5. **Import/Export**: Funzionalità per importare/esportare dati broker 