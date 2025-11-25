const listingService = require('../services/listing.service');

/**
 * Создать новую услугу
 */
const createService = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const serviceData = { ...req.body, userId, type: 'service' };
    const service = await listingService.createListing(serviceData, req.files);
    res.status(201).json(service);
  } catch (error) {
    next(error);
  }
};

/**
 * Получить список услуг
 */
const getServices = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;
    const filters = { category, search, type: 'service' };
    const result = await listingService.getListings({ page, limit, ...filters });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Получить услугу по ID
 */
const getServiceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const service = await listingService.getListingById(id);
    res.status(200).json(service);
  } catch (error) {
    next(error);
  }
};

/**
 * Обновить услугу
 */
const updateService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updateData = req.body;
    const service = await listingService.updateListing(id, userId, updateData, req.files);
    res.status(200).json(service);
  } catch (error) {
    next(error);
  }
};

/**
 * Удалить услугу
 */
const deleteService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    await listingService.deleteListing(id, userId);
    res.status(200).json({ message: 'Service deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createService,
  getServices,
  getServiceById,
  updateService,
  deleteService
};

