const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { getRepository } = require('../utils/database');
const { User } = require('../entities/User');
const { PendingVerification } = require('../entities/PendingVerification');

const TELEGRAM_BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME || 'our_village';
const VERIFICATION_TOKEN_EXPIRY_MINUTES = 15;

/**
 * Генерировать токен верификации и создать запись
 * userId может быть null - пользователь будет создан при подтверждении
 */
const generateVerificationToken = async (userId) => {
  const verificationRepo = getRepository(PendingVerification);
  
  // Удаляем старые неиспользованные токены (если userId указан)
  if (userId) {
    await verificationRepo
      .createQueryBuilder()
      .delete()
      .where('userId = :userId', { userId })
      .andWhere('expiresAt < :now', { now: new Date() })
      .execute();
  }

  // Генерируем новый токен
  const verifyToken = uuidv4();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + VERIFICATION_TOKEN_EXPIRY_MINUTES);

  // Создаем запись (userId может быть null)
  await verificationRepo.save({
    userId: userId || null,
    verifyToken,
    expiresAt,
    verified: false,
  });

  // Формируем ссылку на бота
  const telegramLink = `https://t.me/${TELEGRAM_BOT_USERNAME}?start=${verifyToken}`;

  return {
    verifyToken,
    telegramLink,
    expiresAt
  };
};

/**
 * Проверить токен и получить информацию о пользователе
 */
const verifyToken = async (verifyToken) => {
  const verificationRepo = getRepository(PendingVerification);
  
  const verification = await verificationRepo.findOne({
    where: { verifyToken },
    relations: ['user'],
  });

  if (!verification) {
    throw new Error('Invalid verification token');
  }

  if (new Date(verification.expiresAt) < new Date()) {
    // Удаляем просроченный токен
    await verificationRepo.delete(verification.id);
    throw new Error('Verification token has expired');
  }

  return verification;
};

/**
 * Подтвердить пользователя через Telegram
 * Создает нового пользователя или обновляет существующего на основе данных из Telegram
 */
const confirmVerification = async (verifyToken, telegramId, phone, name) => {
  const verification = await verifyToken(verifyToken);
  const userRepo = getRepository(User);
  const verificationRepo = getRepository(PendingVerification);

  // Проверяем, не используется ли этот telegramId другим пользователем
  const existingUserByTelegram = await userRepo.findOne({
    where: { telegramId }
  });

  if (existingUserByTelegram && existingUserByTelegram.id !== verification.userId) {
    throw new Error('This Telegram account is already linked to another user');
  }

  let user;

  if (verification.userId) {
    // Если пользователь уже существует - обновляем его
    // Проверяем, не используется ли phone другим пользователем
    if (phone) {
      const existingUserByPhone = await userRepo.findOne({
        where: { phone }
      });
      
      if (existingUserByPhone && existingUserByPhone.id !== verification.userId) {
        throw new Error('This phone number is already registered');
      }
    }

    user = await userRepo.save({
      id: verification.userId,
      isVerified: true,
      telegramId,
      ...(phone && { phone }),
      ...(name && { name })
    });
  } else {
    // Если пользователя нет - создаем нового
    // Проверяем, не существует ли пользователь с таким telegramId или phone
    if (phone) {
      const existingUserByPhone = await userRepo.findOne({
        where: { phone }
      });
      
      if (existingUserByPhone) {
        // Если пользователь с таким phone существует - обновляем его
        user = await userRepo.save({
          id: existingUserByPhone.id,
          isVerified: true,
          telegramId,
          ...(name && { name })
        });
      } else {
        // Создаем нового пользователя
        // Генерируем случайный пароль (пользователь не будет использовать его, так как вход только через Telegram)
        const randomPassword = crypto.randomBytes(32).toString('hex');
        const hashedPassword = await bcrypt.hash(randomPassword, 10);

        user = await userRepo.save({
          phone: phone || null,
          password: hashedPassword,
          name: name || `User_${telegramId}`,
          telegramId,
          isVerified: true
        });
      }
    } else {
      // Если phone не предоставлен, создаем пользователя только с telegramId
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      user = await userRepo.save({
        phone: null,
        password: hashedPassword,
        name: name || `User_${telegramId}`,
        telegramId,
        isVerified: true
      });
    }

    // Обновляем verification с userId
    await verificationRepo.update(
      verification.id,
      { userId: user.id }
    );
  }

  // Помечаем верификацию как подтвержденную
  await verificationRepo.update(
    verification.id,
    {
      verified: true,
      telegramId,
      verifiedAt: new Date()
    }
  );

  return user;
};

/**
 * Проверить статус верификации по токену
 */
const getVerificationStatus = async (verifyToken) => {
  const verificationRepo = getRepository(PendingVerification);
  
  const verification = await verificationRepo.findOne({
    where: { verifyToken },
    relations: ['user'],
  });

  if (!verification) {
    return { verified: false };
  }

  if (new Date(verification.expiresAt) < new Date()) {
    // Удаляем просроченный токен
    await verificationRepo.delete(verification.id);
    return { verified: false };
  }

  return {
    verified: verification.verified,
    user: verification.verified && verification.user ? verification.user : undefined
  };
};

/**
 * Получить информацию о пользователе по verifyToken (для бота)
 * Возвращает null, если пользователь еще не создан
 */
const getUserByToken = async (verifyToken) => {
  const verification = await verifyToken(verifyToken);
  return verification.user || null;
};

/**
 * Очистить просроченные токены
 */
const cleanupExpiredTokens = async () => {
  const verificationRepo = getRepository(PendingVerification);
  const result = await verificationRepo
    .createQueryBuilder()
    .delete()
    .where('expiresAt < :now', { now: new Date() })
    .execute();
  return result.affected || 0;
};

module.exports = {
  generateVerificationToken,
  verifyToken,
  confirmVerification,
  getUserByToken,
  getVerificationStatus,
  cleanupExpiredTokens
};
