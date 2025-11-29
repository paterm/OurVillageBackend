const { getRepository } = require('../utils/database');
const { Listing } = require('../entities/Listing');

/**
 * Создать новое объявление
 */
const createListing = async (listingData, userId) => {
  const listingRepo = getRepository(Listing);
  
  const listing = listingRepo.create({
    ...listingData,
    userId,
    status: 'ACTIVE', // Автоматически активируем для упрощения
    type: 'SERVICE',
  });
  
  return await listingRepo.save(listing);
};

/**
 * Получить список объявлений с фильтрацией и поиском
 */
const getListings = async (filters = {}) => {
  const listingRepo = getRepository(Listing);
  const { Review } = require('../entities/Review');
  
  const {
    search,
    category,
    status = 'ACTIVE',
    page = 1,
    limit = 20,
    sortBy = 'date_desc', // date_desc, price_asc, price_desc, rating_desc
  } = filters;
  
  const queryBuilder = listingRepo
    .createQueryBuilder('listing')
    .leftJoin('listing.user', 'user')
    .leftJoin(Review, 'review', 'review.listingId = listing.id')
    .select([
      'listing.id',
      'listing.title',
      'listing.description',
      'listing.price',
      'listing.category',
      'listing.type',
      'listing.images',
      'listing.status',
      'listing.moderationNote',
      'listing.userId',
      'listing.createdAt',
      'listing.updatedAt',
      'user.id',
      'user.name',
      'user.avatar',
      'user.phone',
      'user.telegramId',
    ])
    .addSelect('COALESCE(AVG(review.rating), 0)', 'averageRating')
    .addSelect('COUNT(DISTINCT review.id)', 'reviewsCount')
    .where('listing.status = :status', { status })
    .groupBy('listing.id')
    .addGroupBy('user.id');
  
  // Улучшенный поиск с приоритетами и использованием PostgreSQL Full-Text Search
  let searchWords = [];
  if (search) {
    const searchQuery = search.trim().toLowerCase();
    
    // Используем PostgreSQL Full-Text Search для лучших результатов
    // Создаем tsvector из заголовка и описания для полнотекстового поиска
    // И также используем ILIKE для совместимости
    
    // Разбиваем поисковый запрос на слова для более точного поиска
    searchWords = searchQuery
      .split(/\s+/)
      .filter(word => word.length > 0);
    
    if (searchWords.length > 0) {
      // Создаем условия поиска с приоритетами:
      // 1. Точное совпадение в заголовке (самый высокий приоритет)
      // 2. Совпадение корня слова в заголовке
      // 3. Точное совпадение в категории
      // 4. Совпадение корня слова в категории
      // 5. Точное совпадение в описании (низкий приоритет)
      // 6. Совпадение корня слова в описании (самый низкий приоритет)
      
      const searchConditions = searchWords.map((word, index) => {
        const paramName = `searchWord${index}`;
        const paramNameStem = `searchWordStem${index}`;
        
        // Для слов длиннее 3 символов также ищем по корню
        let wordStem = '';
        if (word.length > 3) {
          // Берем корень слова (первые 4-5 символов)
          wordStem = word.substring(0, Math.min(5, word.length));
        }
        
        // Создаем условие с приоритетами
        if (wordStem && wordStem.length >= 3) {
          // Ищем в заголовке (высокий приоритет), категории (средний), описании (низкий)
          return `(
            listing.title ILIKE :${paramName} OR
            listing.title ILIKE :${paramNameStem} OR
            listing.category ILIKE :${paramName} OR
            listing.category ILIKE :${paramNameStem} OR
            listing.description ILIKE :${paramName} OR
            listing.description ILIKE :${paramNameStem}
          )`;
        } else {
          return `(
            listing.title ILIKE :${paramName} OR
            listing.category ILIKE :${paramName} OR
            listing.description ILIKE :${paramName}
          )`;
        }
      });
      
      // Объединяем условия через AND (все слова должны быть найдены)
      // Но добавляем дополнительное условие: хотя бы одно слово должно быть в заголовке или категории
      // Это исключает результаты, где все слова найдены только в описании
      const mainFieldConditions = searchWords.map((word, index) => {
        const paramName = `searchWord${index}`;
        const paramNameStem = `searchWordStem${index}`;
        let wordStem = '';
        if (word.length > 3) {
          wordStem = word.substring(0, Math.min(5, word.length));
        }
        
        if (wordStem && wordStem.length >= 3) {
          return `(
            listing.title ILIKE :${paramName} OR
            listing.title ILIKE :${paramNameStem} OR
            listing.category ILIKE :${paramName} OR
            listing.category ILIKE :${paramNameStem}
          )`;
        } else {
          return `(
            listing.title ILIKE :${paramName} OR
            listing.category ILIKE :${paramName}
          )`;
        }
      });
      
      // Основное условие: все слова должны быть найдены где-то
      queryBuilder.andWhere(`(${searchConditions.join(' AND ')})`);
      
      // Дополнительное условие: хотя бы одно слово должно быть в заголовке или категории
      // Это исключает результаты типа "Вывоз мусора" при поиске "Бытовка"
      queryBuilder.andWhere(`(${mainFieldConditions.join(' OR ')})`);
      
      // Устанавливаем параметры
      searchWords.forEach((word, index) => {
        const paramName = `searchWord${index}`;
        queryBuilder.setParameter(paramName, `%${word}%`);
        
        if (word.length > 3) {
          const paramNameStem = `searchWordStem${index}`;
          const wordStem = word.substring(0, Math.min(5, word.length));
          if (wordStem.length >= 3) {
            queryBuilder.setParameter(paramNameStem, `%${wordStem}%`);
          }
        }
      });
      
      // Сортировка по релевантности:
      // 1. Совпадения в заголовке (самый высокий приоритет)
      // 2. Совпадения в категории
      // 3. Совпадения в описании
      const relevanceExpressions = searchWords.map((word, index) => {
        const paramName = `searchWord${index}`;
        return `(
          CASE 
            WHEN listing.title ILIKE :${paramName} THEN 3
            WHEN listing.category ILIKE :${paramName} THEN 2
            WHEN listing.description ILIKE :${paramName} THEN 1
            ELSE 0
          END
        )`;
      });
      
      // Вычисляем общую релевантность
      const totalRelevance = relevanceExpressions.join(' + ');
      
      // Добавляем сортировку по релевантности перед сортировкой по дате
      queryBuilder.addSelect(`(${totalRelevance})`, 'search_relevance');
      queryBuilder.orderBy('search_relevance', 'DESC');
      queryBuilder.addOrderBy('listing.createdAt', 'DESC');
    }
  }
  
  // Фильтр по категории
  if (category) {
    // Поддерживаем поиск по пути категории (например: "construction/construction-buildings/foundations")
    // Ищем категории, которые начинаются с указанного пути или содержат его
    queryBuilder.andWhere('listing.category ILIKE :categoryPattern', { 
      categoryPattern: `%${category}%` 
    });
  }
  
  // Сортировка
  // Если есть поиск, сначала сортируем по релевантности
  if (search && searchWords && searchWords.length > 0) {
    // Релевантность уже добавлена выше
    // Добавляем дополнительную сортировку в зависимости от sortBy
    switch (sortBy) {
      case 'price_asc':
        queryBuilder.addOrderBy('listing.price', 'ASC', 'NULLS LAST');
        break;
      case 'price_desc':
        queryBuilder.addOrderBy('listing.price', 'DESC', 'NULLS LAST');
        break;
      case 'rating_desc':
        // Используем подзапрос для сортировки по рейтингу
        queryBuilder.addOrderBy(
          '(SELECT COALESCE(AVG(r.rating), 0) FROM reviews r WHERE r."listingId" = listing.id)',
          'DESC'
        );
        break;
      default:
        queryBuilder.addOrderBy('listing.createdAt', 'DESC');
    }
  } else {
    // Если нет поиска, сортируем только по выбранному параметру
    switch (sortBy) {
      case 'price_asc':
        queryBuilder.orderBy('listing.price', 'ASC', 'NULLS LAST');
        queryBuilder.addOrderBy('listing.createdAt', 'DESC');
        break;
      case 'price_desc':
        queryBuilder.orderBy('listing.price', 'DESC', 'NULLS LAST');
        queryBuilder.addOrderBy('listing.createdAt', 'DESC');
        break;
      case 'rating_desc':
        // Используем подзапрос для сортировки по рейтингу, так как нельзя использовать агрегатную функцию в ORDER BY с GROUP BY
        queryBuilder.orderBy(
          '(SELECT COALESCE(AVG(r.rating), 0) FROM reviews r WHERE r."listingId" = listing.id)',
          'DESC'
        );
        queryBuilder.addOrderBy('listing.createdAt', 'DESC');
        break;
      default: // date_desc
        queryBuilder.orderBy('listing.createdAt', 'DESC');
    }
  }
  
  // Пагинация
  const skip = (page - 1) * limit;
  queryBuilder.skip(skip).take(limit);
  
  // Получаем данные с рейтингами используя getRawMany
  const rawResults = await queryBuilder.getRawMany();
  
  // Получаем общее количество (нужно сделать отдельный запрос для точного подсчета)
  const countQueryBuilder = listingRepo
    .createQueryBuilder('listing')
    .where('listing.status = :status', { status });
  
  // Применяем те же фильтры что и в основном запросе
  if (search) {
    const searchWords = search
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 0);
    
    if (searchWords.length > 0) {
      const searchConditions = searchWords.map((word, index) => {
        const paramName = `countSearchWord${index}`;
        const paramNameStem = `countSearchWordStem${index}`;
        let wordStem = '';
        if (word.length > 3) {
          wordStem = word.substring(0, Math.min(5, word.length));
        }
        
        if (wordStem && wordStem.length >= 3) {
          return `(
            listing.title ILIKE :${paramName} OR
            listing.title ILIKE :${paramNameStem} OR
            listing.category ILIKE :${paramName} OR
            listing.category ILIKE :${paramNameStem} OR
            listing.description ILIKE :${paramName} OR
            listing.description ILIKE :${paramNameStem}
          )`;
        } else {
          return `(
            listing.title ILIKE :${paramName} OR
            listing.category ILIKE :${paramName} OR
            listing.description ILIKE :${paramName}
          )`;
        }
      });
      
      const mainFieldConditions = searchWords.map((word, index) => {
        const paramName = `countSearchWord${index}`;
        const paramNameStem = `countSearchWordStem${index}`;
        let wordStem = '';
        if (word.length > 3) {
          wordStem = word.substring(0, Math.min(5, word.length));
        }
        
        if (wordStem && wordStem.length >= 3) {
          return `(
            listing.title ILIKE :${paramName} OR
            listing.title ILIKE :${paramNameStem} OR
            listing.category ILIKE :${paramName} OR
            listing.category ILIKE :${paramNameStem}
          )`;
        } else {
          return `(
            listing.title ILIKE :${paramName} OR
            listing.category ILIKE :${paramName}
          )`;
        }
      });
      
      countQueryBuilder.andWhere(`(${searchConditions.join(' AND ')})`);
      countQueryBuilder.andWhere(`(${mainFieldConditions.join(' OR ')})`);
      
      searchWords.forEach((word, index) => {
        const paramName = `countSearchWord${index}`;
        countQueryBuilder.setParameter(paramName, `%${word}%`);
        
        if (word.length > 3) {
          const paramNameStem = `countSearchWordStem${index}`;
          const wordStem = word.substring(0, Math.min(5, word.length));
          if (wordStem.length >= 3) {
            countQueryBuilder.setParameter(paramNameStem, `%${wordStem}%`);
          }
        }
      });
    }
  }
  
  if (category) {
    countQueryBuilder.andWhere('listing.category ILIKE :categoryPattern', { 
      categoryPattern: `%${category}%` 
    });
  }
  
  const total = await countQueryBuilder.getCount();
  
  // Преобразуем raw результаты в объекты с рейтингами
  const listingsWithRating = rawResults.map(raw => {
    // Обрабатываем images - может быть массивом или строкой
    let images = [];
    if (raw.listing_images) {
      if (Array.isArray(raw.listing_images)) {
        images = raw.listing_images;
      } else if (typeof raw.listing_images === 'string') {
        // Если это строка, пытаемся распарсить
        try {
          images = JSON.parse(raw.listing_images);
        } catch {
          // Если не JSON, разбиваем по запятой
          images = raw.listing_images.split(',').filter(img => img.trim());
        }
      }
    }
    
    const listing = {
      id: raw.listing_id,
      title: raw.listing_title,
      description: raw.listing_description,
      price: raw.listing_price,
      category: raw.listing_category,
      type: raw.listing_type,
      images: images,
      status: raw.listing_status,
      moderationNote: raw.listing_moderationNote,
      userId: raw.listing_userId,
      createdAt: raw.listing_createdAt,
      updatedAt: raw.listing_updatedAt,
      user: raw.user_id ? {
        id: raw.user_id,
        name: raw.user_name,
        avatar: raw.user_avatar,
        phone: raw.user_phone,
        telegramId: raw.user_telegramId,
      } : null,
      averageRating: parseFloat(raw.averageRating || 0),
      reviewsCount: parseInt(raw.reviewsCount || 0, 10),
    };
    return listing;
  });
  
  return {
    listings: listingsWithRating,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Получить объявление по ID
 */
const getListingById = async (id) => {
  const listingRepo = getRepository(Listing);
  const { Review } = require('../entities/Review');
  const reviewRepo = getRepository(Review);
  
  const listing = await listingRepo.findOne({
    where: { id },
    relations: ['user'],
  });
  
  if (!listing) {
    throw new Error('Listing not found');
  }
  
  // Вычисляем рейтинг и количество отзывов
  const allReviews = await reviewRepo.find({
    where: { listingId: id },
    select: ['rating'],
  });
  
  const averageRating = allReviews.length > 0
    ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
    : 0;
  
  return {
    ...listing,
    averageRating,
    reviewsCount: allReviews.length,
  };
};

/**
 * Обновить объявление
 */
const updateListing = async (id, userId, updateData) => {
  const listingRepo = getRepository(Listing);
  
  const listing = await listingRepo.findOne({
    where: { id, userId },
  });
  
  if (!listing) {
    throw new Error('Listing not found or access denied');
  }
  
  Object.assign(listing, updateData);
  return await listingRepo.save(listing);
};

/**
 * Удалить объявление
 */
const deleteListing = async (id, userId) => {
  const listingRepo = getRepository(Listing);
  
  const listing = await listingRepo.findOne({
    where: { id, userId },
  });
  
  if (!listing) {
    throw new Error('Listing not found or access denied');
  }
  
  await listingRepo.remove(listing);
  return { success: true };
};

/**
 * Получить отзывы для объявления
 */
const getListingReviews = async (listingId, { page = 1, limit = 10, ratingFilter = 'all' } = {}) => {
  const { Review } = require('../entities/Review');
  const reviewRepo = getRepository(Review);
  
  const skip = (page - 1) * limit;
  
  // Создаем условие where в зависимости от фильтра
  const whereCondition = { listingId };
  
  if (ratingFilter === 'positive') {
    // Положительные отзывы: 4-5 звезд
    whereCondition.rating = { $gte: 4 };
  } else if (ratingFilter === 'negative') {
    // Отрицательные отзывы: 1-3 звезды
    whereCondition.rating = { $lte: 3 };
  }
  
  // Для TypeORM нужно использовать другой синтаксис
  let queryBuilder = reviewRepo
    .createQueryBuilder('review')
    .leftJoinAndSelect('review.user', 'user')
    .where('review.listingId = :listingId', { listingId });
  
  if (ratingFilter === 'positive') {
    queryBuilder = queryBuilder.andWhere('review.rating >= :minRating', { minRating: 4 });
  } else if (ratingFilter === 'negative') {
    queryBuilder = queryBuilder.andWhere('review.rating <= :maxRating', { maxRating: 3 });
  }
  
  queryBuilder = queryBuilder
    .orderBy('review.createdAt', 'DESC')
    .skip(skip)
    .take(limit);
  
  const [reviews, total] = await queryBuilder.getManyAndCount();
  
  // Вычисляем средний рейтинг (всегда из всех отзывов, независимо от фильтра)
  const allReviews = await reviewRepo.find({
    where: { listingId },
    select: ['rating'],
  });
  
  const averageRating = allReviews.length > 0
    ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
    : 0;
  
  return {
    reviews,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
    averageRating,
    totalReviews: allReviews.length, // Всего отзывов (независимо от фильтра)
  };
};

/**
 * Создать отзыв
 */
const createReview = async (reviewData) => {
  const { Review } = require('../entities/Review');
  const reviewRepo = getRepository(Review);
  
  const review = reviewRepo.create(reviewData);
  return await reviewRepo.save(review);
};

/**
 * Обновить отзыв
 */
const updateReview = async (id, userId, updateData) => {
  const { Review } = require('../entities/Review');
  const reviewRepo = getRepository(Review);
  
  const review = await reviewRepo.findOne({
    where: { id, userId },
  });
  
  if (!review) {
    throw new Error('Review not found or access denied');
  }
  
  Object.assign(review, updateData);
  return await reviewRepo.save(review);
};

/**
 * Удалить отзыв
 */
const deleteReview = async (id, userId) => {
  const { Review } = require('../entities/Review');
  const reviewRepo = getRepository(Review);
  
  const review = await reviewRepo.findOne({
    where: { id, userId },
  });
  
  if (!review) {
    throw new Error('Review not found or access denied');
  }
  
  await reviewRepo.remove(review);
  return { success: true };
};

module.exports = {
  createListing,
  getListings,
  getListingById,
  updateListing,
  deleteListing,
  getListingReviews,
  createReview,
  updateReview,
  deleteReview,
};
