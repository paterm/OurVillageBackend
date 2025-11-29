const express = require('express');
const router = express.Router();
const marketplaceController = require('../controllers/marketplace.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validateId } = require('../middleware/validation.middleware');

// Публичные маршруты
router.get('/', marketplaceController.getItems);
router.get('/my', authenticate, marketplaceController.getMyItems);
router.get('/:id', validateId, marketplaceController.getItemById);

// Защищенные маршруты
router.post('/', authenticate, marketplaceController.createItem);
router.put('/:id', authenticate, validateId, marketplaceController.updateItem);
router.delete('/:id', authenticate, validateId, marketplaceController.deleteItem);

module.exports = router;

