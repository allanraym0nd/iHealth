import React, { useState } from 'react';
import { CreditCard, FileText, BarChart2, DollarSign, LogOut } from 'lucide-react';
import BillingInvoices from './sections/BillingInvoices';

const BillingDashboard = () => {
  const [activeSection, setActiveSection] = useState('dashboard');

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white h-full shadow-lg">
        <div className="p-4 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Billing Portal</h2>
          <p className="text-sm text-gray-500">Finance Department</p>
        </div>
        
        <nav className="p-4">
          <ul className="space-y-2">
            <li>
              <button 
                onClick={() => setActiveSection('dashboard')}
                className={`flex items-center w-full p-2 rounded-lg ${
                  activeSection === 'dashboard' 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                }`}
              >
                <DollarSign className="mr-3" size={20} />
                <span>Overview</span>
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveSection('invoices')}
                className={`flex items-center w-full p-2 rounded-lg ${
                  activeSection === 'invoices' 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                }`}
              >
                <FileText className="mr-3" size={20} />
                <span>Invoices</span>
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveSection('payments')}
                className={`flex items-center w-full p-2 rounded-lg ${
                  activeSection === 'payments' 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                }`}
              >
                <CreditCard className="mr-3" size={20} />
                <span>Payments</span>
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveSection('reports')}
                className={`flex items-center w-full p-2 rounded-lg ${
                  activeSection === 'reports' 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                }`}
              >
                <BarChart2 className="mr-3" size={20} />
                <span>Reports</span>
              </button>
            </li>
          </ul>
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t">
          <button className="flex items-center w-full p-2 text-red-600 hover:bg-red-50 rounded-lg">
            <LogOut className="mr-3" size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {activeSection === 'dashboard' && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {/* Stats Cards */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-gray-500 text-sm font-medium">Outstanding Invoices</h3>
                <p className="text-3xl font-bold text-gray-800">42</p>
                <p className="text-sm text-gray-600">$12,500 total</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-gray-500 text-sm font-medium">Payments This Month</h3>
                <p className="text-3xl font-bold text-gray-800">$8,750</p>
                <p className="text-sm text-gray-600">+15% from last month</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-gray-500 text-sm font-medium">Overdue Payments</h3>
                <p className="text-3xl font-bold text-gray-800">12</p>
                <p className="text-sm text-gray-600">$3,200 total</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-gray-500 text-sm font-medium">Insurance Claims</h3>
                <p className="text-3xl font-bold text-gray-800">18</p>
                <p className="text-sm text-gray-600">8 pending</p>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="p-4 border-b">
                <h2 className="text-xl font-bold text-gray-800">Recent Activity</h2>
              </div>
              <div className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <FileText className="text-blue-500 mr-3" size={20} />
                    <div>
                      <p className="font-medium">New invoice created</p>
                      <p className="text-sm text-gray-500">Patient: John Doe - $250</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <CreditCard className="text-green-500 mr-3" size={20} />
                    <div>
                      <p className="font-medium">Payment received</p>
                      <p className="text-sm text-gray-500">Patient: Jane Smith - $135</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <BarChart2 className="text-red-500 mr-3" size={20} />
                    <div>
                      <p className="font-medium">Monthly report generated</p>
                      <p className="text-sm text-gray-500">January 2024</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeSection === 'invoices' && <BillingInvoices />}
        {activeSection === 'payments' && <div>Payments Section</div>}
        {activeSection === 'reports' && <div>Reports Section</div>}
      </div>
    </div>
  );
};

export default BillingDashboard;