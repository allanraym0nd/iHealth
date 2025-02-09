import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests with more robust logging
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  console.log('Interceptor - Token from localStorage:', token);
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    console.warn('No token found in localStorage');
  }
  
  return config;
}, error => {
  console.error('Request Interceptor Error:', error);
  return Promise.reject(error);
});

// Add response interceptor for additional error tracking
api.interceptors.response.use(
  response => {
    console.log('API Response:', response);
    return response;
  },
  error => {
    console.error('API Error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    return Promise.reject(error);
  }
);

export default api;