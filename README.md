# BrokerAI

BrokerAI è una piattaforma intelligente per la gestione e il confronto di polizze assicurative, sviluppata con FastAPI (backend) e Next.js (frontend).

## 🚀 Caratteristiche

- **Backend FastAPI**: API REST robusta e performante
- **Frontend Next.js**: Interfaccia utente moderna e reattiva
- **Database Supabase**: Database PostgreSQL gestito con autenticazione e storage
- **Docker**: Containerizzazione completa
- **Nginx**: Reverse proxy e load balancing
- **CI/CD**: Pipeline automatizzata con GitHub Actions

## 📋 Prerequisiti

- Docker e Docker Compose
- Git
- Node.js 18+ (per sviluppo locale)
- Python 3.11+ (per sviluppo locale)

## 🛠️ Installazione e Setup

### Sviluppo con Docker

1. **Clona il repository**
   ```bash
   git clone <repository-url>
   cd brokerai
   ```

2. **Configura le variabili d'ambiente**
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   
   # Frontend
   cp frontend/.env.local.example frontend/.env.local
   ```

3. **Avvia i servizi**
   ```bash
   docker-compose up -d
   ```

4. **Accedi all'applicazione**
   - Frontend: http://localhost
   - Backend API: http://localhost/api
   - Database: Supabase (configurato tramite variabili d'ambiente)

### Sviluppo Locale

#### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🏗️ Architettura

```
brokerai/
├── backend/                 # FastAPI application
│   ├── app/
│   │   ├── models/         # Database models
│   │   ├── routers/        # API endpoints
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utilities
│   ├── tests/              # Backend tests
│   └── Dockerfile
├── frontend/               # Next.js application
│   ├── app/               # App router pages
│   ├── components/        # React components
│   ├── hooks/            # Custom hooks
│   ├── lib/              # Utilities
│   └── Dockerfile
├── nginx/                 # Nginx configuration
│   ├── nginx.conf
│   └── Dockerfile
├── .github/workflows/     # CI/CD pipelines
├── docker-compose.yml     # Development setup
└── docker-compose.prod.yml # Production setup
```

## 🔧 Comandi Utili

### Docker
```bash
# Avvia tutti i servizi
docker-compose up -d

# Visualizza i logs
docker-compose logs -f

# Ricostruisci i container
docker-compose up --build

# Ferma tutti i servizi
docker-compose down

# Pulisci volumi e immagini
docker-compose down -v
docker system prune -a
```

### Database (Supabase)
```bash
# Il database è gestito da Supabase
# Configura le credenziali nel file .env:
# SUPABASE_URL=your-supabase-url
# SUPABASE_KEY=your-supabase-anon-key
# SUPABASE_SERVICE_KEY=your-supabase-service-key

# Test connessione database
curl http://localhost:8000/health
```

### Testing
```bash
# Test backend
cd backend
python -m pytest tests/ -v

# Test frontend
cd frontend
npm run test
```

## 🚀 Deploy in Produzione

### Configurazione Server

1. **Installa Docker e Docker Compose sul server**

2. **Clona il repository**
   ```bash
   git clone <repository-url> /opt/brokerai
   cd /opt/brokerai
   ```

3. **Configura le variabili d'ambiente per la produzione**
   ```bash
   # Crea i file di configurazione
   cp backend/.env.example backend/.env
   cp frontend/.env.local.example frontend/.env.local
   
   # Modifica con i valori di produzione
   nano backend/.env
   nano frontend/.env.local
   ```

4. **Avvia in produzione**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

### CI/CD con GitHub Actions

Il progetto include una pipeline CI/CD automatizzata che:

1. **Test**: Esegue test automatici su backend e frontend
2. **Build**: Costruisce le immagini Docker
3. **Deploy**: Distribuisce automaticamente su push al branch `main`

#### Configurazione Secrets GitHub

Aggiungi questi secrets nel repository GitHub:

- `SERVER_HOST`: IP/hostname del server di produzione
- `SERVER_USER`: Username SSH
- `SERVER_SSH_KEY`: Chiave privata SSH
- `SERVER_PORT`: Porta SSH (opzionale, default 22)

## 📊 Monitoraggio

### Health Checks
- Backend: `GET /health`
- Frontend: Disponibile tramite Nginx
- Database: Connessione Supabase verificata tramite backend health check

### Logs
```bash
# Visualizza logs di tutti i servizi
docker-compose logs -f

# Logs di un servizio specifico
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f nginx
```

## 🔒 Sicurezza

- **HTTPS**: Configurato per produzione
- **Security Headers**: Implementati in Nginx
- **Database**: Connessioni sicure tramite Supabase
- **Secrets Management**: Gestione sicura delle credenziali
- **User Permissions**: Container non-root

## 🤝 Contribuire

1. Fork del repository
2. Crea un branch per la feature (`git checkout -b feature/AmazingFeature`)
3. Commit delle modifiche (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## 📝 License

Questo progetto è sotto licenza MIT. Vedi il file `LICENSE` per i dettagli.

## 📞 Supporto

Per supporto e domande:
- Apri un issue su GitHub
- Contatta il team di sviluppo

## 🔄 Changelog

### v1.0.0
- Setup iniziale del progetto
- Implementazione backend FastAPI
- Implementazione frontend Next.js
- Containerizzazione Docker
- Pipeline CI/CD
