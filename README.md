# BrokerAI

BrokerAI is an intelligent platform for managing and comparing insurance policies, developed with FastAPI (backend) and Next.js (frontend).

## 🚀 Features

- **FastAPI Backend**: Robust and performant REST API
- **Next.js Frontend**: Modern and responsive user interface
- **Supabase Database**: Managed PostgreSQL database with authentication and storage
- **Docker**: Complete containerization
- **Nginx**: Reverse proxy and load balancing
- **CI/CD**: Automated pipeline with GitHub Actions

## 📋 Prerequisites

- Docker and Docker Compose
- Git
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

## 🛠️ Installation and Setup

### Development with Docker

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd brokerai
   ```

2. **Configure environment variables**
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   
   # Frontend
   cp frontend/.env.local.example frontend/.env.local
   ```

3. **Start services**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Frontend: http://localhost
   - Backend API: http://localhost/api
   - Database: Supabase (configured via environment variables)

### Local Development

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

## 🏗️ Architecture

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

## 🔧 Useful Commands

### Docker
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Rebuild containers
docker-compose up --build

# Stop all services
docker-compose down

# Clean volumes and images
docker-compose down -v
docker system prune -a
```

### Database (Supabase)
```bash
# Database is managed by Supabase
# Configure credentials in .env file:
# SUPABASE_URL=your-supabase-url
# SUPABASE_KEY=your-supabase-anon-key
# SUPABASE_SERVICE_KEY=your-supabase-service-key

# Test database connection
curl http://localhost:8000/health
```

### Testing
```bash
# Backend tests
cd backend
python -m pytest tests/ -v

# Frontend tests
cd frontend
npm run test
```

## 🚀 Production Deployment

### Server Configuration

1. **Install Docker and Docker Compose on server**

2. **Clone the repository**
   ```bash
   git clone <repository-url> /opt/brokerai
   cd /opt/brokerai
   ```

3. **Configure environment variables for production**
   ```bash
   # Create configuration files
   cp backend/.env.example backend/.env
   cp frontend/.env.local.example frontend/.env.local
   
   # Edit with production values
   nano backend/.env
   nano frontend/.env.local
   ```

4. **Start in production**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

### CI/CD with GitHub Actions

The project includes an automated CI/CD pipeline that:

1. **Test**: Runs automated tests on backend and frontend
2. **Build**: Builds Docker images
3. **Deploy**: Automatically deploys on push to `main` branch

#### GitHub Secrets Configuration

Add these secrets to the GitHub repository:

- `SERVER_HOST`: Production server IP/hostname
- `SERVER_USER`: SSH username
- `SERVER_SSH_KEY`: SSH private key
- `SERVER_PORT`: SSH port (optional, default 22)

## 📊 Monitoring

### Health Checks
- Backend: `GET /health`
- Frontend: Available through Nginx
- Database: Supabase connection verified via backend health check

### Logs
```bash
# View logs for all services
docker-compose logs -f

# Logs for specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f nginx
```

## 🔒 Security

- **HTTPS**: Configured for production
- **Security Headers**: Implemented in Nginx
- **Database**: Secure connections via Supabase
- **Secrets Management**: Secure credential management
- **User Permissions**: Non-root containers

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License. See the `LICENSE` file for details.

## 📞 Support

For support and questions:
- Open an issue on GitHub
- Contact the development team

## 🔄 Changelog

### v1.0.0
- Initial project setup
- FastAPI backend implementation
- Next.js frontend implementation
- Docker containerization
- CI/CD pipeline



# 1. Verifica setup
npm run test:setup

# 2. Configura prodotti Autumn
npm run setup:autumn

# 3. Configura Stripe Portal
npm run setup:stripe-portal

# 4. Avvia il server
npm run dev

# 5. Visita la pagina prezzi
# http://localhost:3000/pricing