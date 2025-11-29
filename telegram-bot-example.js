/**
 * Telegram бот для верификации пользователей
 * 
 * Запуск: npm run bot
 * Или с автоперезагрузкой: npm run bot:dev
 */

require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// Токен бота из BotFather (из .env или переменной окружения)
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('❌ Ошибка: TELEGRAM_BOT_TOKEN не установлен в .env файле');
  console.error('Добавьте в .env: TELEGRAM_BOT_TOKEN=your_bot_token');
  process.exit(1);
}

// URL вашего backend API
const API_URL = process.env.API_URL || 'http://localhost:3001';

// Имя бота (должно совпадать с TELEGRAM_BOT_USERNAME в .env)
const BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME || 'OurVillageBot';

console.log(`🤖 Запуск бота: ${BOT_USERNAME}`);
console.log(`📡 Backend API: ${API_URL}`);

// Создаем экземпляр бота
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

/**
 * Обработчик команды /start
 * Формат: /start <verifyToken>
 */
bot.onText(/\/start (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id.toString();
  const verifyToken = match[1]; // Токен из параметра start

  console.log(`📨 Получена команда /start с токеном`);
  console.log(`📨 Полный текст сообщения: ${msg.text}`);
  console.log(`📨 Извлеченный токен: ${verifyToken}`);
  console.log(`📨 Длина токена: ${verifyToken.length}`);

  try {
    // Шаг 1: Проверяем токен через ваш API
    console.log(`🔍 Проверка токена через API: ${API_URL}/api/auth/telegram/bot/verify-token`);
    const verifyResponse = await axios.post(`${API_URL}/api/auth/telegram/bot/verify-token`, {
      verifyToken
    });

    console.log('✅ Токен проверен:', verifyResponse.data);

    if (!verifyResponse.data.valid) {
      console.log('❌ Токен недействителен');
      await bot.sendMessage(chatId, '❌ Токен верификации недействителен или истек срок действия.');
      return;
    }

    // Получаем данные пользователя из Telegram
    const telegramUser = msg.from;
    const name = `${telegramUser.first_name}${telegramUser.last_name ? ' ' + telegramUser.last_name : ''}`.trim();
    
    // Если пользователь уже существует, используем его данные
    const existingUser = verifyResponse.data.user;
    let phone = existingUser?.phone || null;

    // Если номера телефона нет, можно запросить его через кнопку
    // Для упрощения, используем данные из контакта, если они доступны
    if (!phone && msg.contact) {
      phone = msg.contact.phone_number;
    }

    // Шаг 2: Если токен валиден, подтверждаем верификацию с данными из Telegram
    console.log(`✅ Подтверждение верификации для пользователя: ${name} (${telegramId})`);
    const confirmResponse = await axios.post(`${API_URL}/api/auth/telegram/bot/confirm`, {
      verifyToken,
      telegramId,
      phone: phone, // Может быть null, если не предоставлен
      name: name
    });

    console.log('📝 Ответ от API confirm:', confirmResponse.data);

    if (confirmResponse.data.success) {
      const user = confirmResponse.data.user;
      console.log(`✅ Верификация успешна для пользователя: ${user.name} (${user.id})`);
      await bot.sendMessage(
        chatId,
        `✅ Верификация успешна!\n\n` +
        `Добро пожаловать, ${user.name}!\n` +
        `Ваш аккаунт подтвержден через Telegram.`
      );
    } else {
      console.log('❌ Ошибка подтверждения:', confirmResponse.data.error);
      await bot.sendMessage(chatId, `❌ Ошибка: ${confirmResponse.data.error}`);
    }
  } catch (error) {
    console.error('❌ Ошибка при верификации:', error.message);
    console.error('Детали ошибки:', error.response?.data || error.stack);
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      console.error(`❌ Не удалось подключиться к API: ${API_URL}`);
      await bot.sendMessage(
        chatId,
        '❌ Ошибка подключения к серверу. Пожалуйста, попробуйте позже.'
      );
    } else if (error.response?.status === 400) {
      await bot.sendMessage(chatId, `❌ ${error.response.data.error || 'Токен недействителен'}`);
    } else {
      await bot.sendMessage(chatId, '❌ Произошла ошибка при верификации. Попробуйте позже.');
    }
  }
});

/**
 * Обработчик получения контакта (если пользователь отправил свой номер телефона)
 */
bot.on('contact', async (msg) => {
  const chatId = msg.chat.id;
  const contact = msg.contact;
  
  // Если это контакт пользователя (не из телефонной книги)
  if (contact.user_id === msg.from.id) {
    // Можно сохранить номер телефона для текущей сессии верификации
    // Для этого нужно хранить состояние (verifyToken) в памяти или БД
    // Здесь просто показываем сообщение
    await bot.sendMessage(
      chatId,
      '📱 Спасибо за предоставление номера телефона!\n\n' +
      'Для верификации перейдите по ссылке из приложения.'
    );
  }
});

/**
 * Обработчик команды /start без параметров
 */
bot.onText(/\/start$/, async (msg) => {
  const chatId = msg.chat.id;
  console.log(`📨 Получена команда /start БЕЗ токена от пользователя ${msg.from.id}`);
  console.log(`📨 Полный текст сообщения: ${msg.text}`);
  console.log(`📨 Все данные сообщения:`, JSON.stringify(msg, null, 2));
  
  await bot.sendMessage(
    chatId,
    '👋 Добро пожаловать!\n\n' +
    'Для верификации аккаунта перейдите по ссылке из приложения MyVillage.\n\n' +
    '⚠️ Важно: Если вы копируете ссылку из браузера, убедитесь, что скопировали полную ссылку, включая токен после `?start=`.\n\n' +
    'Пример правильной ссылки:\n' +
    '`https://t.me/OurVillageBot?start=abc123...`\n\n' +
    'Если вы видите это сообщение после перехода по ссылке, возможно токен был потерян при копировании.'
  );
});

/**
 * Обработчик ошибок
 */
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

console.log('🤖 Telegram bot is running...');

// Для использования с webhook вместо polling:
// bot.setWebHook(`${API_URL}/api/telegram/webhook`);

