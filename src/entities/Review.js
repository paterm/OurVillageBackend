const { EntitySchema } = require('typeorm');

const Review = new EntitySchema({
  name: 'Review',
  tableName: 'reviews',
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    rating: {
      type: 'int',
    },
    comment: {
      type: 'text',
      nullable: true,
    },
    userId: {
      type: 'uuid',
    },
    listingId: {
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
      onDelete: 'CASCADE',
    },
    listing: {
      type: 'many-to-one',
      target: 'Listing',
      joinColumn: { name: 'listingId' },
      onDelete: 'CASCADE',
    },
  },
});

module.exports = { Review };

