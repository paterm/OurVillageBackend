const { getRepository } = require('../utils/database');
const { MarketplaceItem } = require('../entities/MarketplaceItem');

/**
 * Создать новый товар
 */
const createItem = async (itemData, userId) => {
  const itemRepo = getRepository(MarketplaceItem);
  
  const item = itemRepo.create({
    ...itemData,
    userId,
    status: 'ACTIVE',
  });
  
  return await itemRepo.save(item);
};

/**
 * Получить список товаров с фильтрацией и поиском
 */
const getItems = async (filters = {}) => {
  const itemRepo = getRepository(MarketplaceItem);
  const { Review } = require('../entities/Review');
  
  const {
    search,
    category,
    status = 'ACTIVE',
    page = 1,
    limit = 20,
    sortBy = 'date_desc', // date_desc, price_asc, price_desc, rating_desc
  } = filters;
  
  const queryBuilder = itemRepo
    .createQueryBuilder('item')
    .leftJoin('item.user', 'user')
    .leftJoin(Review, 'review', 'review.listingId = item.id')
    .select([
      'item.id',
      'item.title',
      'item.description',
      'item.price',
      'item.category',
      'item.images',
      'item.status',
      'item.location',
      'item.userId',
      'item.createdAt',
      'item.updatedAt',
      'user.id',
      'user.name',
      'user.avatar',
      'user.phone',
      'user.telegramId',
    ])
    .addSelect('COALESCE(AVG(review.rating), 0)', 'averageRating')
    .addSelect('COUNT(DISTINCT review.id)', 'reviewsCount')
    .where('item.status = :status', { status })
    .groupBy('item.id')
    .addGroupBy('user.id');
  
  // Улучшенный поиск
  let searchWords = [];
  if (search) {
    const searchQuery = search.trim().toLowerCase();
    searchWords = searchQuery
      .split(/\s+/)
      .filter(word => word.length > 0);
    
    if (searchWords.length > 0) {
      const searchConditions = searchWords.map((word, index) => {
        const paramName = `searchWord${index}`;
        let wordStem = '';
        if (word.length > 3) {
          wordStem = word.substring(0, Math.min(5, word.length));
        }
        
        if (wordStem && wordStem.length >= 3) {
          return `(
            LOWER(item.title) LIKE :${paramName} OR
            LOWER(item.title) LIKE :${paramName}Stem OR
            LOWER(item.category) LIKE :${paramName} OR
            LOWER(item.category) LIKE :${paramName}Stem OR
            LOWER(item.description) LIKE :${paramName} OR
            LOWER(item.description) LIKE :${paramName}Stem
          )`;
        } else {
          return `(
            LOWER(item.title) LIKE :${paramName} OR
            LOWER(item.category) LIKE :${paramName} OR
            LOWER(item.description) LIKE :${paramName}
          )`;
        }
      });
      
      const searchParams = {};
      searchWords.forEach((word, index) => {
        const paramName = `searchWord${index}`;
        searchParams[paramName] = `%${word}%`;
        if (word.length > 3) {
          const wordStem = word.substring(0, Math.min(5, word.length));
          searchParams[`${paramName}Stem`] = `%${wordStem}%`;
        }
      });
      
      queryBuilder.andWhere(`(${searchConditions.join(' AND ')})`, searchParams);
    }
  }
  
  // Фильтр по категории
  if (category) {
    queryBuilder.andWhere('item.category ILIKE :category', { category: `%${category}%` });
  }
  
  // Сортировка
  if (sortBy === 'price_asc') {
    queryBuilder.orderBy('item.price', 'ASC');
  } else if (sortBy === 'price_desc') {
    queryBuilder.orderBy('item.price', 'DESC');
  } else if (sortBy === 'rating_desc') {
    queryBuilder.orderBy('COALESCE(AVG(review.rating), 0)', 'DESC');
  } else {
    // date_desc по умолчанию
    queryBuilder.orderBy('item.createdAt', 'DESC');
  }
  
  // Пагинация
  const skip = (page - 1) * limit;
  queryBuilder.skip(skip).take(limit);
  
  const rawResults = await queryBuilder.getRawMany();
  
  // Обрабатываем результаты
  const items = rawResults.map(row => {
    let images = [];
    if (row.item_images) {
      if (Array.isArray(row.item_images)) {
        images = row.item_images;
      } else if (typeof row.item_images === 'string') {
        images = row.item_images.split(',').filter(img => img.trim());
      }
    }
    
    return {
      id: row.item_id,
      title: row.item_title,
      description: row.item_description,
      price: parseFloat(row.item_price) || 0,
      category: row.item_category,
      images,
      location: row.item_location ? (typeof row.item_location === 'string' ? JSON.parse(row.item_location) : row.item_location) : null,
      status: row.item_status,
      userId: row.item_userId,
      createdAt: row.item_createdAt,
      updatedAt: row.item_updatedAt,
      user: {
        id: row.user_id,
        name: row.user_name,
        avatar: row.user_avatar,
        phone: row.user_phone,
        telegramId: row.user_telegramId,
      },
      averageRating: parseFloat(row.averageRating) || 0,
      reviewsCount: parseInt(row.reviewsCount) || 0,
    };
  });
  
  // Получаем общее количество для пагинации
  const totalCount = await queryBuilder.getCount();
  
  return {
    items,
    pagination: {
      page,
      limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
  };
};

/**
 * Получить товар по ID
 */
const getItemById = async (id) => {
  const itemRepo = getRepository(MarketplaceItem);
  
  const item = await itemRepo.findOne({
    where: { id },
    relations: ['user'],
  });
  
  if (!item) {
    return null;
  }
  
  // Получаем рейтинг и количество отзывов
  const { Review } = require('../entities/Review');
  const reviewRepo = getRepository(Review);
  
  const reviews = await reviewRepo.find({
    where: { listingId: id },
  });
  
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;
  
  let images = [];
  if (item.images) {
    if (Array.isArray(item.images)) {
      images = item.images;
    } else if (typeof item.images === 'string') {
      images = item.images.split(',').filter(img => img.trim());
    }
  }
  
  return {
    ...item,
    images,
    location: item.location ? (typeof item.location === 'string' ? JSON.parse(item.location) : item.location) : null,
    averageRating,
    reviewsCount: reviews.length,
  };
};

/**
 * Обновить товар
 */
const updateItem = async (id, updateData, userId) => {
  const itemRepo = getRepository(MarketplaceItem);
  
  const item = await itemRepo.findOne({
    where: { id },
  });
  
  if (!item) {
    throw new Error('Item not found');
  }
  
  // Проверяем, что пользователь является владельцем
  if (item.userId !== userId) {
    throw new Error('Unauthorized');
  }
  
  Object.assign(item, updateData);
  return await itemRepo.save(item);
};

/**
 * Удалить товар
 */
const deleteItem = async (id, userId) => {
  const itemRepo = getRepository(MarketplaceItem);
  
  const item = await itemRepo.findOne({
    where: { id },
  });
  
  if (!item) {
    throw new Error('Item not found');
  }
  
  // Проверяем, что пользователь является владельцем
  if (item.userId !== userId) {
    throw new Error('Unauthorized');
  }
  
  await itemRepo.remove(item);
  return { success: true };
};

/**
 * Получить товары пользователя
 */
const getUserItems = async (userId) => {
  const itemRepo = getRepository(MarketplaceItem);
  
  const items = await itemRepo.find({
    where: { userId },
    relations: ['user'],
    order: { createdAt: 'DESC' },
  });
  
  return items.map(item => {
    let images = [];
    if (item.images) {
      if (Array.isArray(item.images)) {
        images = item.images;
      } else if (typeof item.images === 'string') {
        images = item.images.split(',').filter(img => img.trim());
      }
    }
    
    return {
      ...item,
      images,
      location: item.location ? (typeof item.location === 'string' ? JSON.parse(item.location) : item.location) : null,
    };
  });
};

module.exports = {
  createItem,
  getItems,
  getItemById,
  updateItem,
  deleteItem,
  getUserItems,
};

