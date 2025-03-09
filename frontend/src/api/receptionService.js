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

  getDashboardStats: async () => {
    try {
      const response = await api.get('/reception/dashboard-stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },

  getTodayAppointments: async () => {
    try {
      const response = await api.get('/reception/appointments/today');
      return response.data;
    } catch (error) {
      console.error('Error fetching today\'s appointments:', error);
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

  // Create a new appointment
createAppointment: async (appointmentData) => {
  try {
    const response = await api.post('/reception/appointments', appointmentData);
    return response.data;
  } catch (error) {
    console.error('Error creating appointment:', error);
    throw error;
  }
},

// Get available doctors for appointment scheduling
getAvailableDoctors: async (date, time) => {
  try {
    const response = await api.get('/reception/available-doctors', { 
      params: { date, time } 
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching available doctors:', error);
    throw error;
  }
},

// Update appointment status
updateAppointmentStatus: async (appointmentId, status) => {
  try {
    const response = await api.put(`/reception/appointments/${appointmentId}/status`, { status });
    return response.data;
  } catch (error) {
    console.error('Error updating appointment status:', error);
    throw error;
  }
},

// In receptionService.js
// Add these methods

// Get current appointment queue
getCurrentQueue: async () => {
  try {
    const response = await api.get('/reception/queue');
    return response.data;
  } catch (error) {
    console.error('Error fetching appointment queue:', error);
    throw error;
  }
},

// Update appointment queue status
updateQueueStatus: async (appointmentId, data) => {
  try {
    const response = await api.put(`/reception/appointments/${appointmentId}/queue-status`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating appointment status:', error);
    throw error;
  }
},

// Reorder queue
reorderQueue: async (appointments) => {
  try {
    const response = await api.post('/reception/queue/reorder', { appointments });
    return response.data;
  } catch (error) {
    console.error('Error reordering queue:', error);
    throw error;
  }
},

// In receptionService.js
// Add this method
getWaitingTimeEstimate: async (appointmentId) => {
  try {
    const response = await api.get(`/reception/appointments/${appointmentId}/waiting-time`);
    return response.data;
  } catch (error) {
    console.error('Error calculating waiting time:', error);
    throw error;
  }
},

// In receptionService.js
getAppointmentAnalytics: async (period = 'day') => {
  try {
    const response = await api.get('/reception/analytics/appointments', {
      params: { period }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching appointment analytics:', error);
    throw error;
  }
},

// Delete a patient
deletePatient: async (patientId) => {
  try {
    const response = await api.delete(`/reception/patients/${patientId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting patient:', error);
    throw error;
  }
}



  
};

export default receptionService;