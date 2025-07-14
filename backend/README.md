# 🛡️ Policy Comparator Backend

Sistema di Confronto Garanzie Assicurative - Backend API con FastAPI

## 📋 Panoramica

Backend API per il sistema di confronto garanzie assicurative, costruito con FastAPI e integrato con Supabase per il database e OpenAI per l'analisi AI delle polizze.

### ✨ Funzionalità Principali

- **CRUD Garanzie**: Gestione completa delle garanzie assicurative
- **CRUD Compagnie**: Gestione compagnie con upload e analisi file polizze
- **Analisi AI**: Integrazione OpenAI per analisi automatica delle coperture
- **Sistema Mapping**: Relazioni garanzia-compagnia con confidence AI
- **Confronti**: Sistema di confronto tra compagnie con analisi comparativa
- **File Processing**: Estrazione testo da PDF e DOCX
- **API RESTful**: Endpoints completi con documentazione automatica

## 🏗️ Architettura

```
backend/
├── app/
│   ├── main.py                    # FastAPI app entry point
│   ├── config/                    # Configurazioni
│   │   ├── settings.py           # Settings con Pydantic
│   │   └── database.py           # Setup Supabase client
│   ├── models/                    # Pydantic models
│   │   ├── garanzie.py
│   │   ├── compagnie.py
│   │   ├── mapping.py
│   │   └── confronti.py
│   ├── services/                  # Business logic
│   │   ├── file_processor.py     # Elaborazione file
│   │   ├── ai_analyzer.py        # Servizio OpenAI
│   │   ├── garanzie_service.py   # Logic garanzie
│   │   ├── compagnie_service.py  # Logic compagnie
│   │   └── confronto_service.py  # Logic confronti
│   ├── routers/                   # API endpoints
│   │   ├── garanzie.py
│   │   ├── compagnie.py
│   │   ├── mapping.py
│   │   ├── confronti.py
│   │   └── upload.py
│   └── utils/                     # Utilities
│       └── exceptions.py         # Custom exceptions
├── requirements.txt
├── .env.example
└── README.md
```

## 🚀 Quick Start

### 1. Prerequisiti

- Python 3.9+
- Account Supabase
- API Key OpenAI
- Redis (opzionale, per caching)

### 2. Installazione

```bash
# Clone del repository
git clone <repository-url>
cd policy-comparator/backend

# Creazione ambiente virtuale
python -m venv venv
source venv/bin/activate  # Linux/Mac
# oppure
venv\Scripts\activate     # Windows

# Installazione dipendenze
pip install -r requirements.txt
```

### 3. Configurazione

```bash
# Copia file di configurazione
cp .env.example .env

# Modifica le variabili d'ambiente
nano .env
```

#### Variabili Essenziali

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key

# OpenAI
OPENAI_API_KEY=sk-your-openai-key

# Security
SECRET_KEY=your-secret-key-here
```

### 4. Setup Database

Esegui gli script SQL dal `project.md` nel tuo progetto Supabase:

```sql
-- Tabelle principali
CREATE TABLE garanzie (...);
CREATE TABLE compagnie (...);
CREATE TABLE garanzia_compagnia (...);
CREATE TABLE confronti_coperture (...);

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('polizze', 'polizze', false);
```

### 5. Avvio Applicazione

```bash
# Sviluppo
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Produzione
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

L'API sarà disponibile su:
- **API**: http://localhost:8000
- **Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 📚 API Endpoints

### Garanzie
- `GET /api/garanzie` - Lista garanzie con filtri
- `POST /api/garanzie` - Crea nuova garanzia
- `GET /api/garanzie/{id}` - Dettaglio garanzia
- `PUT /api/garanzie/{id}` - Aggiorna garanzia
- `DELETE /api/garanzie/{id}` - Elimina garanzia
- `GET /api/garanzie/sezioni` - Lista sezioni

### Compagnie
- `GET /api/compagnie` - Lista compagnie
- `POST /api/compagnie` - Crea compagnia
- `POST /api/compagnie/{id}/upload` - Upload file polizza
- `POST /api/compagnie/{id}/extract-text` - Estrai testo
- `GET /api/compagnie/search` - Ricerca full-text

### Mapping & Analisi
- `GET /api/mapping/matrix` - Matrice coperture
- `POST /api/mapping/analyze/{compagnia_id}` - Analisi AI
- `POST /api/mapping/test` - Test singola garanzia
- `GET /api/mapping/stats` - Statistiche

### Confronti
- `GET /api/confronti` - Lista confronti
- `POST /api/confronti/compare` - Esegui confronto
- `POST /api/confronti` - Salva confronto
- `GET /api/confronti/{id}/export` - Export CSV

## 🔧 Configurazione Avanzata

