const { PrismaClient } = require('@prisma/client');
const uploadUtil = require('../utils/upload');

const prisma = new PrismaClient();

/**
 * Создать объявление
 */
const createListing = async (listingData, files) => {
  const { userId, title, description, price, category, type = 'listing', ...otherData } = listingData;

  // Загрузка изображений
  let images = [];
  if (files && files.length > 0) {
    images = await Promise.all(
      files.map(file => uploadUtil.uploadToS3(file, 'listings'))
    );
  }

  const listing = await prisma.listing.create({
    data: {
      title,
      description,
      price: price ? parseFloat(price) : null,
      category,
      type,
      userId,
      images,
      ...otherData
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true
        }
      }
    }
  });

  return listing;
};

/**
 * Получить список объявлений
 */
const getListings = async ({ page = 1, limit = 10, category, search, minPrice, maxPrice, type }) => {
  const skip = (page - 1) * limit;

  const where = {
    status: 'ACTIVE',
    ...(type && { type }),
    ...(category && { category }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }),
    ...(minPrice && { price: { gte: parseFloat(minPrice) } }),
    ...(maxPrice && { price: { lte: parseFloat(maxPrice) } })
  };

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        _count: {
          select: {
            reviews: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.listing.count({ where })
  ]);

  return {
    listings,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Получить объявление по ID
 */
const getListingById = async (id) => {
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
          phone: true
        }
      },
      reviews: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }
    }
  });

  if (!listing) {
    throw new Error('Listing not found');
  }

  return listing;
};

/**
 * Обновить объявление
 */
const updateListing = async (id, userId, updateData, files) => {
  // Проверка прав
  const listing = await prisma.listing.findUnique({
    where: { id }
  });

  if (!listing) {
    throw new Error('Listing not found');
  }

  if (listing.userId !== userId) {
    throw new Error('Not authorized to update this listing');
  }

  // Загрузка новых изображений
  let images = listing.images || [];
  if (files && files.length > 0) {
    const newImages = await Promise.all(
      files.map(file => uploadUtil.uploadToS3(file, 'listings'))
    );
    images = [...images, ...newImages];
  }

  const updatedListing = await prisma.listing.update({
    where: { id },
    data: {
      ...updateData,
      ...(files && { images })
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true
        }
      }
    }
  });

  return updatedListing;
};

/**
 * Удалить объявление
 */
const deleteListing = async (id, userId) => {
  const listing = await prisma.listing.findUnique({
    where: { id }
  });

  if (!listing) {
    throw new Error('Listing not found');
  }

  if (listing.userId !== userId) {
    throw new Error('Not authorized to delete this listing');
  }

  await prisma.listing.delete({
    where: { id }
  });
};

/**
 * Получить объявления пользователя
 */
const getUserListings = async (userId, { page = 1, limit = 10 }) => {
  const skip = (page - 1) * limit;

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where: { userId },
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    }),
    prisma.listing.count({ where: { userId } })
  ]);

  return {
    listings,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Создать отзыв
 */
const createReview = async (reviewData) => {
  const { userId, listingId, rating, comment } = reviewData;

  const review = await prisma.review.create({
    data: {
      userId,
      listingId,
      rating: parseInt(rating),
      comment
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true
        }
      }
    }
  });

  return review;
};

/**
 * Получить отзывы для объявления
 */
const getListingReviews = async (listingId, { page = 1, limit = 10 }) => {
  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { listingId },
      skip,
      take: parseInt(limit),
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.review.count({ where: { listingId } })
  ]);

  return {
    reviews,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Обновить отзыв
 */
const updateReview = async (id, userId, updateData) => {
  const review = await prisma.review.findUnique({
    where: { id }
  });

  if (!review) {
    throw new Error('Review not found');
  }

  if (review.userId !== userId) {
    throw new Error('Not authorized to update this review');
  }

  const updatedReview = await prisma.review.update({
    where: { id },
    data: updateData,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true
        }
      }
    }
  });

  return updatedReview;
};

/**
 * Удалить отзыв
 */
const deleteReview = async (id, userId) => {
  const review = await prisma.review.findUnique({
    where: { id }
  });

  if (!review) {
    throw new Error('Review not found');
  }

  if (review.userId !== userId) {
    throw new Error('Not authorized to delete this review');
  }

  await prisma.review.delete({
    where: { id }
  });
};

/**
 * Отправить сообщение
 */
const sendMessage = async (messageData) => {
  const { senderId, receiverId, listingId, content } = messageData;

  const message = await prisma.message.create({
    data: {
      senderId,
      receiverId,
      listingId,
      content
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          avatar: true
        }
      }
    }
  });

  return message;
};

/**
 * Получить переписку
 */
const getConversation = async (conversationId, userId, { page = 1, limit = 50 }) => {
  const skip = (page - 1) * limit;

  const messages = await prisma.message.findMany({
    where: {
      conversationId,
      OR: [
        { senderId: userId },
        { receiverId: userId }
      ]
    },
    skip,
    take: parseInt(limit),
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          avatar: true
        }
      }
    },
    orderBy: { createdAt: 'asc' }
  });

  return messages;
};

/**
 * Получить список переписок пользователя
 */
const getUserConversations = async (userId) => {
  const conversations = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: userId },
        { receiverId: userId }
      ]
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          avatar: true
        }
      },
      receiver: {
        select: {
          id: true,
          name: true,
          avatar: true
        }
      },
      listing: {
        select: {
          id: true,
          title: true,
          images: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    distinct: ['conversationId']
  });

  return conversations;
};

/**
 * Отметить сообщения как прочитанные
 */
const markMessagesAsRead = async (conversationId, userId) => {
  await prisma.message.updateMany({
    where: {
      conversationId,
      receiverId: userId,
      isRead: false
    },
    data: {
      isRead: true
    }
  });
};

module.exports = {
  createListing,
  getListings,
  getListingById,
  updateListing,
  deleteListing,
  getUserListings,
  createReview,
  getListingReviews,
  updateReview,
  deleteReview,
  sendMessage,
  getConversation,
  getUserConversations,
  markMessagesAsRead
};

