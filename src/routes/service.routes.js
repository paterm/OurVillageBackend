const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/service.controller');
const { authenticate, requireVerified } = require('../middleware/auth.middleware');
const { validateCreateListing, validateId } = require('../middleware/validation.middleware');
const { uploadListingImages } = require('../middleware/upload.middleware');
const { createListingLimiter } = require('../middleware/rateLimit.middleware');

/**
 * @route   POST /api/services
 * @desc    Создать новую услугу
 * @access  Private/Verified
 */
router.post(
  '/',
  authenticate,
  requireVerified,
  createListingLimiter,
  uploadListingImages,
  validateCreateListing,
  serviceController.createService
);

/**
 * @route   GET /api/services
 * @desc    Получить список услуг
 * @access  Public
 */
router.get('/', serviceController.getServices);

/**
 * @route   GET /api/services/:id
 * @desc    Получить услугу по ID
 * @access  Public
 */
router.get('/:id', validateId, serviceController.getServiceById);

/**
 * @route   PUT /api/services/:id
 * @desc    Обновить услугу
 * @access  Private
 */
router.put(
  '/:id',
  authenticate,
  validateId,
  uploadListingImages,
  serviceController.updateService
);

/**
 * @route   DELETE /api/services/:id
 * @desc    Удалить услугу
 * @access  Private
 */
router.delete('/:id', authenticate, validateId, serviceController.deleteService);

module.exports = router;

