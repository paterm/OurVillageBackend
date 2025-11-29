const { EntitySchema } = require('typeorm');

const Listing = new EntitySchema({
  name: 'Listing',
  tableName: 'listings',
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    title: {
      type: 'varchar',
    },
    description: {
      type: 'text',
    },
    price: {
      type: 'float',
      nullable: true,
    },
    category: {
      type: 'varchar',
    },
    type: {
      type: 'varchar',
      default: 'LISTING',
    },
    images: {
      type: 'simple-array',
      nullable: true,
    },
    status: {
      type: 'varchar',
      default: 'PENDING',
    },
    moderationNote: {
      type: 'text',
      nullable: true,
    },
    userId: {
      type: 'uuid',
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
      inverseSide: 'listings',
    },
  },
});

module.exports = { Listing };

