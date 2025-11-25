const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Создаем директорию uploads если её нет
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Настройка хранилища
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(uploadsDir, file.fieldname === 'avatar' ? 'avatars' : 'listings');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Фильтр файлов
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

// Настройка multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: fileFilter
});

/**
 * Middleware для загрузки аватара (одно изображение)
 */
const uploadAvatar = upload.single('avatar');

/**
 * Middleware для загрузки изображений объявлений (до 5 изображений)
 */
const uploadListingImages = upload.array('images', 5);

/**
 * Middleware для загрузки одного изображения
 */
const uploadSingleImage = upload.single('image');

module.exports = {
  uploadAvatar,
  uploadListingImages,
  uploadSingleImage,
  upload
};

