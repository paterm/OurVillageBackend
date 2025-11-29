require('dotenv').config();
const { connectDB, getRepository } = require('../src/utils/database');
const { Listing } = require('../src/entities/Listing');
const { User } = require('../src/entities/User');

const seedListings = async () => {
  try {
    await connectDB();
    
    const userRepo = getRepository(User);
    const listingRepo = getRepository(Listing);
    
    // Находим первого пользователя или создаем тестового
    let user = await userRepo.findOne({ where: {} });
    
    if (!user) {
      console.log('No users found. Please create a user first.');
      process.exit(1);
    }
    
    // Проверяем, есть ли уже объявления
    const existingListings = await listingRepo.count();
    if (existingListings > 0) {
      console.log('Listings already exist. Skipping seed.');
      process.exit(0);
    }
    
    const testListings = [
      {
        title: 'Установка бани под ключ',
        description: 'Профессиональная установка бани под ключ. Включает проектирование, строительство, подключение коммуникаций. Работаем быстро и качественно. Гарантия на все виды работ.',
        price: 250000,
        category: 'Строительство домов и сооружений',
        status: 'ACTIVE',
        type: 'SERVICE',
        userId: user.id,
      },
      {
        title: 'Установка и перевозка бытовок',
        description: 'Услуги по установке, перевозке и аренде бытовок. Доставка в день заказа. Различные размеры и комплектации. Работаем по всему региону.',
        price: 15000,
        category: 'Строительство домов и сооружений',
        status: 'ACTIVE',
        type: 'SERVICE',
        userId: user.id,
      },
      {
        title: 'Подключение интернета в частный дом',
        description: 'Быстрое подключение интернета в частный дом. Оптоволокно, спутниковый интернет. Настройка роутеров и Wi-Fi. Техническая поддержка 24/7.',
        price: 5000,
        category: 'Сети и коммуникации',
        status: 'ACTIVE',
        type: 'SERVICE',
        userId: user.id,
      },
      {
        title: 'Вывоз мусора контейнером',
        description: 'Вывоз строительного и бытового мусора. Контейнеры 8, 20, 27 куб.м. Работаем ежедневно. Вывоз в день заказа. Экологичная утилизация.',
        price: 3000,
        category: 'Мусор и утилизация',
        status: 'ACTIVE',
        type: 'SERVICE',
        userId: user.id,
      },
      {
        title: 'Услуги трактора и мини-экскаватора',
        description: 'Аренда трактора и мини-экскаватора для земляных работ. Копка траншей, планировка участка, завоз грунта. Опытный оператор. Работаем по договору.',
        price: 2000,
        category: 'Земляные работы',
        status: 'ACTIVE',
        type: 'SERVICE',
        userId: user.id,
      },
    ];
    
    for (const listingData of testListings) {
      const listing = listingRepo.create(listingData);
      await listingRepo.save(listing);
      console.log(`✅ Created listing: ${listingData.title}`);
    }
    
    console.log(`\n✅ Successfully seeded ${testListings.length} listings`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding listings:', error);
    process.exit(1);
  }
};

seedListings();

