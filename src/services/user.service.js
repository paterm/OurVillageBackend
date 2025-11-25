const { PrismaClient } = require('@prisma/client');
const uploadUtil = require('../utils/upload');

const prisma = new PrismaClient();

/**
 * Получить пользователя по ID
 */
const getUserById = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      phone: true,
      name: true,
      email: true,
      avatar: true,
      isVerified: true,
      createdAt: true,
      _count: {
        select: {
          listings: true,
          reviews: true
        }
      }
    }
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
};

/**
 * Обновить данные пользователя
 */
const updateUser = async (userId, updateData) => {
  const allowedFields = ['name', 'email'];
  const filteredData = Object.keys(updateData)
    .filter(key => allowedFields.includes(key))
    .reduce((obj, key) => {
      obj[key] = updateData[key];
      return obj;
    }, {});

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: filteredData,
    select: {
      id: true,
      phone: true,
      name: true,
      email: true,
      avatar: true,
      isVerified: true
    }
  });

  return updatedUser;
};

/**
 * Загрузить аватар пользователя
 */
const uploadAvatar = async (userId, file) => {
  if (!file) {
    throw new Error('No file provided');
  }

  const avatarUrl = await uploadUtil.uploadToS3(file, 'avatars');
  
  await prisma.user.update({
    where: { id: userId },
    data: { avatar: avatarUrl }
  });

  return avatarUrl;
};

/**
 * Получить список пользователей (для админа)
 */
const getUsers = async ({ page = 1, limit = 10, search }) => {
  const skip = (page - 1) * limit;
  
  const where = search ? {
    OR: [
      { name: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search } },
      { email: { contains: search, mode: 'insensitive' } }
    ]
  } : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: parseInt(limit),
      select: {
        id: true,
        phone: true,
        name: true,
        email: true,
        role: true,
        isVerified: true,
        isBanned: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.user.count({ where })
  ]);

  return {
    users,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

module.exports = {
  getUserById,
  updateUser,
  uploadAvatar,
  getUsers
};

