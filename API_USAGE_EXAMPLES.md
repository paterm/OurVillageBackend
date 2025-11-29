# Примеры использования API

## Telegram верификация

### 1. Регистрация пользователя

После регистрации вы сразу получаете `verifyToken` и `telegramLink`:

```javascript
// POST /api/auth/register
const response = await fetch('http://localhost:3001/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    phone: '+79991234567',
    password: 'password123',
    name: 'Иван Иванов'
  })
});

const data = await response.json();
// {
//   "user": { ... },
//   "accessToken": "...",
//   "refreshToken": "...",
//   "verifyToken": "550e8400-e29b-41d4-a716-446655440000",
//   "telegramLink": "https://t.me/OurVillageBot?start=550e8400-e29b-41d4-a716-446655440000",
//   "expiresAt": 1700856000000,
//   "message": "Please verify your account via Telegram"
// }

// Сохраняем токены
localStorage.setItem('accessToken', data.accessToken);
localStorage.setItem('refreshToken', data.refreshToken);

// Открываем Telegram
window.open(data.telegramLink, '_blank');

// Начинаем опрос статуса
pollVerificationStatus(data.verifyToken, data.expiresAt);
```

### 2. Запрос нового токена верификации (если старый истек)

Если токен истек, можно запросить новый, используя accessToken:

```javascript
// POST /api/auth/telegram/verify-token
const response = await fetch('http://localhost:3001/api/auth/telegram/verify-token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}` // ⚠️ ВАЖНО: передаем токен в заголовке!
  }
});

const data = await response.json();
// {
//   "verifyToken": "550e8400-e29b-41d4-a716-446655440000",
//   "expiresAt": 1700856000000
// }

const telegramLink = `https://t.me/OurVillageBot?start=${data.verifyToken}`;
window.open(telegramLink, '_blank');
pollVerificationStatus(data.verifyToken, data.expiresAt);
```

**⚠️ ВАЖНО:** Токен должен быть передан в заголовке `Authorization` в формате:
```
Authorization: Bearer <your-access-token>
```

### 3. Проверка статуса верификации

```javascript
// GET /api/auth/telegram/verify-status/:token
const checkStatus = async (token) => {
  const response = await fetch(`http://localhost:3001/api/auth/telegram/verify-status/${token}`);
  const data = await response.json();
  
  if (data.verified) {
    // Верификация подтверждена!
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    setUser(data.user);
    return true;
  }
  return false;
};

// Опрос каждые 2 секунды
const pollVerificationStatus = (token, expiresAt) => {
  const interval = setInterval(async () => {
    if (Date.now() > expiresAt) {
      clearInterval(interval);
      alert('Время верификации истекло');
      return;
    }
    
    const verified = await checkStatus(token);
    if (verified) {
      clearInterval(interval);
      alert('Верификация успешна!');
    }
  }, 2000);
  
  // Останавливаем через 15 минут
  setTimeout(() => clearInterval(interval), 15 * 60 * 1000);
};
```

## Частые ошибки

### "No token provided"

Эта ошибка возникает, когда:
1. Не передан заголовок `Authorization`
2. Заголовок передан в неправильном формате

**Правильный формат:**
```javascript
headers: {
  'Authorization': 'Bearer <your-token>'  // ✅ Правильно
}
```

**Неправильные форматы:**
```javascript
headers: {
  'Authorization': '<your-token>'  // ❌ Неправильно - нет "Bearer "
  'authorization': 'Bearer <your-token>'  // ❌ Неправильно - маленькие буквы (может не работать)
  'Token': 'Bearer <your-token>'  // ❌ Неправильно - не тот заголовок
}
```

### "Invalid token" или "Token expired"

- Токен невалиден или истек
- Используйте `refreshToken` для получения нового `accessToken`

### "User not found"

- Пользователь был удален из базы данных
- Токен содержит несуществующий userId


