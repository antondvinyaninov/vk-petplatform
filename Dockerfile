# Этап 1: Сборка фронтенда
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY vk_petplatform/package*.json vk_petplatform/.npmrc ./
RUN npm install --legacy-peer-deps
COPY vk_petplatform/ ./
RUN npm run build

# Этап 2: Сборка бэкенда
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json backend/.npmrc ./
RUN npm install --legacy-peer-deps
COPY backend/ ./
# Генерация Prisma Client
RUN npx prisma generate
# Компиляция TypeScript
RUN npm run build

# Этап 3: Финальный образ
FROM node:20-slim
WORKDIR /app

# Установка необходимых библиотек для Prisma
RUN apt-get update && apt-get install -y openssl libssl-dev && rm -rf /var/lib/apt/lists/*

# Копируем скомпилированный бэкенд
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules
COPY --from=backend-builder /app/backend/package*.json ./backend/
COPY --from=backend-builder /app/backend/prisma ./backend/prisma

# Копируем собранный фронтенд в папку public бэкенда
COPY --from=frontend-builder /app/frontend/build ./backend/public

EXPOSE 3001
WORKDIR /app/backend

# Переменные окружения по умолчанию
ENV NODE_ENV=production
ENV PORT=3001

CMD ["node", "dist/index.js"]
