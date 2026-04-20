# Этап 1: Сборка фронтенда
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY vk_petplatform/package*.json ./
RUN npm install
COPY vk_petplatform/ ./
RUN npm run build

# Этап 2: Сборка бэкенда
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./
# Генерация Prisma Client
RUN npx prisma generate
# Компиляция TypeScript
RUN npm run build

# Этап 3: Финальный образ
FROM node:20-alpine
WORKDIR /app

# Копируем скомпилированный бэкенд
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules
COPY --from=backend-builder /app/backend/package*.json ./backend/
COPY --from=backend-builder /app/backend/prisma ./backend/prisma

# Копируем собранный фронтенд в папку public бэкенда
COPY --from=frontend-builder /app/frontend/build ./backend/public

EXPOSE 3001
WORKDIR /app/backend

# Переменные окружения по умолчанию (можно переопределить в Easypanel)
ENV NODE_ENV=production
ENV PORT=3001

CMD ["node", "dist/index.js"]
