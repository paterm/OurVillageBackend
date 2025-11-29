const marketplaceService = require('../services/marketplace.service');

/**
 * Создать новый товар
 */
const createItem = async (req, res, next) => {
  try {
    const item = await marketplaceService.createItem(req.body, req.user.id);
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
};

/**
 * Получить список товаров
 */
const getItems = async (req, res, next) => {
  try {
    const {
      search,
      category,
      status,
      page,
      limit,
      sortBy,
    } = req.query;
    
    const result = await marketplaceService.getItems({
      search,
      category,
      status,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      sortBy,
    });
    
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Получить товар по ID
 */
const getItemById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await marketplaceService.getItemById(id);
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    res.status(200).json(item);
  } catch (error) {
    next(error);
  }
};

/**
 * Обновить товар
 */
const updateItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await marketplaceService.updateItem(id, req.body, req.user.id);
    res.status(200).json(item);
  } catch (error) {
    next(error);
  }
};

/**
 * Удалить товар
 */
const deleteItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    await marketplaceService.deleteItem(id, req.user.id);
    res.status(200).json({ message: 'Item deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Получить товары текущего пользователя
 */
const getMyItems = async (req, res, next) => {
  try {
    const items = await marketplaceService.getUserItems(req.user.id);
    res.status(200).json(items);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createItem,
  getItems,
  getItemById,
  updateItem,
  deleteItem,
  getMyItems,
};

