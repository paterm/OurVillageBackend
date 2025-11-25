const { PrismaClient } = require('@prisma/client');
const smsService = require('../utils/sms');

const prisma = new PrismaClient();

/**
 * Отправить уведомление
 */
const sendNotification = async (userId, type, data) => {
  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      data: JSON.stringify(data),
      isRead: false
    }
  });

  // TODO: Отправить push-уведомление через WebSocket или FCM

  return notification;
};

/**
 * Получить уведомления пользователя
 */
const getUserNotifications = async (userId, { page = 1, limit = 20 }) => {
  const skip = (page - 1) * limit;

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    }),
    prisma.notification.count({ where: { userId } })
  ]);

  return {
    notifications,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Отметить уведомление как прочитанное
 */
const markAsRead = async (notificationId, userId) => {
  await prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId
    },
    data: {
      isRead: true
    }
  });
};

/**
 * Отметить все уведомления как прочитанные
 */
const markAllAsRead = async (userId) => {
  await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false
    },
    data: {
      isRead: true
    }
  });
};

/**
 * Отправить SMS уведомление
 */
const sendSMSNotification = async (phone, message) => {
  await smsService.sendSMS(phone, message);
};

module.exports = {
  sendNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  sendSMSNotification
};

