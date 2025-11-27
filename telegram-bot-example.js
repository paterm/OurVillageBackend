/**
 * Пример кода для Telegram бота
 * 
 * Этот файл показывает, как должен работать бот для верификации пользователей.
 * Вы можете использовать библиотеку node-telegram-bot-api или telegraf.
 * 
 * Установка: npm install node-telegram-bot-api
 */

const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// Токен бота из BotFather
const BOT_TOKEN = '8237696982:AAFL5cqqsj42SZg8_wwcNpHhYZNx9UROhC4';

// URL вашего backend API
const API_URL = process.env.API_URL || 'http://localhost:3001';

// Имя бота (должно совпадать с TELEGRAM_BOT_USERNAME в .env)
const BOT_USERNAME = 'OurVillageBot';

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

  try {
    // Шаг 1: Проверяем токен через ваш API
    const verifyResponse = await axios.post(`${API_URL}/api/auth/telegram/bot/verify-token`, {
      verifyToken
    });

    if (!verifyResponse.data.valid) {
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
    const confirmResponse = await axios.post(`${API_URL}/api/auth/telegram/bot/confirm`, {
      verifyToken,
      telegramId,
      phone: phone, // Может быть null, если не предоставлен
      name: name
    });

    if (confirmResponse.data.success) {
      const user = confirmResponse.data.user;
      await bot.sendMessage(
        chatId,
        `✅ Верификация успешна!\n\n` +
        `Добро пожаловать, ${user.name}!\n` +
        `Ваш аккаунт подтвержден через Telegram.`
      );
    } else {
      await bot.sendMessage(chatId, `❌ Ошибка: ${confirmResponse.data.error}`);
    }
  } catch (error) {
    console.error('Error verifying user:', error.response?.data || error.message);
    
    if (error.response?.status === 400) {
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
  await bot.sendMessage(
    chatId,
    '👋 Добро пожаловать!\n\n' +
    'Для верификации аккаунта перейдите по ссылке из приложения MyVillage.'
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

