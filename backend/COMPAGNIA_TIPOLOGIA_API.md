# API Compagnia-Tipologia Assicurazione

## Panoramica

Questo documento descrive le modifiche apportate al sistema per gestire la nuova struttura del database che separa i dati delle polizze dalle compagnie e li associa alle tipologie di assicurazione.

## Modifiche al Database

### Tabella `compagnie`
- **Rimossi campi**: `polizza_filename`, `polizza_path`, `polizza_text`
- **Campi rimanenti**: `id`, `nome`, `created_at`, `updated_at`

### Nuova Tabella `compagnia_tipologia_assicurazione`
```sql
CREATE TABLE public.compagnia_tipologia_assicurazione (
  id bigserial NOT NULL,
  compagnia_id bigint NOT NULL,
  tipologia_assicurazione_id bigint NOT NULL,
  polizza_filename character varying(255) NULL,
  polizza_path character varying(500) NULL,
  polizza_text text NULL,
  attiva boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  
  CONSTRAINT compagnia_tipologia_assicurazione_pkey PRIMARY KEY (id),
  CONSTRAINT compagnia_tipologia_assicurazione_compagnia_fk 
    FOREIGN KEY (compagnia_id) REFERENCES public.compagnie(id) ON DELETE CASCADE,
  CONSTRAINT compagnia_tipologia_assicurazione_tipologia_fk 
    FOREIGN KEY (tipologia_assicurazione_id) REFERENCES public.tipologia_assicurazione(id) ON DELETE CASCADE,
  CONSTRAINT compagnia_tipologia_unique UNIQUE (compagnia_id, tipologia_assicurazione_id)
);
```

### Vista `v_compagnie_tipologie`
```sql
CREATE OR REPLACE VIEW v_compagnie_tipologie AS
SELECT 
  c.id as compagnia_id,
  c.nome as compagnia_nome,
  ta.id as tipologia_id,
  ta.nome as tipologia_nome,
  ta.descrizione as tipologia_descrizione,
  cta.id as relazione_id,
  cta.polizza_filename,
  cta.polizza_path,
  cta.polizza_text,
  cta.attiva,
  cta.created_at as polizza_created_at,
  cta.updated_at as polizza_updated_at
FROM public.compagnie c
LEFT JOIN public.compagnia_tipologia_assicurazione cta ON c.id = cta.compagnia_id
LEFT JOIN public.tipologia_assicurazione ta ON cta.tipologia_assicurazione_id = ta.id;
```

## Nuovi Endpoint API

### Base URL: `/api/compagnia-tipologia`

#### 1. Health Check
- **GET** `/health`
- **Descrizione**: Verifica la connessione al database
- **Response**: Status della connessione e numero totale di relazioni

#### 2. Lista Relazioni
- **GET** `/`
- **Descrizione**: Recupera lista paginata di relazioni compagnia-tipologia
- **Query Parameters**:
  - `compagnia_id`: Filtra per ID compagnia
  - `tipologia_assicurazione_id`: Filtra per ID tipologia
  - `attiva`: Filtra per stato attivo
  - `has_file`: Filtra per presenza file
  - `has_text`: Filtra per presenza testo
  - `search`: Ricerca nel testo della polizza
  - `page`: Numero pagina (default: 1)
  - `size`: Dimensione pagina (default: 20)
  - `sort_by`: Campo per ordinamento (default: "created_at")
  - `sort_order`: Ordine di ordinamento (default: "desc")

#### 3. Statistiche
- **GET** `/stats`
- **Descrizione**: Recupera statistiche delle relazioni compagnia-tipologia
- **Response**: Statistiche complete su relazioni, file, testi, ecc.

#### 4. Dettaglio Relazione
- **GET** `/{relazione_id}`
- **Descrizione**: Recupera una relazione specifica per ID
- **Response**: Dettagli completi della relazione con nomi compagnia e tipologia

#### 5. Crea Relazione
- **POST** `/`
- **Descrizione**: Crea una nuova relazione compagnia-tipologia
- **Body**: 
```json
{
  "compagnia_id": 1,
  "tipologia_assicurazione_id": 1,
  "polizza_filename": "polizza.pdf",
  "polizza_path": "/path/to/file",
  "polizza_text": "Testo della polizza...",
  "attiva": true
}
```

#### 6. Aggiorna Relazione
- **PUT** `/{relazione_id}`
- **Descrizione**: Aggiorna una relazione esistente
- **Body**: Campi opzionali da aggiornare

#### 7. Elimina Relazione
- **DELETE** `/{relazione_id}`
- **Descrizione**: Elimina una relazione
- **Query Parameters**:
  - `delete_files`: Elimina anche i file associati (default: false)

#### 8. Upload File
- **POST** `/{relazione_id}/upload`
- **Descrizione**: Upload file polizza per una relazione (non ancora implementato)

#### 9. Estrazione Testo
- **POST** `/{relazione_id}/extract-text`
- **Descrizione**: Estrai testo dal file polizza (non ancora implementato)

