const express = require('express');
const router = express.Router();
const telegramController = require('../controllers/telegram.controller');

/**
 * @route   POST /api/telegram/verify-token
 * @desc    Проверить токен верификации (для бота)
 * @access  Public (используется ботом)
 */
router.post('/verify-token', telegramController.verifyToken);

/**
 * @route   POST /api/telegram/confirm
 * @desc    Подтвердить верификацию (для бота)
 * @access  Public (используется ботом)
 */
router.post('/confirm', telegramController.confirmVerification);

module.exports = router;

