// services/mpesaService.js
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
        headers: {
          'Authorization': `Basic ${auth}`
        }
      });
      
      return response.data.access_token;
    } catch (error) {
      console.error('Error getting Mpesa access token:', error);
      throw error;
    }
  }

  // Initiate STK Push
  async initiateSTKPush(phoneNumber, amount, invoiceId, accountReference = 'Invoice Payment') {
    try {
      const token = await this.getAccessToken();
      const timestamp = this.getTimestamp();
      const password = this.getPassword(timestamp);
      
      const response = await axios.post(
        `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
        {
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
          TransactionDesc: `Payment for Invoice #INV-${invoiceId.slice(-8)}`
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