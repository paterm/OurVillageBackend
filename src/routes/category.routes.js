const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');

// Публичные маршруты
router.get('/', categoryController.getCategories);
router.get('/all', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);

// Защищенные маршруты (только для админов)
router.post('/', authenticate, requireAdmin, categoryController.createCategory);
router.put('/:id', authenticate, requireAdmin, categoryController.updateCategory);
router.delete('/:id', authenticate, requireAdmin, categoryController.deleteCategory);

module.exports = router;

