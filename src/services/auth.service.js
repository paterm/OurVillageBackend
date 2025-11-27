const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getRepository } = require('../utils/database');
const { User } = require('../entities/User');
const telegramVerificationService = require('./telegram-verification.service');

/**
 * Регистрация нового пользователя
 */
const register = async (phone, password, name) => {
  const userRepo = getRepository(User);
  
  // Проверка существования пользователя
  const existingUser = await userRepo.findOne({
    where: { phone }
  });

  if (existingUser) {
    throw new Error('User with this phone already exists');
  }

  // Хеширование пароля
  const hashedPassword = await bcrypt.hash(password, 10);

  // Создание пользователя
  const user = await userRepo.save({
    phone,
    password: hashedPassword,
    name
  });

  // Возвращаем только нужные поля
  const userData = {
    id: user.id,
    phone: user.phone,
    name: user.name,
    isVerified: user.isVerified
  };

  const tokens = generateTokens(user.id);

  return {
    user: userData,
    ...tokens,
    message: 'Registration successful. Please request verification token via Telegram.'
  };
};

/**
 * Вход пользователя
 */
const login = async (phone, password) => {
  const userRepo = getRepository(User);
  
  const user = await userRepo.findOne({
    where: { phone }
  });

  if (!user) {
    throw new Error('Invalid credentials');
  }

  if (user.isBanned) {
    throw new Error('User is banned');
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw new Error('Invalid credentials');
  }

  const tokens = generateTokens(user.id);

  return {
    user: {
      id: user.id,
      phone: user.phone,
      name: user.name,
      isVerified: user.isVerified
    },
    ...tokens
  };
};

/**
 * Выход пользователя
 */
const logout = async (userId) => {
  // TODO: Добавить токен в черный список (Redis)
  return { message: 'Logged out successfully' };
};

/**
 * Обновление токена
 */
const refreshToken = async (refreshToken) => {
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const tokens = generateTokens(decoded.userId);
    return tokens;
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};

/**
 * Генерация новой ссылки для Telegram верификации
 */
const requestTelegramVerification = async (userId) => {
  const verification = await telegramVerificationService.generateVerificationToken(userId);
  return {
    telegramLink: verification.telegramLink,
    expiresAt: verification.expiresAt
  };
};

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

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  requestTelegramVerification
};
