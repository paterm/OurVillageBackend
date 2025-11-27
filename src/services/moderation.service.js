// TODO: Реализовать с TypeORM после создания Listing и Report entities
const getPlatformStats = async () => {
  console.log('Moderation service: getPlatformStats called');
  return { users: 0, listings: 0, reviews: 0, pendingReports: 0 };
};

const moderateListing = async (listingId, action, reason) => {
  console.log('Moderation service: moderateListing called', { listingId, action, reason });
  throw new Error('Not implemented yet');
};

const banUser = async (userId, reason, duration) => {
  console.log('Moderation service: banUser called', { userId, reason, duration });
  const { getRepository } = require('../utils/database');
  const { User } = require('../entities/User');
  const userRepo = getRepository(User);
  
  const banUntil = duration 
    ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000)
    : null;

  await userRepo.update(userId, {
    isBanned: true,
    banReason: reason,
    banUntil
  });

  return await userRepo.findOne({ where: { id: userId } });
};

const unbanUser = async (userId) => {
  console.log('Moderation service: unbanUser called', { userId });
  const { getRepository } = require('../utils/database');
  const { User } = require('../entities/User');
  const userRepo = getRepository(User);
  
  await userRepo.update(userId, {
    isBanned: false,
    banReason: null,
    banUntil: null
  });

  return await userRepo.findOne({ where: { id: userId } });
};

const getReports = async ({ page = 1, limit = 10, status }) => {
  console.log('Moderation service: getReports called', { page, limit, status });
  return {
    reports: [],
    pagination: { page: parseInt(page), limit: parseInt(limit), total: 0, pages: 0 }
  };
};

const handleReport = async (reportId, action, resolution) => {
  console.log('Moderation service: handleReport called', { reportId, action, resolution });
  throw new Error('Not implemented yet');
};

module.exports = {
  getPlatformStats,
  moderateListing,
  banUser,
  unbanUser,
  getReports,
  handleReport
};
