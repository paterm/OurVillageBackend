const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

// Настройка AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'ru-central1',
  endpoint: process.env.AWS_ENDPOINT || `https://storage.yandexcloud.net`
});

/**
 * Загрузить файл в S3
 */
const uploadToS3 = async (file, folder = 'uploads') => {
  try {
    const fileContent = fs.readFileSync(file.path);
    const fileName = `${folder}/${Date.now()}-${path.basename(file.originalname)}`;

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileName,
      Body: fileContent,
      ContentType: file.mimetype,
      ACL: 'public-read'
    };

    const result = await s3.upload(params).promise();

    // Удалить локальный файл после загрузки
    fs.unlinkSync(file.path);

    return result.Location;
  } catch (error) {
    console.error('S3 upload error:', error);
    // Fallback: вернуть локальный путь
    return `/uploads/${file.filename}`;
  }
};

/**
 * Удалить файл из S3
 */
const deleteFromS3 = async (fileUrl) => {
  try {
    const url = new URL(fileUrl);
    const key = url.pathname.substring(1); // Убрать первый /

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key
    };

    await s3.deleteObject(params).promise();
    return true;
  } catch (error) {
    console.error('S3 delete error:', error);
    return false;
  }
};

/**
 * Получить публичный URL файла
 */
const getPublicUrl = (fileName) => {
  if (fileName.startsWith('http')) {
    return fileName;
  }
  return `https://${process.env.AWS_BUCKET_NAME}.storage.yandexcloud.net/${fileName}`;
};

module.exports = {
  uploadToS3,
  deleteFromS3,
  getPublicUrl
};

