const { getRepository } = require('../utils/database');
const { User } = require('../entities/User');
const uploadUtil = require('../utils/upload');

/**
 * Получить пользователя по ID
 */
const getUserById = async (id) => {
  const userRepo = getRepository(User);
  const user = await userRepo.findOne({
    where: { id }
  });

  if (!user) {
    return null;
  }

  // Возвращаем только нужные поля
  return {
    id: user.id,
    phone: user.phone,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    isVerified: user.isVerified,
    createdAt: user.createdAt
  };
};

/**
 * Обновить профиль пользователя
 */
const updateProfile = async (userId, data) => {
  const userRepo = getRepository(User);
  
  // Проверяем, существует ли пользователь
  const user = await userRepo.findOne({ where: { id: userId } });
  if (!user) {
    throw new Error('User not found');
  }

  // Обновляем только разрешенные поля
  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.avatar !== undefined) updateData.avatar = data.avatar;

  await userRepo.update(userId, updateData);

  return await getUserById(userId);
};

/**
 * Загрузить аватар
 */
const uploadAvatar = async (userId, file) => {
  const userRepo = getRepository(User);
  
  const user = await userRepo.findOne({ where: { id: userId } });
  if (!user) {
    throw new Error('User not found');
  }

  // Загружаем файл
  const avatarUrl = await uploadUtil.uploadFile(file, 'avatars');

  // Обновляем аватар пользователя
  await userRepo.update(userId, { avatar: avatarUrl });

  return avatarUrl;
};

module.exports = {
  getUserById,
  updateProfile,
  uploadAvatar
};
