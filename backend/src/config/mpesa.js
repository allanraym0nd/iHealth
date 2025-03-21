// config/mpesa.js
module.exports = {
  consumerKey: process.env.MPESA_CONSUMER_KEY,
  consumerSecret: process.env.MPESA_CONSUMER_SECRET,
  passKey: process.env.MPESA_PASSKEY,
  shortCode: process.env.MPESA_SHORTCODE,
  callbackUrl: process.env.MPESA_CALLBACK_URL,
  environment: process.env.MPESA_ENVIRONMENT || 'sandbox' // 'sandbox' or 'production'
};