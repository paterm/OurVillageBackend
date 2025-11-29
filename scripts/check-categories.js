require('dotenv').config();
const { connectDB, disconnectDB, getRepository } = require('../src/utils/database');
const { Category } = require('../src/entities/Category');

const checkCategories = async () => {
  try {
    await connectDB();
    const categoryRepo = getRepository(Category);

    // Проверяем количество категорий
    const count = await categoryRepo.count();
    console.log(`📊 Всего категорий в БД: ${count}`);

    // Получаем все категории
    const allCategories = await categoryRepo.find({
      order: { order: 'ASC' },
    });

    console.log('\n📋 Список категорий:');
    allCategories.forEach((cat, index) => {
      console.log(`${index + 1}. ${cat.name} (ID: ${cat.id}, parentId: ${cat.parentId}, order: ${cat.order})`);
    });

    // Проверяем корневые категории
    const rootCategories = allCategories.filter(cat => !cat.parentId);
    console.log(`\n🌳 Корневых категорий: ${rootCategories.length}`);
    rootCategories.forEach(cat => {
      console.log(`  - ${cat.name}`);
    });

    // Проверяем структуру дерева
    const buildTree = (parentId) => {
      return allCategories
        .filter(cat => {
          if (!parentId) return !cat.parentId;
          return cat.parentId && cat.parentId.toString() === parentId.toString();
        })
        .map(cat => ({
          name: cat.name,
          children: buildTree(cat.id),
        }));
    };

    const tree = buildTree(null);
    console.log('\n🌲 Структура дерева:');
    const printTree = (items, indent = '') => {
      items.forEach(item => {
        console.log(`${indent}${item.name}`);
        if (item.children.length > 0) {
          printTree(item.children, indent + '  ');
        }
      });
    };
    printTree(tree);

  } catch (error) {
    console.error('❌ Error checking categories:', error);
  } finally {
    await disconnectDB();
  }
};

checkCategories();

