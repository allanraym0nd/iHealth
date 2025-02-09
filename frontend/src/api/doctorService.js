import api from './axios';

const doctorService = {


    // Test route first
    test: async () => {
      try {
        const response = await api.get('/doctors');  // Simple test route
        console.log('Test response:', response);
        return response.data;
      } catch (error) {
        console.error('Test error:', error.response || error);
        throw error;
      }
    },
  // Get doctor's profile
  getProfile: async () => {
    try {
      const response = await api.get('/doctors/profile');  // Removed extra 'api'
      console.log('Profile response:', response);
      return response.data;
    } catch (error) {
      console.error('Profile error:', error.response || error);
      throw error;
    }
  },
  createPatient: async (patientData) => {
    try {
      const response = await api.post('/doctors/patients', patientData);
      return response.data;
    } catch (error) {
      console.error('Error creating patient:', error);
      throw error;
    }
  },
  
  // Get doctor's patients
  getPatients: async () => {
    try {
      console.log('Fetching patients...');
      const response = await api.get('/doctors/patients');
      console.log('Patients response:', response);
      
      // Log the full response data
      console.log('Response data:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('Detailed patients fetch error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  },
  // Get doctor's appointments
  getAppointments: async () => {
    try {
      const response = await api.get('/doctors/appointments');  // Removed extra 'api'
      console.log('Appointments response:', response);
      return response.data;
    } catch (error) {
      console.error('Appointments error:', error.response || error);
      throw error;
    }
  },

  // Get doctor's schedule
  getSchedule: async () => {
    try {
      const response = await api.get('/doctors/schedule');  // Removed extra 'api'
      console.log('Schedule response:', response);
      return response.data;
    } catch (error) {
      console.error('Schedule error:', error.response || error);
      throw error;
    }
  }
};

export default doctorService;