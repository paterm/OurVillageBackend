const { getRepository } = require('../utils/database');
const { Category } = require('../entities/Category');

/**
 * Получить все категории в виде дерева
 */
const getCategoriesTree = async () => {
  const categoryRepo = getRepository(Category);
  
  // Получаем все активные категории, отсортированные по order
  const allCategories = await categoryRepo.find({
    where: { isActive: true },
    order: { order: 'ASC' },
  });
  
  // Строим дерево: сначала корневые категории (parentId === null)
  const rootCategories = allCategories.filter(cat => !cat.parentId);
  
  // Рекурсивно строим дерево
  const buildTree = (parentId) => {
    if (!parentId) return [];
    
    // Преобразуем parentId в строку для сравнения
    const parentIdStr = parentId.toString();
    
    return allCategories
      .filter(cat => {
        // Сравниваем как строки, так как это UUID
        if (!cat.parentId) return false;
        return cat.parentId.toString() === parentIdStr;
      })
      .map(cat => ({
        id: cat.id.toString(),
        name: cat.name,
        icon: cat.icon,
        iconColor: cat.iconColor,
        order: cat.order,
        children: buildTree(cat.id),
      }))
      .sort((a, b) => a.order - b.order);
  };
  
  return rootCategories.map(cat => ({
    id: cat.id.toString(),
    name: cat.name,
    icon: cat.icon,
    iconColor: cat.iconColor,
    order: cat.order,
    children: buildTree(cat.id),
  })).sort((a, b) => a.order - b.order);
};

/**
 * Получить все категории (плоский список)
 */
const getAllCategories = async () => {
  const categoryRepo = getRepository(Category);
  return await categoryRepo.find({
    where: { isActive: true },
    order: { order: 'ASC' },
  });
};

/**
 * Получить категорию по ID
 */
const getCategoryById = async (id) => {
  const categoryRepo = getRepository(Category);
  return await categoryRepo.findOne({
    where: { id, isActive: true },
    relations: ['parent', 'children'],
  });
};

/**
 * Создать категорию
 */
const createCategory = async (categoryData) => {
  const categoryRepo = getRepository(Category);
  const category = categoryRepo.create(categoryData);
  return await categoryRepo.save(category);
};

/**
 * Обновить категорию
 */
const updateCategory = async (id, updateData) => {
  const categoryRepo = getRepository(Category);
  const category = await categoryRepo.findOne({ where: { id } });
  if (!category) {
    throw new Error('Category not found');
  }
  Object.assign(category, updateData);
  return await categoryRepo.save(category);
};

/**
 * Удалить категорию (мягкое удаление)
 */
const deleteCategory = async (id) => {
  const categoryRepo = getRepository(Category);
  const category = await categoryRepo.findOne({ where: { id } });
  if (!category) {
    throw new Error('Category not found');
  }
  category.isActive = false;
  return await categoryRepo.save(category);
};

module.exports = {
  getCategoriesTree,
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};

