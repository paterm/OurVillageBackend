const listingService = require('../services/listing.service');

/**
 * Отправить сообщение
 */
const sendMessage = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const messageData = { ...req.body, senderId: userId };
    const message = await listingService.sendMessage(messageData);
    res.status(201).json(message);
  } catch (error) {
    next(error);
  }
};

/**
 * Получить переписку
 */
const getConversation = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const messages = await listingService.getConversation(conversationId, userId, { page, limit });
    res.status(200).json(messages);
  } catch (error) {
    next(error);
  }
};

/**
 * Получить список переписок пользователя
 */
const getConversations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const conversations = await listingService.getUserConversations(userId);
    res.status(200).json(conversations);
  } catch (error) {
    next(error);
  }
};

/**
 * Отметить сообщения как прочитанные
 */
const markAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;
    await listingService.markMessagesAsRead(conversationId, userId);
    res.status(200).json({ message: 'Messages marked as read' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendMessage,
  getConversation,
  getConversations,
  markAsRead
};

