const jwt = require('jsonwebtoken');
const { getRepository } = require('../utils/database');
const { User } = require('../entities/User');

/**
 * Middleware для проверки JWT токена
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'No token provided',
        message: 'Please provide a valid JWT token in the Authorization header: Authorization: Bearer <token>'
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userRepo = getRepository(User);
    const user = await userRepo.findOne({
      where: { id: decoded.userId }
    });

    if (user) {
      // Возвращаем только нужные поля
      req.user = {
        id: user.id,
        phone: user.phone,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        isBanned: user.isBanned
      };
    }

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (req.user.isBanned) {
      return res.status(403).json({ error: 'User is banned' });
    }

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    next(error);
  }
};

/**
 * Middleware для проверки роли администратора
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
};

/**
 * Middleware для проверки верификации пользователя
 */
const requireVerified = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (!req.user.isVerified) {
    return res.status(403).json({ error: 'Phone verification required' });
  }

  next();
};

module.exports = {
  authenticate,
  requireAdmin,
  requireVerified
};
