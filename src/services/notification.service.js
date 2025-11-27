// TODO: Реализовать с TypeORM после создания Notification entity
const sendNotification = async (userId, type, data) => {
  console.log('Notification service: sendNotification called', { userId, type, data });
  // TODO: Реализовать
  return { id: 'temp', userId, type, data, isRead: false, createdAt: new Date() };
};

const getUserNotifications = async (userId, { page = 1, limit = 20 }) => {
  console.log('Notification service: getUserNotifications called', { userId, page, limit });
  return {
    notifications: [],
    pagination: { page: parseInt(page), limit: parseInt(limit), total: 0, pages: 0 }
  };
};

const markAsRead = async (notificationId, userId) => {
  console.log('Notification service: markAsRead called', { notificationId, userId });
  // TODO: Реализовать
};

const markAllAsRead = async (userId) => {
  console.log('Notification service: markAllAsRead called', { userId });
  // TODO: Реализовать
};

const sendSMSNotification = async (phone, message) => {
  console.log('Notification service: sendSMSNotification called', { phone, message });
  // TODO: Реализовать
};

module.exports = {
  sendNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  sendSMSNotification
};
