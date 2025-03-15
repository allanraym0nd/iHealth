import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User } from 'lucide-react';
import api from '../api/axios';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('Attempting login with:', formData);
      
      // Make the login request with username and password only
      const response = await api.post('/auth/login', {
        username: formData.username,
        password: formData.password
      });
      
      console.log('Login successful:', response.data);
      
      // Extract token and user role from response
      const token = response.data.token || 
                   response.data.accessToken || 
                   response.data.data?.token;
      
      const userRole = response.data.role;
      
      if (!token) {
        throw new Error('No token found in the response');
      }
      
      // Verify if selected role matches actual user role
      if (formData.role !== userRole) {
        setError(`Access denied: You do not have ${formData.role} privileges. Please select the correct role and try again.`);
        // Clear username and password fields for security
        setFormData({...formData, username: '', password: ''});
        return; // Stop execution and don't navigate
      }
      localStorage.setItem('token', token);
      localStorage.setItem('role', userRole);
      localStorage.setItem('userName', formData.username); // Add this line to store the username
      
      // Debugging log
      console.log('Stored in localStorage:', {
        token: localStorage.getItem('token'),
        role: localStorage.getItem('role'),
        userName: localStorage.getItem('userName')
      });
      
      // Navigate based on role
      switch(userRole) {
        case 'doctor':
          navigate('/doctor-dashboard');
          break;
        case 'nurse':
          navigate('/nurse-dashboard');
          break;
        case 'patient':
          navigate('/patient-dashboard');
          break;
        case 'pharmacy':
          navigate('/pharmacy-dashboard');
          break;
        case 'lab':
          navigate('/lab-dashboard');
          break;
        case 'billing':
          navigate('/billing-dashboard');
          break;
        case 'reception':
          navigate('/reception-dashboard');
          break;
        default:
          setError('Invalid role');
      }
    } catch (error) {
      console.log('Login failed:', error.response?.data);
      setError(error.response?.data?.message || 'Login failed');
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-white-500 to-white-600">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-96">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-center mb-6">iHealthManager:An Integrated HMS for UoN Health Services</h1>
          <h1 className="text-3xl font-bold text-gray-800">Welcome Back</h1>
          <p className="text-gray-500 mt-2">Please sign in to continue</p>
        </div>

        {/* Add error message display here */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="mb-6">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="Username"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="mb-6">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="password"
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="mb-6">
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <select
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 appearance-none bg-white"
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                required
              >
                <option value="">Select Role</option>
                <option value="doctor">Doctor</option>
                <option value="nurse">Nurse</option>
                <option value="patient">Patient</option>
                <option value="pharmacy">Pharmacy</option>
                <option value="lab">Laboratory</option>
                <option value="billing">Billing</option>
                <option value="reception">Reception</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors duration-300"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;