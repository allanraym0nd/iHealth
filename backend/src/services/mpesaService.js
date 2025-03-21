const axios = require('axios');
const mpesaConfig = require('../config/mpesa');
const MpesaTransaction = require('../models/MpesaTransaction'); // Ensure this is correctly imported

class MpesaService {
  constructor() {
    this.baseUrl = mpesaConfig.environment === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';
  }

  // Helper method to format phone number
  formatPhoneNumber(number) {
    const cleaned = number.replace(/\s/g, '');
    if (cleaned.startsWith('0')) {
      return '254' + cleaned.substring(1);
    }
    return cleaned;
  }

  // Get OAuth token
  async getAccessToken() {
    try {
      const auth = Buffer.from(`${mpesaConfig.consumerKey}:${mpesaConfig.consumerSecret}`).toString('base64');
      const response = await axios.get(`${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
        headers: { 'Authorization': `Basic ${auth}` }
      });
      console.log('M-Pesa Access Token:', response.data);
      return response.data.access_token;
    } catch (error) {
      console.error('Error getting Mpesa access token:', error.response?.data || error.message);
      throw error;
    }
  }

  // Initiate STK Push
  async initiateSTKPush(phoneNumber, amount, invoiceId, billing, accountReference = 'Invoice Payment') {
    try {
      console.log('Initiating STK Push with:', { invoiceId, phoneNumber, amount });
  
      const token = await this.getAccessToken();
      const timestamp = this.getTimestamp();
      const password = this.getPassword(timestamp);
  
      const formattedPhoneNumber = this.formatPhoneNumber(phoneNumber);
  
      const requestData = {
        BusinessShortCode: mpesaConfig.shortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: formattedPhoneNumber,
        PartyB: mpesaConfig.shortCode,
        PhoneNumber: formattedPhoneNumber,
        CallBackURL: mpesaConfig.callbackUrl,
        AccountReference: accountReference,
        TransactionDesc: `Payment for Invoice #INV-${invoiceId ? invoiceId.slice(-8) : 'UNKNOWN'}`
      };
  
      console.log('STK Push Request:', requestData);
  
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
  
      console.log('STK Push Response:', response.data);
  
      // Save the transaction to the database
      const transaction = new MpesaTransaction({
        patient: billing.patient, // Use the billing object passed as a parameter
        invoice: invoiceId,
        billingId: billing._id, // Use the billing object passed as a parameter
        phoneNumber: formattedPhoneNumber,
        amount: amount,
        merchantRequestId: response.data.MerchantRequestID,
        checkoutRequestId: response.data.CheckoutRequestID,
        status: 'pending'
      });
  
      await transaction.save();
      console.log('Transaction saved:', transaction);
  
      return response.data;
    } catch (error) {
      console.error('Error initiating STK push:', error.response?.data || error);
      throw error;
    }
  }

  // Query STK Push status
  async checkTransactionStatus(checkoutRequestId) {
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

      console.log('STK Push Status Query Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error querying STK status:', error.response?.data || error);
      throw error;
    }
  }

  // Helper methods
  getTimestamp() {
    const date = new Date();
    return (
      date.getFullYear() +
      ('0' + (date.getMonth() + 1)).slice(-2) +
      ('0' + date.getDate()).slice(-2) +
      ('0' + date.getHours()).slice(-2) +
      ('0' + date.getMinutes()).slice(-2) +
      ('0' + date.getSeconds()).slice(-2)
    );
  }

  getPassword(timestamp) {
    const { shortCode, passKey } = mpesaConfig;
    const password = `${shortCode}${passKey}${timestamp}`;
    return Buffer.from(password).toString('base64');
  }
}

// Export a new instance of the class
module.exports = new MpesaService();