import api from './axios';

const pharmacyService = {


    // In pharmacyService.js
getDashboardStats: async () => {
    try {
      const [
        prescriptionsResponse, 
        refillRequestsResponse, 
        inventoryResponse
      ] = await Promise.all([
        api.get('/pharmacy/prescriptions'),
        api.get('/pharmacy/refill-requests'),
        api.get('/pharmacy/inventory')
      ]);
  
      return {
        pendingPrescriptions: prescriptionsResponse.data.filter(p => p.status === 'pending'),
        urgentPrescriptions: prescriptionsResponse.data.filter(p => p.priority === 'urgent'),
        refillRequests: refillRequestsResponse.data,
        lowStockItems: inventoryResponse.data.filter(item => item.quantity <= item.reorderLevel)
      };
    } catch (error) {
      console.error('Error fetching pharmacy dashboard stats:', error);
      throw error;
    }
  },
    // Test route
    test: async () => {
        try {
            const response = await api.get('/pharmacy');
            console.log('Test response:', response);
            return response.data;
        } catch (error) {
            console.error('Test error:', error.response || error);
            throw error;
        }
    },

    // Get all prescriptions
    getPrescriptions: async () => {
      try {
        const response = await api.get('/pharmacy/prescriptions');
        return { 
          data: response.data?.data || response.data || [],
          status: response.status 
        };
      } catch (error) {
        console.error('Error fetching prescriptions:', error);
        return { 
          data: [], 
          status: error.response?.status 
        };
      }
    },
    
      processPrescription: async (prescriptionId) => {
        try {
          const response = await api.put(`/pharmacy/prescriptions/${prescriptionId}/process`);
          return response.data;
        } catch (error) {
          console.error('Error processing prescription:', error);
          throw error;
        }
      },
    

    // Get inventory
    getInventory: async () => {
      try {
        const response = await api.get('/pharmacy/inventory');
        return { 
          data: response.data?.data || response.data || [],
          status: response.status 
        };
      } catch (error) {
        console.error('Error fetching inventory:', error);
        return { 
          data: [], 
          status: error.response?.status 
        };
      }
    },
    addInventoryItem: async (itemData) => {
      try {
        const response = await api.post('/pharmacy/inventory', itemData);
        return response.data;
      } catch (error) {
        console.error('Error adding inventory item:', error);
        throw error;
      }
    },

    // Update inventory item
    updateInventoryItem: async (itemId, itemData) => {
      try {
        const response = await api.put(`/pharmacy/inventory/${itemId}`, itemData);
        return response.data;
      } catch (error) {
        console.error('Error updating inventory item:', error);
        throw error;
      }
    },

    deleteInventoryItem: async (itemId) => {
      try {
        const response = await api.delete(`/pharmacy/inventory/${itemId}`);
        return response.data;
      } catch (error) {
        console.error('Error deleting inventory item:', error);
        throw error;
      }
    },
  
    // Get refill requests
    getRefillRequests: async () => {
      try {
        const response = await api.get('/pharmacy/refill-requests');
        return response.data;
      } catch (error) {
        console.error('Error fetching refill requests:', error.response || error);
        return []; // Return empty array instead of throwing error
      }
    },
    // Process refill request
    processRefillRequest: async (requestId, data) => {
      try {
        const response = await api.put(`/pharmacy/refill-requests/${requestId}`, data);
        return response.data;
      } catch (error) {
        console.error('Error processing refill request:', error);
        throw error;
      }
    }
};

export default pharmacyService;