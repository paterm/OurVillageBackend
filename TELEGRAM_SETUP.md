# Настройка Telegram верификации

## Описание

Верификация пользователей теперь происходит через Telegram бота вместо SMS.

## Поток верификации

1. **Пользователь регистрируется** → получает `telegramLink` в ответе
2. **Пользователь нажимает на ссылку** → открывается Telegram с ботом
3. **Бот получает `/start <verifyToken>`** → проверяет токен через API
4. **Бот подтверждает верификацию** → пользователь получает `isVerified = true`

## API Endpoints

### Для фронтенда:

#### POST `/api/auth/register`
Регистрация пользователя. В ответе теперь есть `telegramLink`:

```json
{
  "user": { ... },
  "accessToken": "...",
  "refreshToken": "...",
  "telegramLink": "https://t.me/our_village?start=<verifyToken>",
  "message": "Please verify your account via Telegram"
}
```

#### POST `/api/auth/telegram/request`
Запросить новую ссылку для верификации (если старая истекла):

```json
{
  "telegramLink": "https://t.me/our_village?start=<verifyToken>",
  "expiresAt": "2024-11-24T20:00:00.000Z"
}
```

### Для бота:

#### POST `/api/auth/telegram/verify-token`
Проверить токен верификации:

**Request:**
```json
{
  "verifyToken": "uuid-token"
}
```

**Response (успех):**
```json
{
  "valid": true,
  "user": {
    "id": "user-id",
    "phone": "+79991234567",
    "name": "Иван",
    "isVerified": false
  }
}
```

**Response (ошибка):**
```json
{
  "valid": false,
  "error": "Invalid verification token"
}
```

#### POST `/api/auth/telegram/confirm`
Подтвердить верификацию:

**Request:**
```json
{
  "verifyToken": "uuid-token",
  "telegramId": "123456789"
}
```

**Response (успех):**
```json
{
  "success": true,
  "message": "User verified successfully",
  "user": {
    "id": "user-id",
    "phone": "+79991234567",
    "name": "Иван",
    "isVerified": true
  }
}
```

## Настройка бота

### 1. Создание бота

1. Откройте [@BotFather](https://t.me/BotFather) в Telegram
2. Отправьте `/newbot`
3. Следуйте инструкциям
4. Сохраните токен бота

### 2. Установка зависимостей

```bash
npm install node-telegram-bot-api
```

### 3. Запуск бота

Смотрите пример кода в файле `telegram-bot-example.js`

### 4. Переменные окружения

Добавьте в `.env`:

```env
TELEGRAM_BOT_TOKEN=8237696982:AAFL5cqqsj42SZg8_wwcNpHhYZNx9UROhC4
TELEGRAM_BOT_USERNAME=our_village
API_URL=http://localhost:3001
```

## Миграция базы данных

После обновления Prisma schema нужно выполнить миграцию:

```bash
# Локально
npm run db:migrate

# В Docker
docker-compose exec app npm run db:migrate
```

## Структура базы данных

### Новая таблица `pending_verifications`:

- `id` - UUID
- `userId` - ID пользователя
- `verifyToken` - Уникальный токен для верификации
- `expiresAt` - Время истечения токена (15 минут)
- `createdAt` - Время создания

### Обновление таблицы `users`:

- Добавлено поле `telegramId` - ID пользователя в Telegram (уникальное)

## Пример использования

### Фронтенд:

```javascript
// Регистрация
const response = await fetch('/api/auth/register', {
  method: 'POST',
  body: JSON.stringify({ phone, password, name })
});

const { telegramLink } = await response.json();

// Показываем пользователю кнопку или ссылку
window.open(telegramLink, '_blank');
```

### Бот:

Смотрите `telegram-bot-example.js` для полного примера.

## Безопасность

- Токены верификации действительны только 15 минут
- Токены одноразовые (удаляются после использования)
- Проверка на дублирование telegramId (один Telegram аккаунт = один пользователь)
- Автоматическая очистка просроченных токенов

