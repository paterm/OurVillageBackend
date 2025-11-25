const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const { validateId } = require('../middleware/validation.middleware');

/**
 * @route   GET /api/admin/stats
 * @desc    Получить статистику платформы
 * @access  Private/Admin
 */
router.get('/stats', authenticate, requireAdmin, adminController.getStats);

/**
 * @route   POST /api/admin/listings/:id/moderate
 * @desc    Модерировать объявление
 * @access  Private/Admin
 */
router.post(
  '/listings/:id/moderate',
  authenticate,
  requireAdmin,
  validateId,
  adminController.moderateListing
);

/**
 * @route   POST /api/admin/users/:id/ban
 * @desc    Заблокировать пользователя
 * @access  Private/Admin
 */
router.post(
  '/users/:id/ban',
  authenticate,
  requireAdmin,
  validateId,
  adminController.banUser
);

/**
 * @route   POST /api/admin/users/:id/unban
 * @desc    Разблокировать пользователя
 * @access  Private/Admin
 */
router.post(
  '/users/:id/unban',
  authenticate,
  requireAdmin,
  validateId,
  adminController.unbanUser
);

/**
 * @route   GET /api/admin/reports
 * @desc    Получить список жалоб
 * @access  Private/Admin
 */
router.get('/reports', authenticate, requireAdmin, adminController.getReports);

/**
 * @route   POST /api/admin/reports/:id/handle
 * @desc    Обработать жалобу
 * @access  Private/Admin
 */
router.post(
  '/reports/:id/handle',
  authenticate,
  requireAdmin,
  validateId,
  adminController.handleReport
);

module.exports = router;

