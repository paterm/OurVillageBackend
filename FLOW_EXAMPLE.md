# Полный поток работы с Telegram верификацией

## Сценарий 1: Регистрация нового пользователя

### Шаг 1: Регистрация
```javascript
POST /api/auth/register
{
  "phone": "+79991234567",
  "password": "password123",
  "name": "Иван Иванов"
}

Response:
{
  "user": {
    "id": "user-id",
    "phone": "+79991234567",
    "name": "Иван Иванов",
    "isVerified": false
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Registration successful. Please request verification token via Telegram."
}
```

### Шаг 2: Запрос токена верификации (БЕЗ токена в заголовке)
```javascript
POST /api/auth/telegram/verify-token
Content-Type: application/json

{
  "phone": "+79991234567"
}

Response:
{
  "verifyToken": "550e8400-e29b-41d4-a716-446655440000",
  "expiresAt": 1700856000000
}
```

### Шаг 3: Открытие Telegram
```javascript
const telegramLink = `https://t.me/OurVillageBot?start=${verifyToken}`;
window.open(telegramLink, '_blank');
```

### Шаг 4: Опрос статуса (каждые 2 секунды)
```javascript
GET /api/auth/telegram/verify-status/550e8400-e29b-41d4-a716-446655440000

// Пока не подтверждено:
Response: { "verified": false }

// После подтверждения ботом:
Response: {
  "verified": true,
  "user": { ... },
  "accessToken": "...",
  "refreshToken": "..."
}
```

### Шаг 5: Если токен истек (автоматически)
```javascript
// Проверяем expiresAt
if (Date.now() > expiresAt) {
  // Запрашиваем новый токен (С токеном в заголовке, если пользователь авторизован)
  POST /api/auth/telegram/verify-token
  Authorization: Bearer <accessToken>
  
  // Или без токена, если токен не сохранен
  POST /api/auth/telegram/verify-token
  {
    "phone": "+79991234567"
  }
}
```

## Сценарий 2: Авторизованный пользователь запрашивает новый токен

```javascript
POST /api/auth/telegram/verify-token
Authorization: Bearer <accessToken>
Content-Type: application/json

Response:
{
  "verifyToken": "550e8400-e29b-41d4-a716-446655440000",
  "expiresAt": 1700856000000
}
```

## Полный пример кода для фронтенда

```javascript
class TelegramVerification {
  constructor() {
    this.pollInterval = null;
  }

  // 1. Регистрация
  async register(phone, password, name) {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password, name })
    });
    
    const data = await response.json();
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    
    // Сразу запрашиваем токен верификации
    await this.requestVerificationToken(phone);
  }

  // 2. Запрос токена верификации
  async requestVerificationToken(phone = null) {
    const headers = { 'Content-Type': 'application/json' };
    const body = {};
    
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      // Если есть токен - используем его
      headers['Authorization'] = `Bearer ${accessToken}`;
    } else if (phone) {
      // Если нет токена - передаем phone
      body.phone = phone;
    } else {
      throw new Error('Either accessToken or phone is required');
    }
    
    const response = await fetch('/api/auth/telegram/verify-token', {
      method: 'POST',
      headers,
      body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined
    });
    
    if (!response.ok) {
      throw new Error('Failed to request verification token');
    }
    
    const { verifyToken, expiresAt } = await response.json();
    
    // Открываем Telegram
    const telegramLink = `https://t.me/OurVillageBot?start=${verifyToken}`;
    window.open(telegramLink, '_blank');
    
    // Начинаем опрос
    this.startPolling(verifyToken, expiresAt, phone);
  }

  // 3. Опрос статуса
  startPolling(token, expiresAt, phone = null) {
    // Останавливаем предыдущий опрос, если есть
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
    
    this.pollInterval = setInterval(async () => {
      // Проверяем истечение токена
      if (Date.now() > expiresAt) {
        clearInterval(this.pollInterval);
        console.log('Token expired, requesting new one...');
        
        // Автоматически запрашиваем новый токен
        try {
          await this.requestVerificationToken(phone);
        } catch (error) {
          console.error('Failed to request new token:', error);
          alert('Время верификации истекло. Запросите новую ссылку.');
        }
        return;
      }
      
      // Проверяем статус
      try {
        const response = await fetch(`/api/auth/telegram/verify-status/${token}`);
        const data = await response.json();
        
        if (data.verified) {
          clearInterval(this.pollInterval);
          
          // Сохраняем новые токены
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          
          // Обновляем пользователя
          this.onVerified(data.user);
        }
      } catch (error) {
        console.error('Error checking status:', error);
      }
    }, 2000); // Каждые 2 секунды
    
    // Останавливаем через 15 минут
    setTimeout(() => {
      if (this.pollInterval) {
        clearInterval(this.pollInterval);
      }
    }, 15 * 60 * 1000);
  }

  onVerified(user) {
    console.log('User verified:', user);
    // Обновить UI, показать уведомление и т.д.
    alert('Верификация успешна!');
  }
}

// Использование:
const verification = new TelegramVerification();

// После регистрации
await verification.register('+79991234567', 'password123', 'Иван Иванов');

// Или для авторизованного пользователя
await verification.requestVerificationToken();
```


