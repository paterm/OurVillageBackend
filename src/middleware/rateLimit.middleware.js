const rateLimit = require('express-rate-limit');

/**
 * Общий лимит запросов
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // 100 запросов за 15 минут
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Строгий лимит для аутентификации
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 5, // 5 попыток входа за 15 минут
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true
});

/**
 * Лимит для отправки SMS
 */
const smsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 час
  max: 3, // 3 SMS за час
  message: 'Too many SMS requests, please try again later.'
});

/**
 * Лимит для создания объявлений
 */
const createListingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 час
  max: 10, // 10 объявлений в час
  message: 'Too many listing creations, please try again later.'
});

/**
 * Лимит для загрузки файлов
 */
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 20, // 20 загрузок за 15 минут
  message: 'Too many file uploads, please try again later.'
});

module.exports = {
  generalLimiter,
  authLimiter,
  smsLimiter,
  createListingLimiter,
  uploadLimiter
};

