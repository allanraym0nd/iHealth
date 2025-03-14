const axios = require('axios');
const mpesaConfig = require('../config/mpesa');

class MpesaService {
  constructor() {
    this.baseUrl = mpesaConfig.environment === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';
  }

  // Get OAuth token
  async getAccessToken() {
    try {
        const auth = Buffer.from(`${mpesaConfig.consumerKey}:${mpesaConfig.consumerSecret}`).toString('base64');
        const response = await axios.get(`${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
            headers: { 'Authorization': `Basic ${auth}` }
        });
        console.log('M-Pesa Access Token:', response.data); // Log token response
        return response.data.access_token;
    } catch (error) {
        console.error('Error getting Mpesa access token:', error.response?.data || error.message);
        throw error;
    }
}


  // Initiate STK Push
  async initiateSTKPush(phoneNumber, amount, invoiceId, accountReference = 'Invoice Payment') {
    try {
        console.log('Initiating STK Push with:', { invoiceId, phoneNumber, amount }); // Logging request data
        
        const token = await this.getAccessToken();
        const timestamp = this.getTimestamp();
        const password = this.getPassword(timestamp);
        
        const requestData = {
            BusinessShortCode: mpesaConfig.shortCode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: amount,
            PartyA: phoneNumber,
            PartyB: mpesaConfig.shortCode,
            PhoneNumber: phoneNumber,
            CallBackURL: mpesaConfig.callbackUrl,
            AccountReference: accountReference,
            TransactionDesc: `Payment for Invoice #INV-${invoiceId ? invoiceId.slice(-8) : 'UNKNOWN'}`
        };

        console.log('STK Push Request:', requestData); // Log request data
        
        const response = await axios.post(
            `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
            requestData,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('STK Push Response:', response.data); // Log response data
        return response.data;
    } catch (error) {
        console.error('Error initiating STK push:', error.response?.data || error);
        throw error;
    }
}

  // Query STK Push status
  async querySTKStatus(checkoutRequestId) {
    try {
      const token = await this.getAccessToken();
      const timestamp = this.getTimestamp();
      const password = this.getPassword(timestamp);
      
      const response = await axios.post(
        `${this.baseUrl}/mpesa/stkpushquery/v1/query`,
        {
          BusinessShortCode: mpesaConfig.shortCode,
          Password: password,
          Timestamp: timestamp,
          CheckoutRequestID: checkoutRequestId
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error querying STK status:', error.response?.data || error);
      throw error;
    }
  }

  // Helper methods
  getTimestamp() {
    const date = new Date();
    return date.getFullYear() +
      ('0' + (date.getMonth() + 1)).slice(-2) +
      ('0' + date.getDate()).slice(-2) +
      ('0' + date.getHours()).slice(-2) +
      ('0' + date.getMinutes()).slice(-2) +
      ('0' + date.getSeconds()).slice(-2);
  }

  getPassword(timestamp) {
    const { shortCode, passKey } = mpesaConfig;
    const password = `${shortCode}${passKey}${timestamp}`;
    return Buffer.from(password).toString('base64');
  }
}

module.exports = new MpesaService();