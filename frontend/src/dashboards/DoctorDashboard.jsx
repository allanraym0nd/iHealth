import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Users, 
  Calendar, 
  FileText, 
  Pill,
  TestTube,
  MessageSquare 
} from 'lucide-react';
import doctorService from '../api/doctorService';
import PatientManagement from './sections/PatientManagement'; // Correct import path
import AppointmentScheduling from './sections/AppointmentScheduling';
import MedicalRecords from './sections/MedicalRecords';
import Communication from './sections/Communication';
import Prescriptions from './sections/Prescriptions';
import LabOrders from './sections/LabOrders';

const DoctorDashboard = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userName, setUserName] = useState('');
  const [dashboardData, setDashboardData] = useState({
    patients: [],
    appointments: [],
    schedule: null
  });

  useEffect(() => {
    // Get username from localStorage
    const storedName = localStorage.getItem('userName');
    if (storedName) {
      setUserName(storedName);
    }
    
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        const patientsResponse = await doctorService.getPatients();
        const appointmentsResponse = await doctorService.getAppointments();
        const scheduleResponse = await doctorService.getSchedule();

        setDashboardData({
          patients: patientsResponse.data || [],
          appointments: appointmentsResponse.data || [],
          schedule: scheduleResponse.data || null
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Sidebar items configuration
  const sidebarItems = [
    {
      section: 'dashboard',
      icon: Activity,
      label: 'Overview'
    },
    {
      section: 'patients',
      icon: Users,
      label: 'Patients'
    },
    {
      section: 'appointments',
      icon: Calendar,
      label: 'Appointments'
    },
    {
      section: 'records',    // Add this new item
      icon: FileText,
      label: 'Medical Records'
    },
    {
      section: 'prescriptions',  
      icon: Pill,  
      label: 'Prescriptions'
    },
    {
      section: 'lab-orders',
      icon: TestTube,
      label: 'Lab Orders'
    },
    {
      section: 'communication',
      icon: MessageSquare,
      label: 'Communication'
    }
    
  ];

  // Render dashboard content based on active section
  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return renderDashboardContent();
      case 'patients':
        return <PatientManagement />;
      case 'appointments':
        return <AppointmentScheduling />;
      case 'records':           // Make sure this case matches your navigation
        return <MedicalRecords />;
      case 'prescriptions':  // Add this case
        return <Prescriptions />;
      case 'lab-orders':  // Add this case
        return <LabOrders />;
      case 'communication':
        return <Communication />;
      default:
        return renderDashboardContent();
    }
  };
  
  // Dashboard overview content
  const renderDashboardContent = () => {
    if (loading) return <div className="p-4">Loading...</div>;
    if (error) return <div className="p-4 text-red-500">{error}</div>;

    return (
      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">Total Patients</h3>
            <p className="text-3xl font-bold text-gray-800">
              {dashboardData.patients.length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">Today's Appointments</h3>
            <p className="text-3xl font-bold text-gray-800">
              {dashboardData.appointments.filter(apt => 
                new Date(apt.date).toDateString() === new Date().toDateString()
              ).length}
            </p>
          </div>
        </div>

        {/* Recent Appointments */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold text-gray-800">Recent Appointments</h2>
          </div>
          <div className="p-4">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="pb-3">Patient</th>
                  <th className="pb-3">Time</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.appointments.slice(0, 5).map((appointment) => (
                  <tr key={appointment._id} className="border-b">
                    <td className="py-3">{appointment.patientName || 'N/A'}</td>
                    <td>{new Date(appointment.date).toLocaleTimeString()}</td>
                    <td>
                      <span className={`px-2 py-1 text-sm rounded-full ${
                        appointment.status === 'completed' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {appointment.status || 'Scheduled'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white h-full shadow-lg">
        <div className="p-4 border-b">
          <h2 className="text-2xl font-bold text-gray-800">
            {userName ? `${userName}'s Portal` : "Doctor's Portal"}
          </h2>
          <p className="text-sm text-gray-500">Welcome back</p>
        </div>
        
        <nav className="p-4">
          <ul className="space-y-2">
            {sidebarItems.map((item) => (
              <li key={item.section}>
                <button 
                  onClick={() => setActiveSection(item.section)}
                  className={`flex items-center w-full p-2 rounded-lg ${
                    activeSection === item.section 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                >
                  <item.icon className="mr-3" size={20} />
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
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

export default DoctorDashboard;