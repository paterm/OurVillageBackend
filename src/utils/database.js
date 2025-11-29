const { DataSource } = require('typeorm');

let dataSource;

/**
 * Подключение к базе данных
 */
const connectDB = async () => {
  try {
    if (!dataSource) {
      // Динамически загружаем entities, чтобы избежать циклических зависимостей
      const { User } = require('../entities/User');
      const { PendingVerification } = require('../entities/PendingVerification');
      const { Listing } = require('../entities/Listing');
      const { Review } = require('../entities/Review');
      const { Category } = require('../entities/Category');
      const { MarketplaceItem } = require('../entities/MarketplaceItem');
      
      dataSource = new DataSource({
        type: 'postgres',
        url: process.env.DATABASE_URL,
        entities: [User, PendingVerification, Listing, Review, Category, MarketplaceItem],
        synchronize: process.env.NODE_ENV === 'development', // Автоматическая синхронизация в dev
        logging: process.env.NODE_ENV === 'development',
      });
    }

    if (!dataSource.isInitialized) {
      await dataSource.initialize();
      console.log('✅ Database connected');
    }
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  }
};

/**
 * Отключение от базы данных
 */
const disconnectDB = async () => {
  try {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('✅ Database disconnected');
    }
  } catch (error) {
    console.error('❌ Database disconnection error:', error);
  }
};

/**
 * Получить репозиторий для работы с сущностью
 */
const getRepository = (entityClass) => {
  if (!dataSource || !dataSource.isInitialized) {
    throw new Error('Database not initialized. Call connectDB() first.');
  }
  return dataSource.getRepository(entityClass);
};

module.exports = {
  connectDB,
  disconnectDB,
  getRepository,
  dataSource: () => dataSource,
};
