# API Garanzie per Tipologia

Documentazione per i nuovi endpoint che permettono di recuperare le garanzie filtrate per tipologia assicurativa.

## Nuovi Endpoint

### 1. GET `/garanzie/by-tipologia/{tipologia_id}`

Recupera tutte le garanzie per una specifica tipologia assicurativa utilizzando l'ID della tipologia.

**Parametri:**
- `tipologia_id` (path): ID della tipologia assicurativa
- `sezione` (query, opzionale): Filtra per sezione
- `search` (query, opzionale): Ricerca nel titolo e descrizione
- `page` (query, opzionale): Numero pagina (default: 1)
- `size` (query, opzionale): Dimensione pagina (default: 20, max: 100)
- `sort_by` (query, opzionale): Campo per ordinamento (default: "created_at")
- `sort_order` (query, opzionale): Ordine di ordinamento (asc/desc, default: "desc")

**Esempio di richiesta:**
```
GET /garanzie/by-tipologia/1?page=1&size=10&sezione=AUTO
```

**Risposta:**
```json
{
  "tipologia": {
    "id": 1,
    "nome": "Auto",
    "descrizione": "Assicurazione auto"
  },
  "garanzie": {
    "items": [
      {
        "id": 1,
        "sezione": "AUTO",
        "titolo": "Responsabilità Civile",
        "descrizione": "Copertura per danni a terzi",
        "tipologia": 1,
        "created_at": "2024-01-01T10:00:00Z",
        "updated_at": "2024-01-01T10:00:00Z"
      }
    ],
    "total": 25,
    "page": 1,
    "size": 10,
    "pages": 3
  }
}
```

### 2. GET `/garanzie/by-tipologia`

Recupera tutte le garanzie per una specifica tipologia assicurativa utilizzando il nome della tipologia.

**Parametri:**
- `nome` (query, obbligatorio): Nome della tipologia assicurativa
- `sezione` (query, opzionale): Filtra per sezione
- `search` (query, opzionale): Ricerca nel titolo e descrizione
- `page` (query, opzionale): Numero pagina (default: 1)
- `size` (query, opzionale): Dimensione pagina (default: 20, max: 100)
- `sort_by` (query, opzionale): Campo per ordinamento (default: "created_at")
- `sort_order` (query, opzionale): Ordine di ordinamento (asc/desc, default: "desc")

**Esempio di richiesta:**
```
GET /garanzie/by-tipologia?nome=Auto&search=responsabilità
```

**Risposta:** Stessa struttura dell'endpoint precedente.

### 3. GET `/garanzie/` (aggiornato)

L'endpoint principale è stato aggiornato per supportare il filtro per tipologia.

**Nuovo parametro aggiunto:**
- `tipologia_id` (query, opzionale): Filtra per tipologia assicurativa

**Esempio di richiesta:**
```
GET /garanzie/?tipologia_id=1&sezione=AUTO&page=1&size=20
```

## Modelli Aggiornati

### GaranziaBase
Aggiunto campo `tipologia`:
```python
tipologia: Optional[int] = Field(None, description="ID della tipologia assicurativa")
```

### GaranziaUpdate
Aggiunto campo `tipologia`:
```python
tipologia: Optional[int] = Field(None, description="ID della tipologia assicurativa")
```

### GaranziaFilter
Aggiunto campo `tipologia_id`:
```python
tipologia_id: Optional[int] = Field(None, description="Filtra per tipologia assicurativa")
```

### Nuovi Modelli

#### TipologiaInfo
```python
class TipologiaInfo(BaseModel):
    id: int
    nome: str
    descrizione: Optional[str] = None
```

#### GaranzieByTipologiaResponse
```python
class GaranzieByTipologiaResponse(BaseModel):
    tipologia: TipologiaInfo
    garanzie: GaranziaList
```

## Codici di Stato HTTP

- `200 OK`: Richiesta completata con successo
- `404 NOT FOUND`: Tipologia non trovata
- `422 UNPROCESSABLE ENTITY`: Parametri di input non validi
- `500 INTERNAL SERVER ERROR`: Errore interno del server

## Esempi di Utilizzo

### Recuperare garanzie per tipologia "Auto"
```bash
curl -X GET "http://localhost:8000/garanzie/by-tipologia/1" \
  -H "accept: application/json"
```

### Cercare garanzie per tipologia con filtri
```bash
curl -X GET "http://localhost:8000/garanzie/by-tipologia?nome=Auto&search=responsabilità&sezione=AUTO" \
  -H "accept: application/json"
```

### Filtrare garanzie nell'endpoint principale
```bash
curl -X GET "http://localhost:8000/garanzie/?tipologia_id=1&page=1&size=10" \
  -H "accept: application/json"
```

## Note Tecniche

1. **Relazione Database**: La tabella `garanzie` ha una colonna `tipologia` di tipo `bigint` che fa riferimento all'ID della tipologia assicurativa.

2. **Paginazione**: Tutti gli endpoint supportano la paginazione per gestire grandi quantità di dati.

3. **Filtri Combinabili**: È possibile combinare il filtro per tipologia con altri filtri come sezione e ricerca testuale.

4. **Ordinamento**: Supporto per ordinamento personalizzato su qualsiasi campo.

5. **Validazione**: Validazione completa dei parametri di input con messaggi di errore descrittivi.

6. **Logging**: Logging dettagliato per debugging e monitoraggio.

## Struttura del Database

La relazione tra le tabelle è:
- `tipologia_assicurazione` (1) -> `garanzie` (N)
- Ogni garanzia può appartenere a una sola tipologia
- Una tipologia può avere molte garanzie associate

## Testing

Per testare gli endpoint, assicurarsi che:
1. Il database Supabase sia configurato correttamente
2. Le tabelle `garanzie` e `tipologia_assicurazione` esistano
3. Ci siano dati di test nelle tabelle
4. La colonna `tipologia` nella tabella `garanzie` sia popolata con ID validi

## Swagger/OpenAPI

Gli endpoint sono automaticamente documentati in Swagger UI all'indirizzo:
```
http://localhost:8000/docs
```

Dove è possibile testare interattivamente tutti gli endpoint con i loro parametri e vedere le risposte in tempo reale.
