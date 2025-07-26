# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Installa dipendenze di sistema per Playwright
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Installa dipendenze Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Installa browser Playwright
RUN playwright install chromium
RUN playwright install-deps chromium

# Copia il codice
COPY . .

# Porta
EXPOSE 8000

# Comando di default (può essere sovrascritto dal docker-compose)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]