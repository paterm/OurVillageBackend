const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

const TELEGRAM_BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME || 'our_village';
const VERIFICATION_TOKEN_EXPIRY_MINUTES = 15;

/**
 * Генерировать токен верификации и создать запись
 */
const generateVerificationToken = async (userId) => {
  // Удаляем старые неиспользованные токены для этого пользователя
  await prisma.pendingVerification.deleteMany({
    where: {
      userId,
      expiresAt: {
        lt: new Date()
      }
    }
  });

  // Генерируем новый токен
  const verifyToken = uuidv4();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + VERIFICATION_TOKEN_EXPIRY_MINUTES);

  // Создаем запись
  await prisma.pendingVerification.create({
    data: {
      userId,
      verifyToken,
      expiresAt
    }
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
  const verification = await prisma.pendingVerification.findUnique({
    where: { verifyToken },
    include: {
      user: {
        select: {
          id: true,
          phone: true,
          name: true,
          isVerified: true
        }
      }
    }
  });

  if (!verification) {
    throw new Error('Invalid verification token');
  }

  if (verification.expiresAt < new Date()) {
    // Удаляем просроченный токен
    await prisma.pendingVerification.delete({
      where: { id: verification.id }
    });
    throw new Error('Verification token has expired');
  }

  return verification;
};

/**
 * Подтвердить пользователя через Telegram
 */
const confirmVerification = async (verifyToken, telegramId) => {
  const verification = await verifyToken(verifyToken);

  // Проверяем, не используется ли этот telegramId другим пользователем
  const existingUser = await prisma.user.findUnique({
    where: { telegramId }
  });

  if (existingUser && existingUser.id !== verification.userId) {
    throw new Error('This Telegram account is already linked to another user');
  }

  // Обновляем пользователя
  const user = await prisma.user.update({
    where: { id: verification.userId },
    data: {
      isVerified: true,
      telegramId
    }
  });

  // Удаляем использованный токен
  await prisma.pendingVerification.delete({
    where: { id: verification.id }
  });

  return user;
};

/**
 * Получить информацию о пользователе по verifyToken (для бота)
 */
const getUserByToken = async (verifyToken) => {
  const verification = await verifyToken(verifyToken);
  return verification.user;
};

/**
 * Очистить просроченные токены
 */
const cleanupExpiredTokens = async () => {
  const deleted = await prisma.pendingVerification.deleteMany({
    where: {
      expiresAt: {
        lt: new Date()
      }
    }
  });
  return deleted.count;
};

module.exports = {
  generateVerificationToken,
  verifyToken,
  confirmVerification,
  getUserByToken,
  cleanupExpiredTokens
};

