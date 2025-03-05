import api from './axios';

const labService = {

    
  // Dashboard & Overview
  getPendingTests: async () => {
    try {
      const response = await api.get('/lab/tests/pending');
      return response.data;
    } catch (error) {
      console.error('Error fetching pending tests:', error);
      throw error;
    }
  },

  getCompletedTests: async () => {
    try {
      const response = await api.get('/lab/tests/completed');
      return response.data;
    } catch (error) {
      console.error('Error fetching completed tests:', error);
      throw error;
    }
  },

  getCriticalResults: async () => {
    try {
      const response = await api.get('/lab/tests/critical');
      return response.data;
    } catch (error) {
      console.error('Error fetching critical results:', error);
      throw error;
    }
  },
  getSamples: async () => {
    try {
      const response = await api.get('/lab/samples');
      return response.data;
    } catch (error) {
      console.error('Error fetching samples:', error);
      throw error;
    }
  },

  // In labService.js, change this method
collectSample: async (sampleData) => {
  try {
    // Change the endpoint from /test-orders/collect-sample to /samples
    const response = await api.post('/lab/samples', sampleData);
    return response.data;
  } catch (error) {
    console.error('Error collecting sample:', error);
    throw error;
  }
},

getTestResults: async () => {
  try {
    const response = await api.get('/lab/test-results');
    return response.data;
  } catch (error) {
    console.error('Error fetching test results:', error);
    throw error;
  }
},

addTestResult: async (resultData) => {
  try {
    console.log('Sending test result data:', resultData);
    const response = await api.post('/lab/test-results', resultData);
    return response.data;
  } catch (error) {
    console.error('Error adding test result:', error);
    throw error;
  }
},

updateTestResult: async (resultId, resultData) => {
  try {
    const response = await api.put(`/lab/test-results/${resultId}`, resultData);
    return response.data;
  } catch (error) {
    console.error('Error updating test result:', error);
    throw error;
  }
},
  // Test Management
  createTest: async (testData) => {
    try {
      const response = await api.post('/lab/tests', testData);
      return response.data;
    } catch (error) {
      console.error('Error creating test:', error);
      throw error;
    }
  },
  createReorderRequest: async (requestData) => {
    try {
      const response = await api.post('/lab/reorder-requests', requestData);
      return response.data;
    } catch (error) {
      console.error('Error creating reorder request:', error);
      throw error;
    }
  },

  addInventoryItem: async (itemData) => {
    try {
      const response = await api.post('/lab/inventory', itemData);
      return response.data;
    } catch (error) {
      console.error('Error adding inventory item:', error);
      throw error;
    }
  },
  
  updateTestStatus: async (testId, status) => {
    try {
      const response = await api.put(`/lab/tests/${testId}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating test status:', error);
      throw error;
    }
  },

  getTestsReadyForResults: async () => {
    try {
      const response = await api.get('/lab/tests/ready-for-results');
      return response.data;
    } catch (error) {
      console.error('Error fetching tests ready for results:', error);
      throw error;
    }
  },

  // Add to labService.js
  getTestOrders: async () => {
    try {
      const response = await api.get('/lab/test-orders');
      return response.data;
    } catch (error) {
      console.error('Error fetching test orders:', error);
      throw error;
    }
  },
  
  
  createTestOrder: async (orderData) => {
    try {
      console.log('Data being sent to API:', {
        patient: orderData.patient,
        doctor: orderData.doctor,
        testType: orderData.testType,
        scheduledDate: orderData.scheduledDate
      });
  
      const response = await api.post('/lab/test-orders', {
        patient: orderData.patient,
        doctor: orderData.doctor,
        testType: orderData.testType,
        scheduledDate: orderData.scheduledDate
      });
      return response.data;
    } catch (error) {
      console.error('Detailed error creating test order:', error.response?.data || error);
      throw error;
    }
  },
  
  updateTestStatus: async (orderId, status) => {
    try {
      const response = await api.put(`/lab/test-orders/${orderId}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating test status:', error);
      throw error;
    }
  },

  // Add to labService.js
removeTestOrder: async (testId) => {
  try {
    const response = await api.delete(`/lab/test-orders/${testId}`);
    return response.data;
  } catch (error) {
    console.error('Error removing test order:', error);
    throw error;
  }
},
  
  getPatients: async () => {
    try {
      const response = await api.get('/lab/patients-list');
      return response.data;
    } catch (error) {
      console.error('Error fetching patients:', error);
      throw error;
    }
  },
  
  
  // Sample Management
  getSamples: async () => {
    try {
      const response = await api.get('/lab/samples');
      return response.data;
    } catch (error) {
      console.error('Error fetching samples:', error);
      throw error;
    }
  },

  getDoctors: async () => {
    try {
      const response = await api.get('/lab/doctors-list');
      return response.data;
    } catch (error) {
      console.error('Error fetching doctors:', error);
      throw error;
    }
  },

  updateSampleStatus: async (sampleId, status) => {
    try {
      const response = await api.put(`/lab/samples/${sampleId}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating sample status:', error);
      throw error;
    }
  },

  
  // Inventory Management
  getInventory: async () => {
    try {
      const response = await api.get('/lab/inventory');
      return response.data;
    } catch (error) {
      console.error('Error fetching inventory:', error);
      throw error;
    }
  },

  updateInventoryItem: async (itemId, updateData) => {
    try {
      const response = await api.put(`/lab/inventory/${itemId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating inventory item:', error);
      throw error;
    }
  }
};

export default labService;