// ReceptionDashboard.jsx
import React, { useState, useEffect } from 'react';
import { User, Calendar, BarChart2, Settings, LogOut } from 'lucide-react';
import ReceptionRegistration from './sections/ReceptionRegistration';
import doctorService from '../api/doctorService';

const ReceptionDashboard = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState({
    appointments: [],
    waitingPatients: [],
    newRegistrations: 0,
    availableDoctors: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
 
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Use your existing services
        const appointmentsRes = await doctorService.getAppointments();
        
        // Calculate metrics based on real data
        const today = new Date().toISOString().split('T')[0];
        const todaysAppointments = appointmentsRes.data.filter(app => 
          new Date(app.date).toISOString().split('T')[0] === today
        );
        
        const waitingPatients = todaysAppointments.filter(app => 
          app.status === 'Waiting'
        );
        
        setDashboardData({
          appointments: todaysAppointments || [],
          waitingPatients: waitingPatients || [],
          newRegistrations: 0, // You might need to add this API
          availableDoctors: 0 // You might need to add this API
        });
        
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

  const renderDashboardContent = () => {
    if (loading) return <div className="p-6">Loading dashboard data...</div>;
    if (error) return <div className="p-6 text-red-500">{error}</div>;

    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Reception Dashboard</h2>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center mb-4">
              <Calendar className="text-blue-500 mr-2" size={24} />
              <h3 className="text-lg font-medium">Today's Appointments</h3>
            </div>
            <p className="text-3xl font-bold">{dashboardData.appointments.length}</p>
            <p className="text-sm text-gray-500">
              {dashboardData.appointments.filter(a => a.status === 'Completed').length} completed
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center mb-4">
              <User className="text-green-500 mr-2" size={24} />
              <h3 className="text-lg font-medium">Waiting Patients</h3>
            </div>
            <p className="text-3xl font-bold">{dashboardData.waitingPatients.length}</p>
            <p className="text-sm text-gray-500">Currently in queue</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center mb-4">
              <User className="text-purple-500 mr-2" size={24} />
              <h3 className="text-lg font-medium">New Registrations</h3>
            </div>
            <p className="text-3xl font-bold">{dashboardData.newRegistrations}</p>
            <p className="text-sm text-gray-500">Today</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center mb-4">
              <BarChart2 className="text-yellow-500 mr-2" size={24} />
              <h3 className="text-lg font-medium">Available Doctors</h3>
            </div>
            <p className="text-3xl font-bold">{dashboardData.availableDoctors}</p>
            <p className="text-sm text-gray-500">Currently available</p>
          </div>
        </div>

        {/* Today's Appointments */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 border-b">
            <h3 className="text-lg font-medium">Today's Appointments</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dashboardData.appointments.length > 0 ? (
                  dashboardData.appointments.map((appointment) => (
                    <tr key={appointment._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{appointment.time}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {appointment.patient?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {appointment.doctor?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{appointment.type}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          appointment.status === 'Completed' 
                            ? 'bg-green-100 text-green-800' 
                            : appointment.status === 'In Progress'
                            ? 'bg-blue-100 text-blue-800'
                            : appointment.status === 'Waiting'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {appointment.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                      No appointments scheduled for today
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Waiting Patients */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h3 className="text-lg font-medium">Waiting Patients</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Appointment Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dashboardData.waitingPatients.length > 0 ? (
                  dashboardData.waitingPatients.map((patient) => (
                    <tr key={patient._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {patient.patient?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {patient.doctor?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{patient.time}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button className="text-blue-600 hover:text-blue-900">Check In</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                      No patients waiting
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
                Check-in/Check-out
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveSection('settings')}
                className={`flex items-center w-full p-3 rounded-lg ${
                  activeSection === 'settings' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'hover:bg-gray-100'
                }`}
              >
                <Settings className="mr-3" size={20} />
                Settings
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