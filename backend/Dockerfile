# Backend ClicAgenda nueva app (Node/Express + MySQL)
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5001

# Ejecuta migraciones al arrancar y luego el servidor
CMD ["sh", "-c", "node scripts/setup-databases.js 2>/dev/null || true; exec node server.js"]