### File Processing

```python
# Formati supportati
ALLOWED_FILE_TYPES = ["pdf", "docx", "doc"]
MAX_FILE_SIZE = 52428800  # 50MB

# Configurazione estrazione
PDF_MAX_PAGES = 500
TEXT_EXTRACTION_TIMEOUT = 300
```

### AI Analysis

```python
# OpenAI Settings
OPENAI_MODEL = "gpt-4o-mini"
OPENAI_MAX_TOKENS = 2000
OPENAI_TEMPERATURE = 0.1

# Retry Logic
AI_RETRY_ATTEMPTS = 3
AI_RETRY_DELAY = 1.0
AI_CONFIDENCE_THRESHOLD = 0.7
```

### Rate Limiting

```python
RATE_LIMIT_PER_MINUTE = 60
OPENAI_RATE_LIMIT_PER_MINUTE = 10
```

## 🧪 Testing

```bash
# Installazione dipendenze test
pip install pytest pytest-asyncio pytest-cov

# Esecuzione test
pytest

# Test con coverage
pytest --cov=app --cov-report=html
```

### Test Endpoints

```bash
# Health check
curl http://localhost:8000/health

# Test garanzie
curl http://localhost:8000/api/garanzie

# Test con autenticazione
curl -H "Authorization: Bearer <token>" http://localhost:8000/api/garanzie
```

## 📊 Monitoring

### Health Checks

```bash
GET /health
{
  "status": "healthy",
  "service": "Policy Comparator API",
  "version": "1.0.0",
  "environment": "development"
}
```

### Database Health

```bash
GET /api/health/database
{
  "database_connected": true,
  "tables_accessible": {...},
  "storage_accessible": true,
  "total_records": {...}
}
```

### Logs

```python
# Configurazione logging
LOG_LEVEL = "INFO"
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

# Structured logging
import structlog
logger = structlog.get_logger()
```

## 🔒 Sicurezza

### Autenticazione

```python
# JWT Configuration
SECRET_KEY = "your-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
```

### CORS

```python
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://your-frontend-domain.com"
]
```

### File Upload Security

- Validazione tipo file
- Limite dimensione file
- Scansione malware (opzionale)
- Quarantena file sospetti

## 🚀 Deploy

### Docker

```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Docker Compose

```yaml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - ENVIRONMENT=production
    env_file:
      - .env
  
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
```

### Variabili Produzione

```env
ENVIRONMENT=production
DEBUG=false
SHOW_DOCS=false
ALLOWED_ORIGINS=["https://your-domain.com"]
```

## 📈 Performance

### Caching

```python
# Redis caching
CACHE_ENABLED = true
CACHE_TTL = 3600
CACHE_MAX_SIZE = 1000
```

### Database Optimization

```python
# Connection pooling
DATABASE_POOL_SIZE = 10
DATABASE_MAX_OVERFLOW = 20
DB_POOL_RECYCLE = 3600
```

### Background Tasks

```python
# Celery configuration
CELERY_BROKER_URL = "redis://localhost:6379/0"
CELERY_RESULT_BACKEND = "redis://localhost:6379/0"
```

## 🐛 Troubleshooting

### Problemi Comuni

1. **Errore connessione Supabase**
   ```bash
   # Verifica URL e chiavi
   curl -H "apikey: YOUR_ANON_KEY" https://your-project.supabase.co/rest/v1/
   ```

2. **Errore OpenAI API**
   ```bash
   # Verifica quota e chiave
   curl -H "Authorization: Bearer YOUR_API_KEY" https://api.openai.com/v1/models
   ```

3. **Errore upload file**
   ```bash
   # Verifica permessi storage
   # Controlla dimensione file
   # Verifica formato supportato
   ```

### Debug Mode

```python
# Abilita debug dettagliato
DEBUG = true
LOG_LEVEL = "DEBUG"

# Mostra stack trace completi
SHOW_ERROR_DETAILS = true
```

## 🤝 Contribuire

1. Fork del repository
2. Crea feature branch (`git checkout -b feature/amazing-feature`)
3. Commit delle modifiche (`git commit -m 'Add amazing feature'`)
4. Push al branch (`git push origin feature/amazing-feature`)
5. Apri Pull Request

### Code Style

```bash
# Formatting
black app/
isort app/

# Linting
flake8 app/
mypy app/

# Security check
bandit -r app/
```

## 📄 Licenza

Questo progetto è sotto licenza MIT. Vedi il file `LICENSE` per dettagli.

## 🆘 Supporto

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Documentazione**: [Docs](https://docs.your-domain.com)
- **Email**: support@your-domain.com

---

**Policy Comparator Backend** - Sistema di Confronto Garanzie Assicurative
