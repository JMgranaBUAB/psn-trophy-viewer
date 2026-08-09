# ============================================
# Stage 1: Build del frontend React (Vite)
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias primero para aprovechar cache de Docker
COPY package.json package-lock.json ./

# Instalar TODAS las dependencias (incluyendo devDependencies para el build)
RUN npm ci

# Copiar el resto del código fuente
COPY . .

# Construir el frontend
RUN npm run build

# ============================================
# Stage 2: Servidor de producción
# ============================================
FROM node:20-alpine AS production

WORKDIR /app

# Copiar archivos de dependencias
COPY package.json package-lock.json ./

# Instalar solo dependencias de producción
RUN npm ci --omit=dev

# Copiar el backend (API + servidor)
COPY api/ ./api/
COPY server.js ./

# Copiar el frontend compilado desde el stage anterior
COPY --from=builder /app/dist ./dist

# Copiar el server de producción que sirve tanto la API como los estáticos
COPY docker-server.js ./docker-server.js

# Exponer el puerto del servidor
EXPOSE 3001

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3001

# Ejecutar el servidor de producción
CMD ["node", "docker-server.js"]
