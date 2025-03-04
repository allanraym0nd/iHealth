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
      const response = await api.post('/auth/login', formData);
      console.log('Login successful:', response.data);
      console.log('Token stored:', localStorage.getItem('token'));
      // Log response for debugging
      console.log('Full Login Response:', response);
      console.log('Response Data:', response.data);
  
      // Get token from response
      const token = response.data.token || 
                    response.data.accessToken || 
                    response.data.data?.token;
      
      console.log('Extracted Token:', token);
  
      if (!token) {
        throw new Error('No token found in the response');
      }
      
  
      // Store token and role
      localStorage.setItem('token', token);
      localStorage.setItem('role', response.data.role);
      navigate(`/${response.data.role}-dashboard`);
  
      // Log stored token
      console.log('Stored Token:', localStorage.getItem('token'));
  
      // Navigate based on role
      const role = response.data.role;
      console.log('User Role:', role);
  
      // Single navigation based on role
      if (role === 'doctor') navigate('/doctor-dashboard');
      else if (role === 'nurse') navigate('/nurse-dashboard');
      else if (role === 'patient') navigate('/patient-dashboard');
      else if (role === 'pharmacy') navigate('/pharmacy-dashboard');
      else if (role === 'lab') navigate('/lab-dashboard');
      else if (role === 'billing') navigate('/billing-dashboard');
      else if (role === 'reception') navigate('/reception-dashboard');
      

      else setError('Invalid role');
  
    

      // Navigate based on role
      switch(response.data.role) {
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
  // ... rest of the component remains the same

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