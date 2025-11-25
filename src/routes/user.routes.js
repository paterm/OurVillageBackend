const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const { validateUpdateProfile, validateId } = require('../middleware/validation.middleware');
const { uploadAvatar } = require('../middleware/upload.middleware');
const { uploadLimiter } = require('../middleware/rateLimit.middleware');

/**
 * @route   GET /api/users/profile
 * @desc    Получить профиль текущего пользователя
 * @access  Private
 */
router.get('/profile', authenticate, userController.getProfile);

/**
 * @route   PUT /api/users/profile
 * @desc    Обновить профиль пользователя
 * @access  Private
 */
router.put('/profile', authenticate, validateUpdateProfile, userController.updateProfile);

/**
 * @route   POST /api/users/avatar
 * @desc    Загрузить аватар пользователя
 * @access  Private
 */
router.post('/avatar', authenticate, uploadLimiter, uploadAvatar, userController.uploadAvatar);

/**
 * @route   GET /api/users
 * @desc    Получить список пользователей (для админа)
 * @access  Private/Admin
 */
router.get('/', authenticate, requireAdmin, userController.getUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Получить пользователя по ID
 * @access  Private
 */
router.get('/:id', authenticate, validateId, userController.getUserById);

module.exports = router;

