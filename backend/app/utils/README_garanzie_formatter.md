# Garanzie Formatter Utility

Questo modulo fornisce funzioni di utilità per formattare le garanzie del database in stringhe strutturate.

## 📁 File inclusi

- `garanzie_formatter.py` - Funzioni principali per il formatting
- `test_garanzie_formatter.py` - Script di test per verificare le funzioni
- `example_usage.py` - Esempi di utilizzo e integrazione con FastAPI
- `README_garanzie_formatter.md` - Questa documentazione

## 🎯 Funzione principale

### `get_all_garanzie_formatted()`

Recupera tutte le garanzie dal database e le formatta come stringhe nel formato richiesto:

```
Sezione: INFORTUNI; Garanzia: Invalidità permanente da infortunio
```

**Ritorna:** `List[str]` - Lista di stringhe formattate

**Esempio di utilizzo:**
```python
from app.utils.garanzie_formatter import get_all_garanzie_formatted

# Utilizzo asincrono
garanzie_formattate = await get_all_garanzie_formatted()

for garanzia in garanzie_formattate:
    print(garanzia)
```

## 🔧 Funzioni aggiuntive

### `get_garanzie_by_sezione_formatted(sezione_nome: str)`

Recupera le garanzie di una specifica sezione formattate.

**Parametri:**
- `sezione_nome` (str): Nome della sezione da filtrare

**Ritorna:** `List[str]` - Lista di stringhe formattate per la sezione

### `get_garanzie_count_by_sezione()`

Recupera il conteggio delle garanzie per ogni sezione.

**Ritorna:** `dict` - Dizionario con nome sezione come chiave e conteggio come valore

### `export_garanzie_formatted_to_text()`

Esporta tutte le garanzie formattate in un singolo testo con header informativo.

**Ritorna:** `str` - Testo completo con tutte le garanzie formattate

## 🧪 Testing

Per testare le funzioni, esegui:

```bash
cd backend/app/utils
python test_garanzie_formatter.py
```

Il test verificherà:
- ✅ Recupero di tutte le garanzie formattate
- ✅ Conteggio garanzie per sezione
- ✅ Filtro per sezione specifica
- ✅ Export in formato testo

## 🌐 Integrazione con FastAPI

Il file `example_usage.py` mostra come integrare le funzioni in endpoint API:

```python
# Aggiungi al tuo main.py
from app.utils.example_usage import router as garanzie_formatted_router

app.include_router(garanzie_formatted_router)
```

**Endpoint disponibili:**
- `GET /api/garanzie-formatted/all` - Tutte le garanzie formattate
- `GET /api/garanzie-formatted/by-sezione/{sezione_nome}` - Garanzie per sezione
- `GET /api/garanzie-formatted/count-by-sezione` - Conteggio per sezione
- `GET /api/garanzie-formatted/export-text` - Export completo in testo

## 📊 Struttura del database

Le funzioni si basano su queste tabelle:

- **garanzie**: Contiene id, titolo, sezione_id
- **sezioni**: Contiene id, nome, descrizione

La relazione è: `garanzie.sezione_id → sezioni.id`

## 🔍 Query utilizzate

La funzione principale utilizza questa query Supabase:

```python
result = client.table("garanzie").select(
    "id, titolo, sezioni(nome)"
).execute()
```

## ⚠️ Gestione errori

Tutte le funzioni includono:
- ✅ Logging dettagliato
- ✅ Gestione eccezioni
- ✅ Messaggi di errore informativi
- ✅ Fallback per dati mancanti

## 📝 Formato output

Ogni garanzia viene formattata come:
```
Sezione: {NOME_SEZIONE}; Garanzia: {TITOLO_GARANZIA}
```

**Esempi:**
```
Sezione: INFORTUNI; Garanzia: Invalidità permanente da infortunio
Sezione: MALATTIA; Garanzia: Rimborso spese mediche
Sezione: RESPONSABILITÀ CIVILE; Garanzia: Danni a terzi
```

## 🚀 Performance

- Le query utilizzano join ottimizzati
- Gestione efficiente della memoria per grandi dataset
- Logging per monitoraggio performance

## 📋 Requisiti

- Python 3.8+
- Supabase client
- Configurazione database valida in `app.config.database`

## 🔧 Configurazione

Assicurati che le variabili di ambiente per Supabase siano configurate:
- `SUPABASE_URL`
- `SUPABASE_KEY`
- `SUPABASE_SERVICE_KEY`

## 📞 Supporto

Per problemi o domande:
1. Controlla i log per errori specifici
2. Verifica la connessione al database
3. Testa con `test_garanzie_formatter.py`
4. Controlla la configurazione Supabase
