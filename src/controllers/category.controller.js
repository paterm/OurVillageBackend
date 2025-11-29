const categoryService = require('../services/category.service');

/**
 * Получить дерево категорий
 */
const getCategories = async (req, res, next) => {
  try {
    const categories = await categoryService.getCategoriesTree();
    console.log(`📦 Returning ${categories.length} root categories`);
    res.status(200).json(categories);
  } catch (error) {
    console.error('❌ Error in getCategories:', error);
    next(error);
  }
};

/**
 * Получить все категории (плоский список)
 */
const getAllCategories = async (req, res, next) => {
  try {
    const categories = await categoryService.getAllCategories();
    res.status(200).json(categories);
  } catch (error) {
    next(error);
  }
};

/**
 * Получить категорию по ID
 */
const getCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const category = await categoryService.getCategoryById(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.status(200).json(category);
  } catch (error) {
    next(error);
  }
};

/**
 * Создать категорию
 */
const createCategory = async (req, res, next) => {
  try {
    const category = await categoryService.createCategory(req.body);
    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
};

/**
 * Обновить категорию
 */
const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const category = await categoryService.updateCategory(id, req.body);
    res.status(200).json(category);
  } catch (error) {
    next(error);
  }
};

/**
 * Удалить категорию
 */
const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    await categoryService.deleteCategory(id);
    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};

