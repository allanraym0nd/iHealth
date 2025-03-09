import api from './axios';

const patientService = {
  getDashboardData: async () => {
    try {
      // Get patient profile first to get patient ID
      const profileResponse = await api.get('/patients/me');
      const patientId = profileResponse.data.data._id;
  
      // Get appointments
      const appointmentsResponse = await api.get('/patients/appointments');
      
      // Skip bills if not implemented
      let bills = [];
      try {
        const billsResponse = await api.get('/patients/bills');
        bills = billsResponse.data.data || [];
      } catch (billError) {
        console.log('Bills not available yet');
      }
  
      return {
        profile: profileResponse.data.data,
        appointments: appointmentsResponse.data.data || [],
        bills: bills,
        stats: {
          totalAppointments: appointmentsResponse.data.data?.length || 0,
          upcomingAppointments: appointmentsResponse.data.data?.filter(
            apt => new Date(apt.date) > new Date()
          ).length || 0
        }
      };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  },
  
  // Appointments
  // Add some console logs in patientService.js
getAppointments: async () => {
  try {
    const response = await api.get('/patients/appointments');
    
    console.log('Raw Appointments Response:', response.data);
    console.log('Appointments Data:', response.data.data);
    
    return response.data;
  } catch (error) {
    console.error('Error fetching appointments:', error);
    throw error;
  }
},

  requestAppointment: async (appointmentData) => {
    try {
      console.log('Sending Appointment Request:', {
        doctor: appointmentData.doctor,
        date: appointmentData.date,
        time: appointmentData.time,
        type: appointmentData.type,
        notes: appointmentData.notes
      });
  
      const response = await api.post('/patients/appointments', {
        doctor: appointmentData.doctor,
        date: appointmentData.date,
        time: appointmentData.time,
        type: appointmentData.type,
        notes: appointmentData.notes
      });
  
      console.log('Appointment Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error requesting appointment:', error);
      throw error;
    }
  },

  cancelAppointment: async (appointmentId) => {
    try {
      const response = await api.put(`/patients/appointments/${appointmentId}/cancel`);
      return response.data;
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      throw error;
    }
  },

  // Prescriptions
  getPrescriptions: async () => {
    try {
      const response = await api.get('/patients/prescriptions');
      return response.data;
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      throw error;
    }
  },
  // Bills
  getBills: async () => {
    try {
      // Return empty array if bills not implemented
      return {
        status: 'success',
        data: []
      };
    } catch (error) {
      console.error('Error fetching bills:', error);
      throw error;
    }
  },

  // Doctors
  getDoctors: async () => {
    try {
      const response = await api.get('/patients/doctors');
      return response.data;
    } catch (error) {
      console.error('Error fetching doctors:', error);
      throw error;
    }
  },

  requestRefill: async (prescriptionId, refillData) => {
    try {
      // Get the current user/patient ID from localStorage or sessionStorage
      const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
      
      // Create the payload with patient ID explicitly included
      const payload = {
        prescription: prescriptionId,
        patient: userId, // Add this line to include the patient ID
        ...refillData
      };
      
      console.log('Sending refill request with payload:', payload);
      
      const response = await api.post('/pharmacy/refill-requests', payload);
      return response.data;
    } catch (error) {
      console.error('Error requesting refill:', error);
      throw error;
    }
  },
  
  getRefillRequests: async () => {
    try {
      const response = await api.get('/pharmacy/patient-refill-requests');
      return response.data;
    } catch (error) {
      console.error('Error fetching refill requests:', error);
      throw error;
    }
  },
  // Medical Records
  getMedicalRecords: async () => {
    try {
      console.log('Fetching medical records');
      const response = await api.get('/patients/medical-records');
      console.log('Medical records response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching medical records:', error.response ? error.response.data : error.message);
      throw error;
    }
  },

  // Profile
  getProfile: async () => {
    try {
      const response = await api.get('/patients/me');
      return response.data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  },

  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/patients/me', profileData);
      return response.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },
  getBillingData: async () => {
    try {
      const response = await api.get('/patients/billing');
      return response.data;
    } catch (error) {
      console.error('Error fetching billing data:', error);
      throw error;
    }
  },
  
  makePayment: async (invoiceId, paymentDetails) => {
    try {
      const response = await api.post(`/patients/billing/${invoiceId}/pay`, paymentDetails);
      return response.data;
    } catch (error) {
      console.error('Error processing payment:', error);
      throw error;
    }
  },

  // Messages
  getMessages: async () => {
    try {
      const response = await api.get('/patients/messages');
      return response.data;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  },

  sendMessage: async (messageData) => {
    try {
      const response = await api.post('/patients/messages', messageData);
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  // Test Results
  getTestResults: async () => {
    try {
      const response = await api.get('/patients/test-results');
      return response.data;
    } catch (error) {
      console.error('Error fetching test results:', error);
      throw error;
    }
  }
};

export default patientService;