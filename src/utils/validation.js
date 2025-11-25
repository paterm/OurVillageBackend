const validator = require('validator');

/**
 * Валидация телефона (российский формат)
 */
const validatePhone = (phone) => {
  // Удаляем все нецифровые символы
  const cleaned = phone.replace(/\D/g, '');
  
  // Проверяем формат: начинается с 7 или 8, затем 10 цифр
  if (cleaned.length === 11 && (cleaned.startsWith('7') || cleaned.startsWith('8'))) {
    return `+7${cleaned.slice(1)}`;
  }
  
  if (cleaned.length === 10) {
    return `+7${cleaned}`;
  }
  
  return null;
};

/**
 * Валидация email
 */
const validateEmail = (email) => {
  return validator.isEmail(email);
};

/**
 * Валидация пароля
 */
const validatePassword = (password) => {
  // Минимум 6 символов, хотя бы одна цифра и одна буква
  if (password.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters' };
  }
  
  if (!/\d/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  
  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one letter' };
  }
  
  return { valid: true };
};

/**
 * Валидация цены
 */
const validatePrice = (price) => {
  const num = parseFloat(price);
  return !isNaN(num) && num >= 0;
};

/**
 * Валидация UUID
 */
const validateUUID = (id) => {
  return validator.isUUID(id);
};

/**
 * Санитизация строки (удаление опасных символов)
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return '';
  return validator.escape(str.trim());
};

/**
 * Валидация изображения
 */
const validateImage = (file) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!file) {
    return { valid: false, message: 'No file provided' };
  }

  if (!allowedTypes.includes(file.mimetype)) {
    return { valid: false, message: 'Invalid file type. Only images are allowed' };
  }

  if (file.size > maxSize) {
    return { valid: false, message: 'File size exceeds 5MB limit' };
  }

  return { valid: true };
};

module.exports = {
  validatePhone,
  validateEmail,
  validatePassword,
  validatePrice,
  validateUUID,
  sanitizeString,
  validateImage
};

