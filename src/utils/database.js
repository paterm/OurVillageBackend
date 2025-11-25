const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Подключение к базе данных
 */
const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Database connected');
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  }
};

/**
 * Отключение от базы данных
 */
const disconnectDB = async () => {
  await prisma.$disconnect();
  console.log('✅ Database disconnected');
};

/**
 * Очистка базы данных (для тестов)
 */
const cleanDB = async () => {
  await prisma.$executeRaw`TRUNCATE TABLE "User", "Listing", "Review", "Message", "Notification", "Report" CASCADE`;
};

/**
 * Проверка здоровья базы данных
 */
const healthCheck = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'healthy' };
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
};

module.exports = {
  prisma,
  connectDB,
  disconnectDB,
  cleanDB,
  healthCheck
};

