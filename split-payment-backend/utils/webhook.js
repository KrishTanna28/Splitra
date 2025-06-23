const axios = require('axios');

const triggerWebhook = async (url, payload) => {
  try {
    await axios.post(url, payload);
    console.log('🌐 Webhook triggered.');
  } catch (err) {
    console.error('❌ Webhook failed:', err.message);
  }
};

module.exports = triggerWebhook;
