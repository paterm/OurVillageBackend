# Используем официальный Node.js LTS образ
FROM node:18-alpine

# Устанавливаем необходимые пакеты
RUN apk add --no-cache \
    openssl \
    postgresql-client \
    netcat-openbsd

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем все зависимости (включая dev для nodemon и prisma)
# Используем npm install для большей гибкости в разработке
RUN npm install

# Предзагружаем Prisma engines для избежания проблем при генерации
RUN npx prisma --version || true

# Копируем скрипты
COPY scripts ./scripts

# Копируем Prisma schema
COPY prisma ./prisma/

# Копируем исходный код
COPY . .

# Создаем директорию для uploads
RUN mkdir -p uploads/avatars uploads/listings

# Делаем скрипт wait-for-it.sh исполняемым
RUN chmod +x /app/scripts/wait-for-it.sh

# Создаем не-root пользователя для безопасности
RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001 -G nodejs

# Меняем владельца файлов
RUN chown -R appuser:nodejs /app

# Переключаемся на не-root пользователя
USER appuser

# Генерируем Prisma Client от имени appuser
RUN npx prisma generate

# Открываем порт
EXPOSE 3000

# Команда по умолчанию (будет переопределена в docker-compose)
CMD ["node", "src/app.js"]