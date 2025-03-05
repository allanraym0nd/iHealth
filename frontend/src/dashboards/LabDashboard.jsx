import React, { useState, useEffect } from 'react';
import { Activity, TestTube, Flask as FlaskIcon, Archive, MessageSquare, Database } from 'lucide-react';
import labService from '../api/labService';
import TestOrders from './sections/TestOrders';
import SampleManagement from './sections/SampleManagement';
import ResultsManagement from './sections/ResultsManagement';
import InventoryManagement from './sections/InventoryManagement';
import Communication from './sections/Communication';

const LabDashboard = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [dashboardData, setDashboardData] = useState({
    pendingTests: [],
    completedTests: [],
    inventory: []
  });

  useEffect(() => {
    if (activeSection === 'dashboard') {
      fetchDashboardData();
    }
  }, [activeSection, refreshTrigger]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const pendingResponse = await labService.getPendingTests();
      const completedResponse = await labService.getCompletedTests();
      const inventoryResponse = await labService.getInventory();

      setDashboardData({
        pendingTests: pendingResponse.data || [],
        completedTests: completedResponse.data || [],
        inventory: inventoryResponse.data || []
      });
      setError(null);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Function to trigger dashboard refresh from child components
  const refreshDashboard = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const sidebarItems = [
    {
      section: 'dashboard',
      icon: Activity,
      label: 'Overview'
    },
    {
      section: 'test-orders',
      icon: TestTube,
      label: 'Test Orders'
    },
    {
      section: 'samples',
      icon: Archive,
      label: 'Sample Management'
    },
    {
      section: 'results',
      icon: Database,
      label: 'Results'
    },
    {
      section: 'inventory',
      icon: Archive,
      label: 'Inventory'
    },
    {
      section: 'communication',
      icon: MessageSquare,
      label: 'Communication'
    }
  ];

  const renderDashboardContent = () => {
    if (loading) return <div className="p-4">Loading dashboard data...</div>;
    if (error) return <div className="p-4 text-red-500">{error}</div>;

    const todayTests = dashboardData.completedTests.filter(test => 
      new Date(test.scheduledDate).toDateString() === new Date().toDateString()
    );

    const lowStockItems = dashboardData.inventory.filter(item => 
      item.quantity <= item.reorderLevel
    );

    return (
      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">Pending Tests</h3>
            <p className="text-3xl font-bold text-gray-800">
              {dashboardData.pendingTests.length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">Completed Today</h3>
            <p className="text-3xl font-bold text-gray-800">
              {todayTests.length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">Low Stock Items</h3>
            <p className="text-3xl font-bold text-gray-800">
              {lowStockItems.length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">Success Rate</h3>
            <p className="text-3xl font-bold text-gray-800">
              {dashboardData.completedTests.length > 0 
                ? Math.round((dashboardData.completedTests.length / 
                   (dashboardData.completedTests.length + dashboardData.pendingTests.length)) * 100)
                : 0}%
            </p>
          </div>
        </div>

        {/* Recent Test Orders */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold text-gray-800">Recent Test Orders</h2>
          </div>
          <div className="p-4">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="pb-3">Patient</th>
                  <th className="pb-3">Test Type</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Scheduled Date</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.pendingTests.slice(0, 5).map((test) => (
                  <tr key={test._id} className="border-b">
                    <td className="py-3">{test.patient?.name}</td>
                    <td>{test.testType}</td>
                    <td>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        test.status === 'Pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : test.status === 'In Progress'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {test.status}
                      </span>
                    </td>
                    <td>{new Date(test.scheduledDate).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alert */}
        {lowStockItems.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-red-800 font-medium mb-2">Low Stock Alert</h3>
            <div className="space-y-2">
              {lowStockItems.map((item) => (
                <div key={item._id} className="flex justify-between items-center">
                  <span className="text-red-600">{item.item}</span>
                  <span className="text-red-600">
                    Quantity: {item.quantity} (Min: {item.reorderLevel})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return renderDashboardContent();
      case 'test-orders':
        return <TestOrders onTestStatusChange={refreshDashboard} />;
      case 'samples':
        return <SampleManagement onSampleUpdate={refreshDashboard} />;
      case 'results':
        return <ResultsManagement onResultAdded={refreshDashboard} />;
      case 'inventory':
        return <InventoryManagement />;
      case 'communication':
        return <Communication />;
      default:
        return renderDashboardContent();
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white h-full shadow-lg">
        <div className="p-4 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Lab Portal</h2>
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

export default LabDashboard;