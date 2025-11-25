¡const axios = require('axios');

/**
 * Отправить SMS через API
 */
const sendSMS = async (phone, message) => {
  try {
    const apiKey = process.env.SMS_API_KEY;
    const apiUrl = process.env.SMS_API_URL || 'https://sms.ru/api/sms/send';

    const response = await axios.post(apiUrl, {
      api_id: apiKey,
      to: phone,
      msg: message,
      json: 1
    });

    if (response.data.status === 'OK') {
      return { success: true, messageId: response.data.sms[phone].sms_id };
    } else {
      throw new Error(response.data.status_text || 'SMS sending failed');
    }
  } catch (error) {
    console.error('SMS sending error:', error);
    // В режиме разработки просто логируем
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV] SMS to ${phone}: ${message}`);
      return { success: true, messageId: 'dev-' + Date.now() };
    }
    throw error;
  }
};

/**
 * Отправить код подтверждения
 */
const sendVerificationCode = async (phone, code) => {
  const message = `Ваш код подтверждения: ${code}. Код действителен 10 минут.`;
  return await sendSMS(phone, message);
};

/**
 * Отправить уведомление о новом сообщении
 */
const sendMessageNotification = async (phone, senderName) => {
  const message = `У вас новое сообщение от ${senderName} на платформе MyVillage.`;
  return await sendSMS(phone, message);
};

/**
 * Отправить уведомление о новом отзыве
 */
const sendReviewNotification = async (phone, reviewerName) => {
  const message = `${reviewerName} оставил отзыв на ваше объявление на MyVillage.`;
  return await sendSMS(phone, message);
};

module.exports = {
  sendSMS,
  sendVerificationCode,
  sendMessageNotification,
  sendReviewNotification
};

