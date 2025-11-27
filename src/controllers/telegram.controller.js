const telegramVerificationService = require('../services/telegram-verification.service');
const jwt = require('jsonwebtoken');

/**
 * Генерация JWT токенов
 */
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

/**
 * POST /api/auth/telegram/verify-token
 * Генерирует одноразовый токен для верификации через Telegram
 * 
 * Теперь токен генерируется без привязки к пользователю.
 * Пользователь будет создан/обновлен при подтверждении верификации в Telegram.
 */
const generateVerifyToken = async (req, res, next) => {
  try {
    // Генерируем токен без привязки к пользователю
    // userId будет null, пользователь создастся при подтверждении в Telegram
    const verification = await telegramVerificationService.generateVerificationToken(null);
    
    res.status(200).json({
      verifyToken: verification.verifyToken,
      expiresAt: verification.expiresAt.getTime(), // timestamp
      telegramLink: verification.telegramLink
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Endpoint для бота: проверка токена и получение информации о пользователе
 * Вызывается ботом при получении /start <verifyToken>
 */
const verifyTokenForBot = async (req, res, next) => {
  try {
    const { verifyToken } = req.body;
    
    if (!verifyToken) {
      return res.status(400).json({ error: 'verifyToken is required' });
    }

    const user = await telegramVerificationService.getUserByToken(verifyToken);
    
    // Если пользователь еще не создан (userId был null), возвращаем valid: true, но user: null
    res.status(200).json({
      valid: true,
      user: user ? {
        id: user.id,
        phone: user.phone,
        name: user.name,
        isVerified: user.isVerified
      } : null
    });
  } catch (error) {
    if (error.message === 'Invalid verification token' || error.message === 'Verification token has expired') {
      return res.status(400).json({
        valid: false,
        error: error.message
      });
    }
    next(error);
  }
};

/**
 * GET /api/auth/telegram/verify-status/:token
 * Проверяет статус верификации по токену
 */
const getVerificationStatus = async (req, res, next) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    const status = await telegramVerificationService.getVerificationStatus(token);
    
    if (!status.verified) {
      return res.status(200).json({
        verified: false
      });
    }

    // Если верификация подтверждена, генерируем токены доступа
    const tokens = generateTokens(status.user.id);
    
    res.status(200).json({
      verified: true,
      user: status.user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Endpoint для бота: подтверждение верификации
 * Вызывается ботом после проверки токена
 * Принимает данные пользователя из Telegram (telegramId, phone, name)
 */
const confirmVerification = async (req, res, next) => {
  try {
    const { verifyToken, telegramId, phone, name } = req.body;
    
    if (!verifyToken || !telegramId) {
      return res.status(400).json({ 
        error: 'verifyToken and telegramId are required' 
      });
    }

    const user = await telegramVerificationService.confirmVerification(
      verifyToken, 
      telegramId, 
      phone, 
      name
    );
    
    res.status(200).json({
      success: true,
      message: 'User verified successfully',
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        isVerified: user.isVerified,
        telegramId: user.telegramId
      }
    });
  } catch (error) {
    if (error.message === 'Invalid verification token' || 
        error.message === 'Verification token has expired' ||
        error.message.includes('already linked') ||
        error.message.includes('already registered')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    next(error);
  }
};

module.exports = {
  generateVerifyToken,
  verifyTokenForBot,
  getVerificationStatus,
  confirmVerification
};

