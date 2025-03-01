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
      console.log('Sending patient data:', patientData); // Debug log
      const response = await api.post('/doctors/patients', {
        name: patientData.name,
        age: parseInt(patientData.age),
        contact: {
          phone: patientData.contact.phone,
          email: patientData.contact.email
        },
        status: patientData.status
      });
      console.log('Create patient response:', response);
      return response.data;
    } catch (error) {
      console.error('Error creating patient:', error.response?.data || error);
      throw error;
    }
  },
  
  // Get doctor's patients
  getPatients: async () => {
    try {
      console.log('Fetching patients...');
      const response = await api.get('/doctors/patients');
      console.log('Patients response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Patients fetch error:', error);
      throw error;
    }
  },

  createAppointment: async (appointmentData) => {
    try {
      const response = await api.post('/doctors/appointments', appointmentData);
      return response.data;
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  },
  
  cancelAppointment: async (appointmentId) => {
    try {
      const response = await api.put(`/doctors/appointments/${appointmentId}/cancel`);
      return response.data;
    } catch (error) {
      console.error('Error cancelling appointment:', error);
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
  completeAppointment: async (appointmentId) => {
    try {
      const response = await api.put(`/doctors/appointments/${appointmentId}/complete`);
      return response.data;
    } catch (error) {
      console.error('Error completing appointment:', error);
      throw error;
    }
  },

  rescheduleAppointment: async (appointmentId, rescheduleData) => {
    try {
      const response = await api.put(`/doctors/appointments/${appointmentId}/reschedule`, rescheduleData);
      return response.data;
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      throw error;
    }
  },
  // Add to doctorService.js
getMedicalRecords: async () => {
  try {
    const response = await api.get('/medical-records');
    return response.data;
  } catch (error) {
    console.error('Error fetching medical records:', error);
    throw error;
  }
},

createMedicalRecord: async (recordData) => {
  try {
    const response = await api.post('/medical-records', recordData);
    return response.data;
  } catch (error) {
    console.error('Error creating medical record:', error);
    throw error;
  }
},

// Add to doctorService.js
getMessages: async () => {
  try {
    const response = await api.get('/messages');
    return response.data;
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
},

sendMessage: async (messageData) => {
  try {
    const response = await api.post('/messages', messageData);
    return response.data;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
},

markMessageAsRead: async (messageId) => {
  try {
    const response = await api.patch(`/messages/${messageId}/read`);
    return response.data;
  } catch (error) {
    console.error('Error marking message as read:', error);
    throw error;
  }
},

getUsers: async () => {
  try {
    const response = await api.get('/users');
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
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
  },
  getPrescriptions: async () => {
    try {
      const response = await api.get('/doctors/prescriptions');
      return response.data;
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      throw error;
    }
  },
  
  createPrescription: async (prescriptionData) => {
    try {
      const response = await api.post('/doctors/prescriptions', prescriptionData);
      return response.data;
    } catch (error) {
      console.error('Error creating prescription:', error);
      throw error;
    }
  },

  // Add to doctorService.js
createLabOrder: async (labOrderData) => {
  try {
    const response = await api.post('/doctors/lab-orders', labOrderData);
    return response.data;
  } catch (error) {
    console.error('Error creating lab order:', error);
    throw error;
  }
},

getLabOrders: async () => {
  try {
    const response = await api.get('/doctors/lab-orders');
    return response.data;
  } catch (error) {
    console.error('Error fetching lab orders:', error);
    throw error;
  }
},

cancelLabOrder: async (labOrderId) => {
  try {
    const response = await api.put(`/doctors/lab-orders/${labOrderId}/cancel`);
    return response.data;
  } catch (error) {
    console.error('Error cancelling lab order:', error);
    throw error;
  }
}
};

export default doctorService;