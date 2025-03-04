import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Calendar, 
  FileText, 
  MessageSquare, 
  CreditCard 
} from 'lucide-react';
import patientService from '../api/patientService';
import PatientAppointments from './sections/PatientAppointments';
import PatientMedicalRecords from './sections/PatientMedicalRecords';
import PatientPrescriptions from './sections/PatientPrescriptions';
import PatientBilling from './sections/PatientBilling';

const PatientDashboard = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    appointments: [],
    prescriptions: [],
    bills: []
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const appointmentsResponse = await patientService.getAppointments();
        
        console.log('Dashboard Appointments Response:', appointmentsResponse);
        
        const prescriptionsResponse = await patientService.getPrescriptions();
        const billsResponse = await patientService.getBills();
  
        setDashboardData({
          appointments: appointmentsResponse.data || [],
          prescriptions: prescriptionsResponse.data || [],
          bills: billsResponse.data || []
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
      section: 'appointments',
      icon: Calendar,
      label: 'Appointments'
    },
    {
      section: 'records',
      icon: FileText,
      label: 'Medical Records'
    },
    {
      section: 'prescriptions',
      icon: MessageSquare,
      label: 'Prescriptions'
    },
    {
      section: 'billing',
      icon: CreditCard,
      label: 'Billing'
    }
  ];

  const renderDashboardContent = () => {
    if (loading) return <div className="p-4">Loading...</div>;
    if (error) return <div className="p-4 text-red-500">{error}</div>;
  
    console.log('Full Dashboard Data:', dashboardData);
  
    const upcomingAppointments = dashboardData.appointments.filter(apt => {
      // Convert to date objects
      const appointmentDate = new Date(apt.date);
      const today = new Date();
      
      // Normalize both dates to compare just the date part (not time)
      const appointmentDateStr = appointmentDate.toISOString().split('T')[0];
      const todayStr = today.toISOString().split('T')[0];
      
      // Check if appointment is today or in the future
      const isUpcoming = appointmentDateStr >= todayStr;
      
      // Check if status is valid for upcoming
      const hasValidStatus = ['scheduled', 'confirmed', 'waiting'].includes(apt.status.toLowerCase())
      
      console.log('Appointment filtering:', {
        id: apt._id,
        date: apt.date,
        appointmentDate: appointmentDateStr,
        today: todayStr,
        status: apt.status,
        isUpcoming,
        hasValidStatus,
        willInclude: isUpcoming && hasValidStatus
      });
    
      return isUpcoming && hasValidStatus;
    });
  
    console.log('Filtered Upcoming Appointments:', upcomingAppointments);
  
    return (
      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">Upcoming Appointments</h3>
            <p className="text-3xl font-bold text-gray-800">
              {upcomingAppointments.length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">Active Prescriptions</h3>
            <p className="text-3xl font-bold text-gray-800">
              {dashboardData.prescriptions.filter(pres => pres.status === 'active').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">Pending Bills</h3>
            <p className="text-3xl font-bold text-gray-800">
              {dashboardData.bills.filter(bill => bill.status === 'pending').length}
            </p>
          </div>
        </div>

        {/* Recent Appointments */}
        <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">Upcoming Appointments</h2>
        </div>
        <div className="p-4">
          {upcomingAppointments.length === 0 ? (
            <p className="text-gray-500 text-center">No upcoming appointments</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="pb-3">Doctor</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Time</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {upcomingAppointments
                  .slice(0, 5)
                  .map((appointment) => (
                    <tr key={appointment._id} className="border-b">
                      <td className="py-3">{appointment.doctor?.name || 'N/A'}</td>
                      <td>{new Date(appointment.date).toLocaleDateString()}</td>
                      <td>{appointment.time}</td>
                      <td>{appointment.type}</td>
                      <td>{appointment.status}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return renderDashboardContent();
      case 'appointments':
        return <PatientAppointments />;
      case 'records':
        return <PatientMedicalRecords />;
      case 'prescriptions':
        return <PatientPrescriptions />;
      case 'billing':
        return <PatientBilling />;
      default:
        return renderDashboardContent();
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white h-full shadow-lg">
        <div className="p-4 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Patient Portal</h2>
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

export default PatientDashboard;