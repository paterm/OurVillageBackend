require('dotenv').config();
const { connectDB, disconnectDB, getRepository } = require('../src/utils/database');
const { Category } = require('../src/entities/Category');

// Преобразуем структуру: subcategories -> children, items -> children
const categoriesData = [
  {
    name: 'Строительство и ремонт',
    icon: 'hammer-wrench',
    iconColor: '#FF6B35',
    order: 1,
    children: [
      {
        name: 'Строительство домов и сооружений',
        icon: 'home',
        iconColor: '#4ECDC4',
        order: 1,
        children: [
          { name: 'Строительство домов под ключ', icon: 'home', iconColor: '#4ECDC4', order: 1 },
          { name: 'Фундаменты', icon: 'foundation', iconColor: '#4ECDC4', order: 2 },
          { name: 'Кровельные работы', icon: 'roofing', iconColor: '#4ECDC4', order: 3 },
          { name: 'Каркасные строения', icon: 'view-grid', iconColor: '#4ECDC4', order: 4 },
          { name: 'Баня / сауна под ключ', icon: 'hot-tub', iconColor: '#4ECDC4', order: 5 },
          { name: 'Беседки, навесы, террасы', icon: 'deck', iconColor: '#4ECDC4', order: 6 },
          { name: 'Гаражи, хозблоки', icon: 'garage', iconColor: '#4ECDC4', order: 7 },
          { name: 'Бытовки (установка, перевозка, аренда)', icon: 'warehouse', iconColor: '#4ECDC4', order: 8 },
        ],
      },
      {
        name: 'Отделочные работы',
        icon: 'palette',
        iconColor: '#95E1D3',
        order: 2,
        children: [
          { name: 'Черновая отделка', icon: 'hammer', iconColor: '#95E1D3', order: 1 },
          { name: 'Чистовая отделка', icon: 'brush', iconColor: '#95E1D3', order: 2 },
          { name: 'Сантехника', icon: 'pipe', iconColor: '#95E1D3', order: 3 },
          { name: 'Малярные работы', icon: 'format-paint', iconColor: '#95E1D3', order: 4 },
          { name: 'Обои', icon: 'wallpaper', iconColor: '#95E1D3', order: 5 },
          { name: 'Теплый пол', icon: 'radiator', iconColor: '#95E1D3', order: 6 },
          { name: 'Монтаж дверей, перегородок', icon: 'door', iconColor: '#95E1D3', order: 7 },
        ],
      },
      {
        name: 'Ремонт и обслуживание',
        icon: 'toolbox',
        iconColor: '#F38181',
        order: 3,
        children: [
          { name: 'Ремонт домов и помещений', icon: 'home-edit', iconColor: '#F38181', order: 1 },
          { name: 'Косметический ремонт', icon: 'paint', iconColor: '#F38181', order: 2 },
          { name: 'Ремонт после затоплений/повреждений', icon: 'water', iconColor: '#F38181', order: 3 },
          { name: 'Мелкий бытовой ремонт', icon: 'wrench', iconColor: '#F38181', order: 4 },
        ],
      },
    ],
  },
  {
    name: 'Земляные работы и благоустройство',
    icon: 'shovel',
    iconColor: '#8B4513',
    order: 2,
    children: [
      {
        name: 'Земляные работы',
        icon: 'excavator',
        iconColor: '#CD853F',
        order: 1,
        children: [
          { name: 'Копка (траншеи, ямы, котлованы)', icon: 'shovel', iconColor: '#CD853F', order: 1 },
          { name: 'Вывоз грунта', icon: 'dump-truck', iconColor: '#CD853F', order: 2 },
          { name: 'Завоз грунта (чернозём, песок, плодородка)', icon: 'truck', iconColor: '#CD853F', order: 3 },
          { name: 'Планировка участка', icon: 'map', iconColor: '#CD853F', order: 4 },
          { name: 'Услуги мини-экскаватора', icon: 'excavator', iconColor: '#CD853F', order: 5 },
        ],
      },
      {
        name: 'Дорожные и площадочные работы',
        icon: 'road',
        iconColor: '#696969',
        order: 2,
        children: [
          { name: 'Укладка тротуарной плитки', icon: 'square', iconColor: '#696969', order: 1 },
          { name: 'Асфальтирование', icon: 'road', iconColor: '#696969', order: 2 },
          { name: 'Отсыпка щебнем', icon: 'layers', iconColor: '#696969', order: 3 },
          { name: 'Дренажные системы', icon: 'pipe', iconColor: '#696969', order: 4 },
          { name: 'Отмостки', icon: 'border-all', iconColor: '#696969', order: 5 },
        ],
      },
      {
        name: 'Благоустройство участка',
        icon: 'tree',
        iconColor: '#228B22',
        order: 3,
        children: [
          { name: 'Газоны', icon: 'grass', iconColor: '#228B22', order: 1 },
          { name: 'Озеленение, посадки', icon: 'tree', iconColor: '#228B22', order: 2 },
          { name: 'Ландшафтный дизайн', icon: 'flower', iconColor: '#228B22', order: 3 },
        ],
      },
    ],
  },
  {
    name: 'Электрика и инженерные системы',
    icon: 'lightning-bolt',
    iconColor: '#FFD700',
    order: 3,
    children: [
      {
        name: 'Электромонтаж',
        icon: 'flash',
        iconColor: '#FFA500',
        order: 1,
        children: [
          { name: 'Электромонтаж любой сложности', icon: 'flash', iconColor: '#FFA500', order: 1 },
          { name: 'Установка щитов', icon: 'electric-switch', iconColor: '#FFA500', order: 2 },
          { name: 'Трассировка', icon: 'map-marker-path', iconColor: '#FFA500', order: 3 },
          { name: 'Установка освещения (улица/дом)', icon: 'lightbulb', iconColor: '#FFA500', order: 4 },
        ],
      },
      {
        name: 'Отопление',
        icon: 'radiator',
        iconColor: '#FF6347',
        order: 2,
        children: [
          { name: 'Монтаж отопления', icon: 'radiator', iconColor: '#FF6347', order: 1 },
          { name: 'Тёплый пол', icon: 'radiator', iconColor: '#FF6347', order: 2 },
          { name: 'Котлы и обслуживание', icon: 'fire', iconColor: '#FF6347', order: 3 },
        ],
      },
      {
        name: 'Водоснабжение и канализация',
        icon: 'pipe',
        iconColor: '#1E90FF',
        order: 3,
        children: [
          { name: 'Установка насосов', icon: 'pump', iconColor: '#1E90FF', order: 1 },
          { name: 'Септики', icon: 'water', iconColor: '#1E90FF', order: 2 },
          { name: 'Прочистка канализации', icon: 'pipe-wrench', iconColor: '#1E90FF', order: 3 },
          { name: 'Разводка воды', icon: 'pipe', iconColor: '#1E90FF', order: 4 },
        ],
      },
    ],
  },
  {
    name: 'Сети и коммуникации',
    icon: 'network',
    iconColor: '#9370DB',
    order: 4,
    children: [
      { name: 'Подключение интернета', icon: 'wifi', iconColor: '#9370DB', order: 1 },
      { name: 'Прокладка кабеля', icon: 'cable-data', iconColor: '#9370DB', order: 2 },
      { name: 'Настройка роутеров, сетей', icon: 'router-wireless', iconColor: '#9370DB', order: 3 },
      { name: 'Видеонаблюдение', icon: 'cctv', iconColor: '#9370DB', order: 4 },
      { name: 'Умный дом', icon: 'home-automation', iconColor: '#9370DB', order: 5 },
    ],
  },
  {
    name: 'Транспорт и техника',
    icon: 'truck',
    iconColor: '#4169E1',
    order: 5,
    children: [
      {
        name: 'Грузоперевозки',
        icon: 'truck-delivery',
        iconColor: '#32CD32',
        order: 1,
        children: [
          { name: 'Перевозка крупногабаритных грузов', icon: 'truck', iconColor: '#32CD32', order: 1 },
          { name: 'Газель/бортовые', icon: 'truck-delivery', iconColor: '#32CD32', order: 2 },
          { name: 'Перевозка бытовок', icon: 'truck-cargo-container', iconColor: '#32CD32', order: 3 },
        ],
      },
      {
        name: 'Спецтехника',
        icon: 'excavator',
        iconColor: '#FF8C00',
        order: 2,
        children: [
          { name: 'Экскаватор', icon: 'excavator', iconColor: '#FF8C00', order: 1 },
          { name: 'Погрузчик', icon: 'forklift', iconColor: '#FF8C00', order: 2 },
          { name: 'Манипулятор', icon: 'crane', iconColor: '#FF8C00', order: 3 },
          { name: 'Автовышка', icon: 'tower-crane', iconColor: '#FF8C00', order: 4 },
        ],
      },
      {
        name: 'Завоз материалов',
        icon: 'dump-truck',
        iconColor: '#8B4513',
        order: 3,
        children: [
          { name: 'Заказать щебень', icon: 'layers', iconColor: '#8B4513', order: 1 },
          { name: 'Песок', icon: 'grain', iconColor: '#8B4513', order: 2 },
          { name: 'Грунт', icon: 'sprout', iconColor: '#8B4513', order: 3 },
          { name: 'Мульча', icon: 'leaf', iconColor: '#8B4513', order: 4 },
          { name: 'Щепа', icon: 'tree', iconColor: '#8B4513', order: 5 },
          { name: 'Пиломатериалы', icon: 'lumberjack', iconColor: '#8B4513', order: 6 },
        ],
      },
    ],
  },
  {
    name: 'Мусор и утилизация',
    icon: 'delete',
    iconColor: '#696969',
    order: 6,
    children: [
      { name: 'Вывоз мусора (контейнер, самосвал)', icon: 'delete', iconColor: '#696969', order: 1 },
      { name: 'Вывоз строительного мусора', icon: 'dump-truck', iconColor: '#696969', order: 2 },
      { name: 'Вывоз старой мебели', icon: 'sofa', iconColor: '#696969', order: 3 },
      { name: 'Утилизация крупногабарита', icon: 'package-variant', iconColor: '#696969', order: 4 },
      { name: 'Хапуга (местные перевозчики/самосвалы)', icon: 'truck', iconColor: '#696969', order: 5 },
    ],
  },
  {
    name: 'Дизайн и проектирование',
    icon: 'palette-advanced',
    iconColor: '#FF69B4',
    order: 7,
    children: [
      { name: 'Дизайн интерьера', icon: 'palette', iconColor: '#FF69B4', order: 1 },
      { name: 'Архитектор', icon: 'drawing', iconColor: '#FF69B4', order: 2 },
      { name: 'Ландшафтный дизайн', icon: 'flower', iconColor: '#FF69B4', order: 3 },
      { name: '3D-визуализации', icon: 'cube-outline', iconColor: '#FF69B4', order: 4 },
      { name: 'Проектирование домов', icon: 'home', iconColor: '#FF69B4', order: 5 },
    ],
  },
  {
    name: 'Юридические услуги',
    icon: 'gavel',
    iconColor: '#2F4F4F',
    order: 8,
    children: [
      { name: 'Кадастровый инженер', icon: 'map-marker', iconColor: '#2F4F4F', order: 1 },
      { name: 'Межевание', icon: 'vector-square', iconColor: '#2F4F4F', order: 2 },
      { name: 'Топосъёмка', icon: 'map', iconColor: '#2F4F4F', order: 3 },
      { name: 'Оформление собственности', icon: 'file-document', iconColor: '#2F4F4F', order: 4 },
      { name: 'Согласование перепланировок', icon: 'file-check', iconColor: '#2F4F4F', order: 5 },
    ],
  },
  {
    name: 'Уход за домом и участком',
    icon: 'home-heart',
    iconColor: '#20B2AA',
    order: 9,
    children: [
      { name: 'Уборка домов', icon: 'broom', iconColor: '#20B2AA', order: 1 },
      { name: 'Химчистка', icon: 'washing-machine', iconColor: '#20B2AA', order: 2 },
      { name: 'Уборка снега (разово/абонемент)', icon: 'snowflake', iconColor: '#20B2AA', order: 3 },
      { name: 'Уход за газоном', icon: 'grass', iconColor: '#20B2AA', order: 4 },
      { name: 'Обрезка деревьев', icon: 'tree', iconColor: '#20B2AA', order: 5 },
      { name: 'Выкорчевывание пней', icon: 'axe', iconColor: '#20B2AA', order: 6 },
    ],
  },
  {
    name: 'Охрана и безопасность',
    icon: 'shield',
    iconColor: '#DC143C',
    order: 10,
    children: [
      { name: 'Установка сигнализации', icon: 'alarm', iconColor: '#DC143C', order: 1 },
      { name: 'Видеонаблюдение', icon: 'cctv', iconColor: '#DC143C', order: 2 },
      { name: 'Домофоны', icon: 'doorbell', iconColor: '#DC143C', order: 3 },
      { name: 'Системы контроля доступа', icon: 'lock', iconColor: '#DC143C', order: 4 },
    ],
  },
  {
    name: 'Поставки и товары',
    icon: 'package-variant',
    iconColor: '#32CD32',
    order: 11,
    children: [
      { name: 'Заказать воду (питьевую/техническую)', icon: 'water', iconColor: '#32CD32', order: 1 },
      { name: 'Топливо (дрова, пеллеты, уголь)', icon: 'fire', iconColor: '#32CD32', order: 2 },
      { name: 'Песок/щебень/грунт (как отдельный запрос)', icon: 'layers', iconColor: '#32CD32', order: 3 },
    ],
  },
  {
    name: 'Прочие услуги',
    icon: 'dots-horizontal',
    iconColor: '#808080',
    order: 12,
    children: [
      { name: 'Выгул животных / присмотр', icon: 'dog', iconColor: '#808080', order: 1 },
      { name: 'Репетиторы', icon: 'school', iconColor: '#808080', order: 2 },
      { name: 'Детские аниматоры', icon: 'party-popper', iconColor: '#808080', order: 3 },
      { name: 'Фото/видео', icon: 'camera', iconColor: '#808080', order: 4 },
      { name: 'Ремонт техники', icon: 'wrench', iconColor: '#808080', order: 5 },
      { name: 'Частный мастер «муж на час»', icon: 'hammer-wrench', iconColor: '#808080', order: 6 },
    ],
  },
];