#### 10. Ricerca Full-text
- **POST** `/search`
- **Descrizione**: Ricerca full-text nelle polizze
- **Body**:
```json
{
  "query": "responsabilità civile",
  "compagnia_ids": [1, 2],
  "tipologia_ids": [1],
  "attiva_only": true,
  "highlight": true,
  "max_results": 10
}
```

#### 11. Tipologie per Compagnia
- **GET** `/compagnia/{compagnia_id}/tipologie`
- **Descrizione**: Recupera tutte le tipologie associate a una compagnia
- **Query Parameters**:
  - `attiva`: Filtra per stato attivo

#### 12. Compagnie per Tipologia
- **GET** `/tipologia/{tipologia_id}/compagnie`
- **Descrizione**: Recupera tutte le compagnie associate a una tipologia
- **Query Parameters**:
  - `attiva`: Filtra per stato attivo

#### 13. Operazioni Bulk
- **POST** `/bulk` - Crea multiple relazioni
- **PUT** `/bulk` - Aggiorna multiple relazioni
- **DELETE** `/bulk` - Elimina multiple relazioni

## Modifiche agli Endpoint Esistenti

### Endpoint Compagnie (`/api/compagnie`)

#### Modifiche principali:
1. **Rimossi campi polizza** dai modelli Pydantic
2. **Aggiornate statistiche** per recuperare dati dai file dalla nuova tabella
3. **Modificato endpoint files** per recuperare file dalle relazioni compagnia-tipologia
4. **Aggiornata ricerca** per cercare solo nel nome (non più nel testo polizza)

#### Endpoint `/api/compagnie/{compagnia_id}/files`
Ora restituisce i file dalle relazioni compagnia-tipologia:
```json
{
  "compagnia_id": 1,
  "compagnia_nome": "Generali",
  "files": [
    {
      "relazione_id": 1,
      "tipologia_id": 1,
      "tipologia_nome": "Auto",
      "filename": "polizza_auto.pdf",
      "path": "/path/to/file",
      "type": "polizza",
      "size": null,
      "uploaded_at": "2024-01-01T00:00:00Z",
      "has_text": true,
      "attiva": true
    }
  ],
  "total_files": 1
}
```

## Modelli Pydantic

### CompagniaTipologia
```python
class CompagniaTipologia(BaseModel):
    id: int
    compagnia_id: int
    tipologia_assicurazione_id: int
    polizza_filename: Optional[str] = None
    polizza_path: Optional[str] = None
    polizza_text: Optional[str] = None
    attiva: bool = True
    created_at: datetime
    updated_at: datetime
```

### CompagniaTipologiaWithDetails
```python
class CompagniaTipologiaWithDetails(CompagniaTipologia):
    compagnia_nome: str
    tipologia_nome: str
    tipologia_descrizione: Optional[str] = None
```

## Esempi di Utilizzo

### 1. Creare una relazione compagnia-tipologia
```bash
curl -X POST "http://localhost:8000/api/compagnia-tipologia/" \
  -H "Content-Type: application/json" \
  -d '{
    "compagnia_id": 1,
    "tipologia_assicurazione_id": 1,
    "polizza_filename": "polizza_auto_generali.pdf",
    "polizza_path": "/documenti/polizze/",
    "polizza_text": "Testo della polizza auto...",
    "attiva": true
  }'
```

### 2. Recuperare tipologie per una compagnia
```bash
curl "http://localhost:8000/api/compagnia-tipologia/compagnia/1/tipologie?attiva=true"
```

### 3. Ricerca full-text nelle polizze
```bash
curl -X POST "http://localhost:8000/api/compagnia-tipologia/search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "responsabilità civile",
    "attiva_only": true,
    "max_results": 5
  }'
```

### 4. Recuperare file di una compagnia
```bash
curl "http://localhost:8000/api/compagnie/1/files"
```

## Note Importanti

1. **Constraint di unicità**: Una compagnia può avere solo una relazione per tipologia di assicurazione
2. **Cascade delete**: Eliminando una compagnia o tipologia, vengono eliminate anche le relazioni
3. **Indici per performance**: Creati indici su compagnia_id, tipologia_id, attiva e full-text search
4. **Vista per query**: La vista `v_compagnie_tipologie` semplifica le query con JOIN
5. **Trigger per updated_at**: Aggiornamento automatico del timestamp di modifica

## Migrazione dei Dati

Per migrare i dati esistenti dalla vecchia struttura:

```sql
-- Esempio di migrazione (da adattare ai dati reali)
INSERT INTO compagnia_tipologia_assicurazione 
(compagnia_id, tipologia_assicurazione_id, polizza_filename, polizza_path, polizza_text, attiva)
SELECT 
  c.id,
  1, -- ID tipologia di default
  c.polizza_filename,
  c.polizza_path,
  c.polizza_text,
  true
FROM compagnie c
WHERE c.polizza_filename IS NOT NULL;
