# API для Telegram верификации

## Поток верификации

1. **Пользователь запрашивает токен** → `POST /api/auth/telegram/verify-token`
2. **Пользователь переходит по ссылке** → открывается Telegram с ботом
3. **Бот подтверждает верификацию** → `POST /api/auth/telegram/bot/confirm`
4. **Фронтенд опрашивает статус** → `GET /api/auth/telegram/verify-status/:token`
5. **Когда verified = true** → фронтенд получает токены доступа

## Endpoints

### 1. POST `/api/auth/telegram/verify-token`

Генерирует одноразовый токен для верификации через Telegram.

**Доступ:** Public (может работать с токеном или без)

**Вариант 1: Без токена (при регистрации)**
```json
{
  "phone": "+79991234567"
}
```

**Вариант 2: С токеном (при обновлении истекшего токена)**
```
Headers:
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "verifyToken": "550e8400-e29b-41d4-a716-446655440000",
  "expiresAt": 1700856000000
}
```

**Пример использования (после регистрации, без токена):**
```javascript
// После регистрации, когда токена еще нет
const response = await fetch('/api/auth/telegram/verify-token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    phone: '+79991234567'  // Телефон из регистрации
  })
});

const { verifyToken, expiresAt } = await response.json();
const telegramLink = `https://t.me/OurVillageBot?start=${verifyToken}`;
window.open(telegramLink, '_blank');
```

**Пример использования (с токеном, при обновлении):**
```javascript
// Когда токен истек и пользователь авторизован
const response = await fetch('/api/auth/telegram/verify-token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`  // Токен из localStorage
  }
});

const { verifyToken, expiresAt } = await response.json();
const telegramLink = `https://t.me/OurVillageBot?start=${verifyToken}`;
window.open(telegramLink, '_blank');
```

---

### 2. GET `/api/auth/telegram/verify-status/:token`

Проверяет статус верификации по токену.

**Доступ:** Public

**Параметры:**
- `token` (в URL) - токен верификации

**Response (если не подтверждено):**
```json
{
  "verified": false
}
```

**Response (если подтверждено):**
```json
{
  "verified": true,
  "user": {
    "id": "user-id",
    "phone": "+79991234567",
    "name": "Иван",
    "email": "ivan@example.com",
    "avatar": "https://...",
    "isVerified": true,
    "telegramId": "123456789"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Пример использования (опрос статуса):**
```javascript
const checkStatus = async (token) => {
  const response = await fetch(`/api/auth/telegram/verify-status/${token}`);
  const data = await response.json();
  
  if (data.verified) {
    // Сохраняем токены
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    // Обновляем пользователя
    setUser(data.user);
  } else {
    // Продолжаем опрос
    setTimeout(() => checkStatus(token), 2000);
  }
};

// Начинаем опрос после перехода по ссылке
checkStatus(verifyToken);
```

---

### 3. POST `/api/auth/telegram/bot/verify-token`

Проверить токен верификации (для бота).

**Доступ:** Public (используется ботом)

**Request:**
```json
{
  "verifyToken": "550e8400-e29b-41d4-a716-446655440000"
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

---

### 4. POST `/api/auth/telegram/bot/confirm`

Подтвердить верификацию (для бота).

**Доступ:** Public (используется ботом)

**Request:**
```json
{
  "verifyToken": "550e8400-e29b-41d4-a716-446655440000",
  "telegramId": "123456789"
}
```

**Response:**
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

---

## Полный пример для фронтенда

```javascript
// 1. Регистрация пользователя
const register = async (phone, password, name) => {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, password, name })
  });
  
  const { user, accessToken, refreshToken } = await response.json();
  
  // Сохраняем токены
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
  
  // Запрашиваем токен верификации (БЕЗ токена в заголовке)
  await startVerification(phone);
};

// 2. Запрос токена верификации
const startVerification = async (phone, useAuthToken = false) => {
  try {
    const headers = { 'Content-Type': 'application/json' };
    const body = {};
    
    if (useAuthToken) {
      // Если пользователь авторизован - используем токен
      headers['Authorization'] = `Bearer ${localStorage.getItem('accessToken')}`;
    } else {
      // Если нет токена - передаем phone
      body.phone = phone;
    }
    
    const response = await fetch('/api/auth/telegram/verify-token', {
      method: 'POST',
      headers,
      body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined
    });
    
    const { verifyToken, expiresAt } = await response.json();
    
    // Формируем ссылку
    const telegramLink = `https://t.me/OurVillageBot?start=${verifyToken}`;
    
    // Открываем Telegram
    window.open(telegramLink, '_blank');
    
    // Начинаем опрос статуса
    pollVerificationStatus(verifyToken, expiresAt);
  } catch (error) {
    console.error('Error starting verification:', error);
  }
};

// 3. Опрос статуса верификации
const pollVerificationStatus = (token, expiresAt, phone = null) => {
  const checkInterval = setInterval(async () => {
    // Проверяем, не истек ли токен
    if (Date.now() > expiresAt) {
      clearInterval(checkInterval);
      
      // Автоматически запрашиваем новый токен
      const accessToken = localStorage.getItem('accessToken');
      if (accessToken) {
        // Если есть токен - используем его
        await startVerification(phone, true);
      } else if (phone) {
        // Если нет токена - используем phone
        await startVerification(phone, false);
      } else {
        alert('Время верификации истекло. Запросите новую ссылку.');
      }
      return;
    }
    
    try {
      const response = await fetch(`/api/auth/telegram/verify-status/${token}`);
      const data = await response.json();
      
      if (data.verified) {
        clearInterval(checkInterval);
        
        // Сохраняем токены
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        
        // Обновляем пользователя
        setUser(data.user);
        
        alert('Верификация успешна!');
      }
    } catch (error) {
      console.error('Error checking status:', error);
    }
  }, 2000); // Проверяем каждые 2 секунды
  
  // Останавливаем опрос через 15 минут
  setTimeout(() => {
    clearInterval(checkInterval);
  }, 15 * 60 * 1000);
};
```

## Миграция базы данных

После обновления Prisma schema нужно выполнить миграцию:

```bash
# Локально
npm run db:migrate

# В Docker
docker-compose exec app npm run db:migrate
```

