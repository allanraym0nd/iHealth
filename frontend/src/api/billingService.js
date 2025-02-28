import api from './axios';

const billingService = {
  // Test route
  test: async () => {
    try {
      const response = await api.get('/billing');
      console.log('Test response:', response);
      return response.data;
    } catch (error) {
      console.error('Test error:', error.response || error);
      throw error;
    }
  },

  // Add to billingService.js
  getAllPatients: async () => {
    try {
      const response = await api.get('/billing/patients/all');
      console.log('Patients fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching patients:', error);
      throw error;
    }
  },
  // Profile management
  createProfile: async (profileData) => {
    try {
      const response = await api.post('/billing/create', profileData);
      return response.data;
    } catch (error) {
      console.error('Error creating profile:', error);
      throw error;
    }
  },

  // Invoice management
  getInvoices: async () => {
    try {
      const response = await api.get('/billing/invoices');
      return response.data;
    } catch (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }
  },

  getPatientInvoices: async (patientId) => {
    try {
      const response = await api.get(`/billing/invoices/${patientId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching patient invoices:', error);
      throw error;
    }
  },

  createInvoice: async (patientId, invoiceData) => {
    try {
      const response = await api.post(`/billing/invoices/${patientId}`, invoiceData);
      return response.data;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  },

  // Payment processing
  processPayment: async (invoiceId, paymentData) => {
    try {
      console.log('Processing payment for invoiceId:', invoiceId);
      console.log('Payment data:', paymentData);
      
      const response = await api.put(`/billing/invoices/${invoiceId}/payment`, {
        paymentMethod: paymentData.paymentMethod,
        amount: paymentData.totalAmount
      });
      return response.data;
    } catch (error) {
      console.error('Detailed payment error:', error.response?.data || error.message);
      throw error;
    }
  },

  getPayments: async () => {
    try {
      const response = await api.get('/billing/payments');
      return response.data;
    } catch (error) {
      console.error('Error fetching payments:', error);
      throw error;
    }
  },

  // Expense tracking
  trackExpense: async (expenseData) => {
    try {
      const response = await api.post('/billing/expenses', expenseData);
      return response.data;
    } catch (error) {
      console.error('Error tracking expense:', error);
      throw error;
    }
  },

  // Insurance claims
  // In billingService.js
getInsuranceClaims: async () => {
  try {
    const response = await api.get('/billing/insurance-claims');
    return response.data;
  } catch (error) {
    console.error('Error fetching insurance claims:', error);
    throw error;
  }
},

submitInsuranceClaim: async (claimData) => {
  try {
    console.log('Submitting insurance claim:', claimData);
    
    const response = await api.post('/billing/insurance-claims', claimData);
    return response.data;
  } catch (error) {
    console.error('Detailed submission error:', 
      error.response?.data || error.message
    );
    throw error;
  }
},
  // Financial reports
  getFinancialReports: async () => {
    try {
      const response = await api.get('/billing/reports');
      return response.data;
    } catch (error) {
      console.error('Error getting financial reports:', error);
      throw error;
    }
  }
};

export default billingService;