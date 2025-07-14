# API Tipologia Assicurazione - Documentazione

## Panoramica

È stata implementata una API completa per la gestione delle tipologie assicurative con operazioni CRUD complete.

## Struttura Implementata

### 1. Modello Pydantic (`app/models/tipologia_assicurazione.py`)

**Modelli principali:**
- `TipologiaAssicurazioneBase` - Modello base con nome e descrizione
- `TipologiaAssicurazioneCreate` - Per la creazione (eredita da Base)
- `TipologiaAssicurazioneUpdate` - Per l'aggiornamento (campi opzionali)
- `TipologiaAssicurazione` - Modello completo con ID e timestamp
- `TipologiaAssicurazioneList` - Per liste paginate
- `TipologiaAssicurazioneStats` - Per statistiche

**Modelli avanzati:**
- `TipologiaAssicurazioneBulkCreate` - Creazione multipla
- `TipologiaAssicurazioneBulkDelete` - Eliminazione multipla
- `TipologiaAssicurazioneSearch` - Ricerca full-text
- `TipologiaAssicurazioneFilter` - Filtri avanzati

### 2. Router API (`app/routers/tipologia_assicurazione.py`)

**Endpoint implementati:**

#### Operazioni Base CRUD
- `GET /api/tipologia-assicurazione/` - Lista paginata con filtri
- `GET /api/tipologia-assicurazione/{id}` - Dettaglio per ID
- `POST /api/tipologia-assicurazione/` - Creazione
- `PUT /api/tipologia-assicurazione/{id}` - Aggiornamento
- `DELETE /api/tipologia-assicurazione/{id}` - Eliminazione

#### Endpoint Avanzati
- `GET /api/tipologia-assicurazione/health` - Health check
- `GET /api/tipologia-assicurazione/stats` - Statistiche
- `GET /api/tipologia-assicurazione/search/{query}` - Ricerca full-text
- `POST /api/tipologia-assicurazione/bulk` - Creazione multipla
- `DELETE /api/tipologia-assicurazione/bulk` - Eliminazione multipla

### 3. Configurazione Database (`app/config/database.py`)

Aggiunta la costante `TIPOLOGIA_ASSICURAZIONE = "tipologia_assicurazione"` nella classe `Tables`.

### 4. Registrazione Router (`app/main.py` e `app/routers/__init__.py`)

Il router è stato registrato con il prefisso `/api/tipologia-assicurazione` e tag `["Tipologia Assicurazione"]`.

## Funzionalità Implementate

### Validazioni
- Nome obbligatorio e univoco
- Lunghezza massima per nome (255 caratteri) e descrizione (1000 caratteri)
- Sanitizzazione automatica degli input (trim degli spazi)
- Controllo esistenza per operazioni di update/delete

### Ricerca e Filtri
- Ricerca full-text nel nome e descrizione
- Paginazione con controllo dimensioni (1-100 elementi per pagina)
- Ordinamento personalizzabile per qualsiasi campo
- Filtri per ricerca testuale

### Gestione Errori
- Gestione completa degli errori HTTP
- Logging dettagliato per debugging
- Messaggi di errore user-friendly
- Validazione dei dati in input

### Operazioni Bulk
- Creazione multipla (fino a 50 elementi)
- Eliminazione multipla (fino a 50 elementi)
- Validazione di unicità per operazioni bulk

## Schema Database

```sql
CREATE TABLE tipologia_assicurazione (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome text NOT NULL,
  descrizione text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indice per ottimizzare le ricerche
CREATE INDEX idx_tipologia_assicurazione_nome ON tipologia_assicurazione (nome);

-- Trigger per aggiornamento automatico updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language plpgsql;

CREATE TRIGGER update_tipologia_assicurazione_updated_at
  BEFORE UPDATE ON tipologia_assicurazione
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Dati di Esempio

La tabella contiene già 6 tipologie di esempio:
1. Assicurazione Auto
2. Assicurazione Moto
3. Assicurazione Salute
4. Assicurazione Casa
5. Assicurazione Vita
6. Assicurazione Viaggio

## Come Avviare il Server

```bash
cd backend
venv/Scripts/activate  # Windows
# oppure
source venv/bin/activate  # Linux/Mac

python -m app.main
```

Il server sarà disponibile su `http://localhost:8000`

## Come Testare l'API

### 1. Documentazione Swagger
Visita `http://localhost:8000/docs` per la documentazione interattiva.

### 2. Script di Test
Esegui lo script di test incluso:
```bash
cd backend
python test_tipologia_assicurazione.py
```

### 3. Esempi di Chiamate API

#### Ottenere tutte le tipologie
```bash
curl "http://localhost:8000/api/tipologia-assicurazione/?page=1&size=20"
```

#### Creare una nuova tipologia
```bash
curl -X POST "http://localhost:8000/api/tipologia-assicurazione/" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Assicurazione Professionale",
    "descrizione": "Copertura per responsabilità professionale"
  }'
```

#### Cercare tipologie
```bash
curl "http://localhost:8000/api/tipologia-assicurazione/search/Auto"
```

#### Ottenere statistiche
```bash
curl "http://localhost:8000/api/tipologia-assicurazione/stats"
```

## Struttura Risposta API

### Lista Paginata
```json
{
  "items": [
    {
      "id": 1,
      "nome": "Assicurazione Auto",
      "descrizione": "Copertura assicurativa per veicoli a motore...",
      "created_at": "2025-07-01T12:04:17.742983+00:00",
      "updated_at": "2025-07-01T12:04:17.742983+00:00"
    }
  ],
  "total": 6,
  "page": 1,
  "size": 20,
  "pages": 1
}
```

### Statistiche
```json
{
  "total_tipologie": 6,
  "tipologie_con_descrizione": 6,
  "tipologie_senza_descrizione": 0,
  "ultima_creazione": "2025-07-01T12:04:17.742983+00:00",
  "ultima_modifica": "2025-07-01T12:04:17.742983+00:00",
  "nomi_piu_lunghi": [
    {"nome": "Assicurazione Viaggio", "lunghezza": 20},
    {"nome": "Assicurazione Salute", "lunghezza": 19}
  ]
}
```

## Codici di Stato HTTP

- `200` - OK (GET, PUT)
- `201` - Created (POST)
- `204` - No Content (DELETE)
- `400` - Bad Request (validazione fallita, nome duplicato)
- `404` - Not Found (risorsa non trovata)
- `500` - Internal Server Error (errore del server)

## Note Tecniche

- Utilizza Supabase come database PostgreSQL
- Implementa Row Level Security (RLS)
- Trigger automatico per aggiornamento `updated_at`
- Indice ottimizzato per ricerche per nome
- Gestione automatica dei timestamp
- Validazione robusta dei dati in input
- Logging completo per debugging

## File Creati/Modificati

1. **Nuovo:** `backend/app/models/tipologia_assicurazione.py`
2. **Nuovo:** `backend/app/routers/tipologia_assicurazione.py`
3. **Nuovo:** `backend/test_tipologia_assicurazione.py`
4. **Modificato:** `backend/app/config/database.py`
5. **Modificato:** `backend/app/routers/__init__.py`
6. **Modificato:** `backend/app/main.py`

L'implementazione è completa e pronta per l'uso in produzione!
