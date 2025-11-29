const { EntitySchema } = require('typeorm');

const User = new EntitySchema({
  name: 'User',
  tableName: 'users',
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    phone: {
      type: 'varchar',
      nullable: true,
      unique: true,
    },
    email: {
      type: 'varchar',
      nullable: true,
      unique: true,
    },
    password: {
      type: 'varchar',
    },
    name: {
      type: 'varchar',
    },
    avatar: {
      type: 'varchar',
      nullable: true,
    },
    telegramId: {
      type: 'varchar',
      nullable: true,
      unique: true,
    },
    role: {
      type: 'varchar',
      default: 'USER',
    },
    isVerified: {
      type: 'boolean',
      default: false,
    },
    isBanned: {
      type: 'boolean',
      default: false,
    },
    banReason: {
      type: 'varchar',
      nullable: true,
    },
    banUntil: {
      type: 'timestamp',
      nullable: true,
    },
    createdAt: {
      type: 'timestamp',
      createDate: true,
    },
    updatedAt: {
      type: 'timestamp',
      updateDate: true,
    },
  },
  relations: {
    pendingVerifications: {
      type: 'one-to-many',
      target: 'PendingVerification',
      inverseSide: 'user',
    },
    listings: {
      type: 'one-to-many',
      target: 'Listing',
      inverseSide: 'user',
    },
  },
});

module.exports = { User };
