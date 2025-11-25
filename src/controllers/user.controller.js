const userService = require('../services/user.service');

/**
 * Получить профиль текущего пользователя
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.user.id);
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

/**
 * Обновить профиль пользователя
 */
const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;
    const updatedUser = await userService.updateUser(userId, updateData);
    res.status(200).json(updatedUser);
  } catch (error) {
    next(error);
  }
};

/**
 * Загрузить аватар пользователя
 */
const uploadAvatar = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const avatarUrl = await userService.uploadAvatar(userId, req.file);
    res.status(200).json({ avatarUrl });
  } catch (error) {
    next(error);
  }
};

/**
 * Получить список пользователей (для админа)
 */
const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const result = await userService.getUsers({ page, limit, search });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Получить пользователя по ID
 */
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await userService.getUserById(id);
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadAvatar,
  getUsers,
  getUserById
};

