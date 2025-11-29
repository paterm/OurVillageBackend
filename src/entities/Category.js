const { EntitySchema } = require('typeorm');

const Category = new EntitySchema({
  name: 'Category',
  tableName: 'categories',
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    name: {
      type: 'varchar',
    },
    icon: {
      type: 'varchar',
    },
    iconColor: {
      type: 'varchar',
    },
    parentId: {
      type: 'uuid',
      nullable: true,
    },
    order: {
      type: 'int',
      default: 0,
    },
    isActive: {
      type: 'boolean',
      default: true,
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
    parent: {
      type: 'many-to-one',
      target: 'Category',
      joinColumn: { name: 'parentId' },
      nullable: true,
    },
    children: {
      type: 'one-to-many',
      target: 'Category',
      inverseSide: 'parent',
    },
  },
});

module.exports = { Category };

