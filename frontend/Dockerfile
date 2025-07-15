# frontend/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copia package.json
COPY package*.json ./

# Installa dipendenze
RUN npm install --legacy-peer-deps

# Copia tutto il resto
COPY . .

# Build per produzione
RUN npm run build

# Porta
EXPOSE 3000

# Comando di default per produzione
CMD ["npm", "run", "start"]
