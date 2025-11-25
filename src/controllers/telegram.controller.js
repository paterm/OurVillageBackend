const telegramVerificationService = require('../services/telegram-verification.service');

/**
 * Endpoint для бота: проверка токена и получение информации о пользователе
 * Вызывается ботом при получении /start <verifyToken>
 */
const verifyToken = async (req, res, next) => {
  try {
    const { verifyToken } = req.body;
    
    if (!verifyToken) {
      return res.status(400).json({ error: 'verifyToken is required' });
    }

    const user = await telegramVerificationService.getUserByToken(verifyToken);
    
    res.status(200).json({
      valid: true,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        isVerified: user.isVerified
      }
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
 * Endpoint для бота: подтверждение верификации
 * Вызывается ботом после проверки токена
 */
const confirmVerification = async (req, res, next) => {
  try {
    const { verifyToken, telegramId } = req.body;
    
    if (!verifyToken || !telegramId) {
      return res.status(400).json({ 
        error: 'verifyToken and telegramId are required' 
      });
    }

    const user = await telegramVerificationService.confirmVerification(verifyToken, telegramId);
    
    res.status(200).json({
      success: true,
      message: 'User verified successfully',
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    if (error.message === 'Invalid verification token' || 
        error.message === 'Verification token has expired' ||
        error.message.includes('already linked')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    next(error);
  }
};

module.exports = {
  verifyToken,
  confirmVerification
};

