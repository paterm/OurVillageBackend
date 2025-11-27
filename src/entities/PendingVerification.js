const { EntitySchema } = require('typeorm');

const PendingVerification = new EntitySchema({
  name: 'PendingVerification',
  tableName: 'pending_verifications',
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    userId: {
      type: 'uuid',
      nullable: true,
    },
    verifyToken: {
      type: 'varchar',
      unique: true,
    },
    expiresAt: {
      type: 'timestamp',
    },
    verified: {
      type: 'boolean',
      default: false,
    },
    telegramId: {
      type: 'varchar',
      nullable: true,
    },
    createdAt: {
      type: 'timestamp',
      createDate: true,
    },
    verifiedAt: {
      type: 'timestamp',
      nullable: true,
    },
  },
  relations: {
    user: {
      type: 'many-to-one',
      target: 'User',
      joinColumn: { name: 'userId' },
      nullable: true,
      onDelete: 'SET NULL',
    },
  },
  indices: [
    { columns: ['verifyToken'] },
    { columns: ['expiresAt'] },
    { columns: ['verified'] },
  ],
});

module.exports = { PendingVerification };
