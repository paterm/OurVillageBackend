const listingService = require('../services/listing.service');

/**
 * Создать новое объявление
 */
const createListing = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const listingData = { ...req.body, userId };
    const listing = await listingService.createListing(listingData, req.files);
    res.status(201).json(listing);
  } catch (error) {
    next(error);
  }
};

/**
 * Получить список объявлений
 */
const getListings = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, category, search, minPrice, maxPrice } = req.query;
    const filters = { category, search, minPrice, maxPrice };
    const result = await listingService.getListings({ page, limit, ...filters });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Получить объявление по ID
 */
const getListingById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const listing = await listingService.getListingById(id);
    res.status(200).json(listing);
  } catch (error) {
    next(error);
  }
};

/**
 * Обновить объявление
 */
const updateListing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updateData = req.body;
    const listing = await listingService.updateListing(id, userId, updateData, req.files);
    res.status(200).json(listing);
  } catch (error) {
    next(error);
  }
};

/**
 * Удалить объявление
 */
const deleteListing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    await listingService.deleteListing(id, userId);
    res.status(200).json({ message: 'Listing deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Получить объявления пользователя
 */
const getUserListings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const result = await listingService.getUserListings(userId, { page, limit });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createListing,
  getListings,
  getListingById,
  updateListing,
  deleteListing,
  getUserListings
};