const seedCategories = async () => {
  try {
    await connectDB();
    const categoryRepo = getRepository(Category);

    // Проверяем существующие категории
    const existingCount = await categoryRepo.count();
    console.log(`📊 Существующих категорий: ${existingCount}`);

    // Очищаем существующие категории
    if (existingCount > 0) {
      await categoryRepo.delete({});
      console.log('🗑️  Существующие категории удалены');
    }

    let totalCreated = 0;

    const createCategory = async (data, parentId = null) => {
      const category = categoryRepo.create({
        name: data.name,
        icon: data.icon,
        iconColor: data.iconColor,
        order: data.order,
        parentId,
        isActive: true,
      });
      const saved = await categoryRepo.save(category);
      totalCreated++;
      
      if (totalCreated % 10 === 0) {
        console.log(`  Создано категорий: ${totalCreated}`);
      }

      if (data.children && data.children.length > 0) {
        for (const child of data.children) {
          await createCategory(child, saved.id);
        }
      }

      return saved;
    };

    console.log('🌱 Начинаем создание категорий...');
    for (const categoryData of categoriesData) {
      await createCategory(categoryData);
    }

    const finalCount = await categoryRepo.count();
    console.log(`✅ Categories seeded successfully! Всего создано: ${totalCreated}, в БД: ${finalCount}`);
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
    console.error(error.stack);
  } finally {
    await disconnectDB();
  }
};

seedCategories();
