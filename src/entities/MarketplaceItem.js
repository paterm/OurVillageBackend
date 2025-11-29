const { EntitySchema } = require('typeorm');

const MarketplaceItem = new EntitySchema({
  name: 'MarketplaceItem',
  tableName: 'marketplace_items',
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    title: {
      type: 'varchar',
      length: 255,
    },
    description: {
      type: 'text',
    },
    price: {
      type: 'decimal',
      precision: 10,
      scale: 2,
    },
    category: {
      type: 'varchar',
      length: 255,
    },
    images: {
      type: 'simple-array',
      nullable: true,
    },
    status: {
      type: 'varchar',
      default: 'ACTIVE',
    },
    location: {
      type: 'json',
      nullable: true, // { latitude: number, longitude: number, address: string }
    },
    userId: {
      type: 'uuid',
    },
    moderationNote: {
      type: 'text',
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
    user: {
      type: 'many-to-one',
      target: 'User',
      joinColumn: { name: 'userId' },
      inverseSide: 'marketplaceItems',
    },
  },
});

module.exports = { MarketplaceItem };

