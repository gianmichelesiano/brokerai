# frontend/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copia package.json
COPY package*.json ./

# Installa dipendenze
RUN npm install

# Copia tutto il resto
COPY . .

# Porta
EXPOSE 3000

# Comando di default
CMD ["npm", "run", "dev"]