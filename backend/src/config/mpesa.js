// config/mpesa.js
module.exports = {
    consumerKey: process.env.MPESA_CONSUMER_KEY || 'EOfS...',  // Your consumer key
    consumerSecret: process.env.MPESA_CONSUMER_SECRET || 'LGfF...', // Your consumer secret
    passKey: process.env.MPESA_PASSKEY || 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919',  // Default sandbox passkey
    shortCode: process.env.MPESA_SHORTCODE || '174379', // Default sandbox shortcode
    callbackUrl: process.env.MPESA_CALLBACK_URL || 'https://your-domain.com/api/billing/mpesa-callback',
    environment: process.env.MPESA_ENVIRONMENT || 'sandbox' // 'sandbox' or 'production'
  };