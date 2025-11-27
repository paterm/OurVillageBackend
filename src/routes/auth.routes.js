const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const telegramController = require('../controllers/telegram.controller');
const { validateRegister, validateLogin, validatePhone } = require('../middleware/validation.middleware');
const { authLimiter } = require('../middleware/rateLimit.middleware');
const { authenticate } = require('../middleware/auth.middleware');

/**
 * @route   POST /api/auth/register
 * @desc    Регистрация нового пользователя
 * @access  Public
 */
router.post('/register', authLimiter, validateRegister, authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Вход пользователя
 * @access  Public
 */
router.post('/login', authLimiter, validateLogin, authController.login);

/**
 * @route   POST /api/auth/logout
 * @desc    Выход пользователя
 * @access  Private
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @route   POST /api/auth/refresh
 * @desc    Обновление токена
 * @access  Public
 */
router.post('/refresh', authController.refreshToken);

/**
 * @route   POST /api/auth/telegram/request
 * @desc    Запросить новую ссылку для Telegram верификации
 * @access  Private
 */
router.post('/telegram/request', authenticate, authController.requestTelegramVerification);

/**
 * @route   POST /api/auth/telegram/verify-token
 * @desc    Генерирует одноразовый токен для верификации через Telegram
 * @access  Public
 * @note    Токен генерируется без привязки к пользователю.
 *          Пользователь будет создан/обновлен при подтверждении верификации в Telegram.
 */
router.post('/telegram/verify-token', telegramController.generateVerifyToken);

/**
 * @route   GET /api/auth/telegram/verify-status/:token
 * @desc    Проверяет статус верификации по токену
 * @access  Public
 */
router.get('/telegram/verify-status/:token', telegramController.getVerificationStatus);

/**
 * @route   POST /api/auth/telegram/bot/verify-token
 * @desc    Проверить токен верификации (для бота)
 * @access  Public (используется ботом)
 */
router.post('/telegram/bot/verify-token', telegramController.verifyTokenForBot);

/**
 * @route   POST /api/auth/telegram/bot/confirm
 * @desc    Подтвердить верификацию (для бота)
 * @access  Public (используется ботом)
 */
router.post('/telegram/bot/confirm', telegramController.confirmVerification);

module.exports = router;

