# Base image
FROM node:20-alpine

# Directorio de trabajo
WORKDIR /app

# Instalar pnpm globalmente
RUN npm install -g pnpm

# Copiar package.json y lockfiles
COPY package.json pnpm-lock.yaml ./

# Instalar dependencias con pnpm
RUN pnpm install --frozen-lockfile

# Copiar el resto del código
COPY . .

# Build de NestJS
RUN npm run build

# Comando de producción
CMD ["node", "dist/main.js"]
