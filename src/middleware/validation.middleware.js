const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware для обработки ошибок валидации
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

/**
 * Валидация регистрации
 */
const validateRegister = [
  body('phone')
    .isMobilePhone('ru-RU')
    .withMessage('Invalid phone number format'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  handleValidationErrors
];

/**
 * Валидация входа
 */
const validateLogin = [
  body('phone')
    .isMobilePhone('ru-RU')
    .withMessage('Invalid phone number format'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

/**
 * Валидация создания объявления
 */
const validateCreateListing = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('Description must be between 10 and 5000 characters'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('category')
    .notEmpty()
    .withMessage('Category is required'),
  handleValidationErrors
];

/**
 * Валидация обновления профиля
 */
const validateUpdateProfile = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format'),
  handleValidationErrors
];

/**
 * Валидация ID параметра
 */
const validateId = [
  param('id')
    .isUUID()
    .withMessage('Invalid ID format'),
  handleValidationErrors
];

/**
 * Валидация listingId параметра
 */
const validateListingId = [
  param('listingId')
    .isUUID()
    .withMessage('Invalid listing ID format'),
  handleValidationErrors
];

/**
 * Валидация телефона (опциональная, для запроса verify-token)
 */
const validatePhone = [
  body('phone')
    .optional()
    .isMobilePhone('ru-RU')
    .withMessage('Invalid phone number format'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateRegister,
  validateLogin,
  validateCreateListing,
  validateUpdateProfile,
  validateId,
  validateListingId,
  validatePhone
};

