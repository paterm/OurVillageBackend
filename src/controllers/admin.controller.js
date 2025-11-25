const moderationService = require('../services/moderation.service');
const userService = require('../services/user.service');
const listingService = require('../services/listing.service');

/**
 * Получить статистику платформы
 */
const getStats = async (req, res, next) => {
  try {
    const stats = await moderationService.getPlatformStats();
    res.status(200).json(stats);
  } catch (error) {
    next(error);
  }
};

/**
 * Модерировать объявление
 */
const moderateListing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body; // action: 'approve', 'reject', 'ban'
    const result = await moderationService.moderateListing(id, action, reason);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Заблокировать пользователя
 */
const banUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason, duration } = req.body;
    const result = await moderationService.banUser(id, reason, duration);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Разблокировать пользователя
 */
const unbanUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await moderationService.unbanUser(id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Получить список жалоб
 */
const getReports = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const result = await moderationService.getReports({ page, limit, status });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Обработать жалобу
 */
const handleReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, resolution } = req.body;
    const result = await moderationService.handleReport(id, action, resolution);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStats,
  moderateListing,
  banUser,
  unbanUser,
  getReports,
  handleReport
};

