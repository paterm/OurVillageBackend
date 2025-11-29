const listingService = require('../services/listing.service');

/**
 * Создать отзыв
 */
const createReview = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { listingId } = req.params;
    const reviewData = { ...req.body, userId, listingId };
    const review = await listingService.createReview(reviewData);
    res.status(201).json(review);
  } catch (error) {
    next(error);
  }
};

/**
 * Получить отзывы для объявления
 */
const getListingReviews = async (req, res, next) => {
  try {
    const { listingId } = req.params;
    const { page = 1, limit = 10, ratingFilter = 'all' } = req.query;
    const result = await listingService.getListingReviews(listingId, { 
      page: parseInt(page), 
      limit: parseInt(limit),
      ratingFilter 
    });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Обновить отзыв
 */
const updateReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updateData = req.body;
    const review = await listingService.updateReview(id, userId, updateData);
    res.status(200).json(review);
  } catch (error) {
    next(error);
  }
};

/**
 * Удалить отзыв
 */
const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    await listingService.deleteReview(id, userId);
    res.status(200).json({ message: 'Review deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReview,
  getListingReviews,
  updateReview,
  deleteReview
};

