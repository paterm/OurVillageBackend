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
    const verifyResponse = await axios.post(`${API_URL}/api/telegram/verify-token`, {
      verifyToken
    });

    if (!verifyResponse.data.valid) {
      await bot.sendMessage(chatId, '❌ Токен верификации недействителен или истек срок действия.');
      return;
    }

    const user = verifyResponse.data.user;

    // Шаг 2: Если токен валиден, подтверждаем верификацию
    const confirmResponse = await axios.post(`${API_URL}/api/telegram/confirm`, {
      verifyToken,
      telegramId
    });

    if (confirmResponse.data.success) {
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

