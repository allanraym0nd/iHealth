import React, { useState, useEffect } from 'react';
import { 
  Package, 
  ClipboardList, 
  Pill, 
  Repeat, 
  AlertCircle, 
  LogOut, 
  Activity,
  FileText 
} from 'lucide-react';
import pharmacyService from '../api/pharmacyService';
import PharmacyPrescriptions from './sections/PharmacyPrescriptions';
import PharmacyInventory from './sections/PharmacyInventory';
import PharmacyRefills from './sections/PharmacyRefills';
import PharmacyReports from './sections/PharmacyReports';

const PharmacyDashboard = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState({
    pendingPrescriptions: [],
    urgentPrescriptions: [],
    refillRequests: [],
    lowStockItems: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (activeSection === 'dashboard') {
      fetchDashboardData();
    }
  }, [activeSection]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [
        prescriptionsResponse,
        refillsResponse,
        inventoryResponse
      ] = await Promise.all([
        pharmacyService.getPrescriptions(),
        pharmacyService.getRefillRequests(),
        pharmacyService.getInventory()
      ]);

      setDashboardData({
        pendingPrescriptions: prescriptionsResponse.data.filter(p => p.status === 'pending'),
        urgentPrescriptions: prescriptionsResponse.data.filter(p => p.priority === 'urgent'),
        refillRequests: refillsResponse.data,
        lowStockItems: inventoryResponse.data.filter(item => item.quantity <= item.reorderLevel)
      });
      setError(null);
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const sidebarItems = [
    {
      section: 'dashboard',
      icon: Activity,
      label: 'Overview'
    },
    {
      section: 'prescriptions',
      icon: ClipboardList,
      label: 'Prescriptions'
    },
    {
      section: 'inventory',
      icon: Pill,
      label: 'Inventory'
    },
    {
      section: 'refills',
      icon: Repeat,
      label: 'Refill Requests'
    },
    {
      section: 'reports',  // Add the new reports section
      icon: FileText,
      label: 'Reports'
    }
  ];

  const renderDashboardContent = () => {
    if (loading) return <div className="p-4">Loading pharmacy dashboard...</div>;
    if (error) return <div className="p-4 text-red-500">{error}</div>;

    return (
      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">Pending Prescriptions</h3>
            <p className="text-3xl font-bold text-gray-800">
              {dashboardData.pendingPrescriptions.length}
            </p>
            <p className="text-sm text-gray-600">
              {dashboardData.urgentPrescriptions.length} urgent
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">Refill Requests</h3>
            <p className="text-3xl font-bold text-gray-800">
              {dashboardData.refillRequests.length}
            </p>
            <p className="text-sm text-gray-600">Today</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">Low Stock Items</h3>
            <p className="text-3xl font-bold text-gray-800">
              {dashboardData.lowStockItems.length}
            </p>
            <p className="text-sm text-gray-600">Need reorder</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">Processing Time</h3>
            <p className="text-3xl font-bold text-gray-800">18m</p>
            <p className="text-sm text-gray-600">Average</p>
          </div>
        </div>

        {/* Low Stock Alert */}
        {dashboardData.lowStockItems.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <AlertCircle className="text-red-600 mr-2" />
              <h3 className="text-red-800 font-medium">Low Stock Alert</h3>
            </div>
            <div className="space-y-2">
              {dashboardData.lowStockItems.map((item, index) => (
                <div 
                  key={index} 
                  className="flex justify-between items-center bg-red-100 p-2 rounded"
                >
                  <span className="text-red-800">{item.medication}</span>
                  <span className="text-red-600">
                    Quantity: {item.quantity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow mt-6">
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold text-gray-800">Recent Activity</h2>
          </div>
          <div className="p-4">
            <div className="space-y-4">
              {dashboardData.pendingPrescriptions.slice(0, 3).map((prescription, index) => (
                <div key={index} className="flex items-center">
                  <ClipboardList className="text-blue-500 mr-3" size={20} />
                  <div>
                    <p className="font-medium">New Prescription</p>
                    <p className="text-sm text-gray-500">
                      For {prescription.patientName} - {prescription.medications?.[0]?.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return renderDashboardContent();
      case 'prescriptions':
        return <PharmacyPrescriptions />;
      case 'inventory':
        return <PharmacyInventory />;
      case 'refills':
        return <PharmacyRefills />;
        case 'reports':  // Add case for reports section
      return <PharmacyReports />;
      default:
        return renderDashboardContent();
    }
  };

  const handleLogout = () => {
    // Implement logout logic
    console.log('Logging out');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white h-full shadow-lg flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Pharmacy Portal</h2>
          <p className="text-sm text-gray-500">Central Pharmacy</p>
        </div>
        
        <nav className="p-4 flex-grow">
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

        <div className="p-4 border-t">
          <button 
            onClick={handleLogout}
            className="flex items-center w-full p-2 text-red-600 hover:bg-red-50 rounded-lg"
          >
            <LogOut className="mr-3" size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {renderContent()}
      </div>
    </div>
  );
};

export default PharmacyDashboard;