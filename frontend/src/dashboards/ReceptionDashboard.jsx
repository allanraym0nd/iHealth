// ReceptionDashboard.jsx
import React, { useState, useEffect } from 'react';
import { User, Calendar, BarChart2, ClipboardList, Settings, Users } from 'lucide-react';
import ReceptionRegistration from './sections/ReceptionRegistration';
import receptionService from '../api/receptionService';
import AppointmentScheduler from './sections/AppointmentScheduler';
import QueueManagement from './sections/QueueManagement';
import AnalyticsDashboard from './sections/AnalyticsDashboard';
import UserAccountManagement from './sections/UserAccountManagement';


const ReceptionDashboard = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState({
    patients: {
      newToday: 0,
      total: 0,
      demographics: []
    },
    appointments: {
      total: 0,
      scheduled: 0,
      completed: 0,
      cancelled: 0,
      details: []
    },
    facility: {
      activeDoctors: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch dashboard stats
        const statsResponse = await receptionService.getDashboardStats();
        
        setDashboardData(statsResponse.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

 // ReceptionDashboard.jsx
const renderDashboardContent = () => {
  if (loading) return <div className="p-6">Loading dashboard data...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Reception Dashboard</h2>

      {/* Patient Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center mb-4">
            <User className="text-purple-500 mr-2" size={24} />
            <h3 className="text-lg font-medium">New Patients</h3>
          </div>
          <p className="text-3xl font-bold">{dashboardData.patients.newToday}</p>
          <p className="text-sm text-gray-500">Today</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center mb-4">
            <User className="text-blue-500 mr-2" size={24} />
            <h3 className="text-lg font-medium">Total Patients</h3>
          </div>
          <p className="text-3xl font-bold">{dashboardData.patients.total}</p>
          <p className="text-sm text-gray-500">Registered</p>
        </div>
      </div>

      {/* Appointment Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center mb-4">
            <Calendar className="text-blue-500 mr-2" size={24} />
            <h3 className="text-lg font-medium">Total Appointments</h3>
          </div>
          <p className="text-3xl font-bold">{dashboardData.appointments.total}</p>
          <p className="text-sm text-gray-500">Today</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center mb-4">
            <Calendar className="text-green-500 mr-2" size={24} />
            <h3 className="text-lg font-medium">Scheduled</h3>
          </div>
          <p className="text-3xl font-bold">{dashboardData.appointments.scheduled}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center mb-4">
            <Calendar className="text-red-500 mr-2" size={24} />
            <h3 className="text-lg font-medium">Cancelled</h3>
          </div>
          <p className="text-3xl font-bold">{dashboardData.appointments.cancelled}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center mb-4">
            <Calendar className="text-yellow-500 mr-2" size={24} />
            <h3 className="text-lg font-medium">Completed</h3>
          </div>
          <p className="text-3xl font-bold">{dashboardData.appointments.completed}</p>
        </div>
      </div>

      {/* Today's Appointments */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h3 className="text-lg font-medium">Today's Appointments</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dashboardData.appointments.details.length > 0 ? (
                dashboardData.appointments.details.map((appointment) => (
                  <tr key={appointment._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {appointment.patient?.name || 'Unknown Patient'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {appointment.doctor?.name || 'Unknown Doctor'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{appointment.time}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{appointment.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        appointment.status === 'scheduled' 
                          ? 'bg-blue-100 text-blue-800'
                          : appointment.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {appointment.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    No appointments today
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return renderDashboardContent();
      case 'registration':
        return <ReceptionRegistration />;
        case 'appointments':  
        return <AppointmentScheduler />;
        case 'queue':
        return <QueueManagement />;
        case 'accounts':  
      return <UserAccountManagement />;
        case 'analytics':
      return <AnalyticsDashboard />;
      default:
        return renderDashboardContent();
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold">Reception Portal</h1>
          <p className="text-gray-600">Welcome back</p>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            <li>
              <button
                onClick={() => setActiveSection('dashboard')}
                className={`flex items-center w-full p-3 rounded-lg ${
                  activeSection === 'dashboard' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'hover:bg-gray-100'
                }`}
              >
                <BarChart2 className="mr-3" size={20} />
                Dashboard
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveSection('registration')}
                className={`flex items-center w-full p-3 rounded-lg ${
                  activeSection === 'registration' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'hover:bg-gray-100'
                }`}
              >
                <User className="mr-3" size={20} />
                Patient Registration
              </button>
            </li>
            <li>
    <button
      onClick={() => setActiveSection('appointments')}
      className={`flex items-center w-full p-3 rounded-lg ${
        activeSection === 'appointments' 
          ? 'bg-blue-100 text-blue-800' 
          : 'hover:bg-gray-100'
      }`}
    >
      <Calendar className="mr-3" size={20} />
      Appointments
    </button>
  </li>

  <li>
              <button
                onClick={() => setActiveSection('queue')}
                className={`flex items-center w-full p-3 rounded-lg ${
                  activeSection === 'queue' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'hover:bg-gray-100'
                }`}
              >
                <ClipboardList className="mr-3" size={20} />
                Queue Management
              </button>
            </li>
            <li>
  <button
    onClick={() => setActiveSection('accounts')}
    className={`flex items-center w-full p-3 rounded-lg ${
      activeSection === 'accounts' 
        ? 'bg-blue-100 text-blue-800' 
        : 'hover:bg-gray-100'
    }`}
  >
    <Users className="mr-3" size={20} />
    User Accounts
  </button>
</li>
            <li>
  <button
    onClick={() => setActiveSection('analytics')}
    className={`flex items-center w-full p-3 rounded-lg ${
      activeSection === 'analytics' 
        ? 'bg-blue-100 text-blue-800' 
        : 'hover:bg-gray-100'
    }`}
  >
    <BarChart2 className="mr-3" size={20} />
    Reports & Analytics
  </button>
</li>
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {renderContent()}
      </div>
    </div>
  );
};

export default ReceptionDashboard;