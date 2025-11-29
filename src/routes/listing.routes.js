const express = require('express');
const router = express.Router();
const listingController = require('../controllers/listing.controller');
const reviewController = require('../controllers/review.controller');
const messageController = require('../controllers/message.controller');
const { authenticate, requireVerified } = require('../middleware/auth.middleware');
const { validateCreateListing, validateId, validateListingId } = require('../middleware/validation.middleware');
const { uploadListingImages } = require('../middleware/upload.middleware');
const { createListingLimiter } = require('../middleware/rateLimit.middleware');

/**
 * @route   POST /api/listings
 * @desc    Создать новое объявление
 * @access  Private/Verified
 */
router.post(
  '/',
  authenticate,
  createListingLimiter,
  uploadListingImages,
  validateCreateListing,
  listingController.createListing
);

/**
 * @route   GET /api/listings
 * @desc    Получить список объявлений
 * @access  Public
 */
router.get('/', listingController.getListings);

/**
 * @route   GET /api/listings/my
 * @desc    Получить объявления текущего пользователя
 * @access  Private
 */
router.get('/my', authenticate, listingController.getUserListings);

/**
 * @route   GET /api/listings/:id
 * @desc    Получить объявление по ID
 * @access  Public
 */
router.get('/:id', validateId, listingController.getListingById);

/**
 * @route   PUT /api/listings/:id
 * @desc    Обновить объявление
 * @access  Private
 */
router.put(
  '/:id',
  authenticate,
  validateId,
  uploadListingImages,
  listingController.updateListing
);

/**
 * @route   DELETE /api/listings/:id
 * @desc    Удалить объявление
 * @access  Private
 */
router.delete('/:id', authenticate, validateId, listingController.deleteListing);

/**
 * @route   POST /api/listings/:listingId/reviews
 * @desc    Создать отзыв
 * @access  Private/Verified
 */
router.post(
  '/:listingId/reviews',
  authenticate,
  requireVerified,
  validateListingId,
  reviewController.createReview
);

/**
 * @route   GET /api/listings/:listingId/reviews
 * @desc    Получить отзывы для объявления
 * @access  Public
 */
router.get('/:listingId/reviews', validateListingId, reviewController.getListingReviews);

/**
 * @route   PUT /api/listings/reviews/:id
 * @desc    Обновить отзыв
 * @access  Private
 */
router.put('/reviews/:id', authenticate, validateId, reviewController.updateReview);

/**
 * @route   DELETE /api/listings/reviews/:id
 * @desc    Удалить отзыв
 * @access  Private
 */
router.delete('/reviews/:id', authenticate, validateId, reviewController.deleteReview);

/**
 * @route   POST /api/listings/:listingId/messages
 * @desc    Отправить сообщение
 * @access  Private/Verified
 */
router.post(
  '/:listingId/messages',
  authenticate,
  requireVerified,
  validateId,
  messageController.sendMessage
);

/**
 * @route   GET /api/listings/messages/conversations
 * @desc    Получить список переписок пользователя
 * @access  Private
 */
router.get('/messages/conversations', authenticate, messageController.getConversations);

/**
 * @route   GET /api/listings/messages/conversations/:conversationId
 * @desc    Получить переписку
 * @access  Private
 */
router.get(
  '/messages/conversations/:conversationId',
  authenticate,
  validateId,
  messageController.getConversation
);

/**
 * @route   PUT /api/listings/messages/conversations/:conversationId/read
 * @desc    Отметить сообщения как прочитанные
 * @access  Private
 */
router.put(
  '/messages/conversations/:conversationId/read',
  authenticate,
  validateId,
  messageController.markAsRead
);

module.exports = router;

