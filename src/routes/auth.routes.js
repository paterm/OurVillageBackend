const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { validateRegister, validateLogin } = require('../middleware/validation.middleware');
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

module.exports = router;

