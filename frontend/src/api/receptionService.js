// receptionService.js
import api from './axios';

const receptionService = {
  // Get all patients
  getAllPatients: async () => {
    try {
      const response = await api.get('/reception/patients');
      return response.data;
    } catch (error) {
      console.error('Error fetching patients:', error);
      throw error;
    }
  },
  
  // Register a new patient with comprehensive data
  registerPatient: async (patientData) => {
    try {
      const response = await api.post('/reception/patients', patientData);
      return response.data;
    } catch (error) {
      console.error('Error registering patient:', error);
      throw error;
    }
  },
  
  // Update patient information
  updatePatient: async (patientId, patientData) => {
    try {
      const response = await api.put(`/reception/patients/${patientId}`, patientData);
      return response.data;
    } catch (error) {
      console.error('Error updating patient:', error);
      throw error;
    }
  },
  
  // Get dashboard statistics
  getDashboardStats: async () => {
    try {
      const response = await api.get('/reception/dashboard');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }
};

export default receptionService;