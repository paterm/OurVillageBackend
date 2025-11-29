const authService = require('../services/auth.service');

/**
 * Регистрация нового пользователя
 */
const register = async (req, res, next) => {
  try {
    const { phone, password, name } = req.body;
    const result = await authService.register(phone, password, name);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Вход пользователя
 */
const login = async (req, res, next) => {
  try {
    const { phone, password } = req.body;
    const result = await authService.login(phone, password);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Выход пользователя
 */
const logout = async (req, res, next) => {
  try {
    await authService.logout(req.user.id);
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Обновление токена
 */
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refreshToken(refreshToken);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Получить текущего пользователя по токену
 */
const getCurrentUser = async (req, res, next) => {
  try {
    // req.user уже установлен middleware authenticate
    const userService = require('../services/user.service');
    const user = await userService.getUserById(req.user.id);
    
    // Возвращаем только нужные поля
    res.status(200).json({
      id: user.id,
      phone: user.phone,
      name: user.name,
      email: user.email,
      firstName: user.name?.split(' ')[0] || user.name,
      lastName: user.name?.split(' ').slice(1).join(' ') || undefined,
      telegramId: user.telegramId,
      telegramUsername: user.telegramUsername,
      avatar: user.avatar,
      isVerified: user.isVerified,
      role: user.role,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Запросить новую ссылку для Telegram верификации
 */
const requestTelegramVerification = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await authService.requestTelegramVerification(userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  requestTelegramVerification,
  getCurrentUser,
};

