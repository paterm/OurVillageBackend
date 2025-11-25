const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Получить статистику платформы
 */
const getPlatformStats = async () => {
  const [users, listings, reviews, reports] = await Promise.all([
    prisma.user.count(),
    prisma.listing.count(),
    prisma.review.count(),
    prisma.report.count({ where: { status: 'PENDING' } })
  ]);

  return {
    users,
    listings,
    reviews,
    pendingReports: reports
  };
};

/**
 * Модерировать объявление
 */
const moderateListing = async (listingId, action, reason) => {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId }
  });

  if (!listing) {
    throw new Error('Listing not found');
  }

  let status;
  switch (action) {
    case 'approve':
      status = 'ACTIVE';
      break;
    case 'reject':
      status = 'REJECTED';
      break;
    case 'ban':
      status = 'BANNED';
      break;
    default:
      throw new Error('Invalid action');
  }

  const updatedListing = await prisma.listing.update({
    where: { id: listingId },
    data: {
      status,
      moderationNote: reason
    }
  });

  // TODO: Отправить уведомление пользователю

  return updatedListing;
};

/**
 * Заблокировать пользователя
 */
const banUser = async (userId, reason, duration) => {
  const banUntil = duration 
    ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000)
    : null;

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      isBanned: true,
      banReason: reason,
      banUntil
    }
  });

  // TODO: Отправить уведомление пользователю

  return user;
};

/**
 * Разблокировать пользователя
 */
const unbanUser = async (userId) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      isBanned: false,
      banReason: null,
      banUntil: null
    }
  });

  return user;
};

/**
 * Получить список жалоб
 */
const getReports = async ({ page = 1, limit = 10, status }) => {
  const skip = (page - 1) * limit;

  const where = status ? { status } : {};

  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        listing: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.report.count({ where })
  ]);

  return {
    reports,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Обработать жалобу
 */
const handleReport = async (reportId, action, resolution) => {
  const report = await prisma.report.findUnique({
    where: { id: reportId }
  });

  if (!report) {
    throw new Error('Report not found');
  }

  const updatedReport = await prisma.report.update({
    where: { id: reportId },
    data: {
      status: action === 'approve' ? 'RESOLVED' : 'REJECTED',
      resolution,
      resolvedAt: new Date()
    }
  });

  // Если жалоба одобрена, применить модерацию
  if (action === 'approve' && report.listingId) {
    await moderateListing(report.listingId, 'ban', resolution);
  }

  return updatedReport;
};

module.exports = {
  getPlatformStats,
  moderateListing,
  banUser,
  unbanUser,
  getReports,
  handleReport
};

