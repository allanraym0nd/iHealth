import React, { useState, useEffect } from 'react';
import { DollarSign, FileText, CreditCard, BarChart2, LogOut } from 'lucide-react';
import billingService from '../api/billingService';
import BillingInvoices from './sections/BillingInvoices';
import BillingPayments from './sections/BillingPayments';
import BillingReports from './sections/BillingReports';
import InsuranceClaims from './sections/InsuranceClaims';
import ExpenseTracking from './sections/ExpenseTracking';

const BillingDashboard = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    invoices: [],
    payments: [],
    financialData: {}
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const invoicesResponse = await billingService.getInvoices();
        const paymentsResponse = await billingService.getPayments();
        const financialData = await billingService.getFinancialReports();

        setDashboardData({
          invoices: invoicesResponse || [],
          payments: paymentsResponse || [],
          financialData: financialData?.data || {}
        });
      } catch (error) {
        console.error('Error fetching billing data:', error);
        setError('Failed to load billing dashboard data');
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
      icon: DollarSign,
      label: 'Overview'
    },
    {
      section: 'invoices',
      icon: FileText,
      label: 'Invoices'
    },
    {
      section: 'payments',
      icon: CreditCard,
      label: 'Payments'
    },
    {
      section: 'reports',
      icon: BarChart2,
      label: 'Reports'
    },
    {
      section: 'insurance-claims',
      icon: FileText,
      label: 'Insurance Claims'
    },
    {
      section: 'expenses',
      icon: DollarSign,
      label: 'Expenses'
    }
  ];

  const renderDashboardContent = () => {
    if (loading) return <div className="p-4">Loading...</div>;
    if (error) return <div className="p-4 text-red-500">{error}</div>;

    // Get financial data
    const { totalIncome = 0, totalExpenses = 0, pendingPayments = 0 } = dashboardData.financialData;
    
    // Calculate metrics
    const pendingInvoices = dashboardData.invoices.filter(inv => inv.status === 'Pending');
    const pendingCount = pendingInvoices.length;
    const pendingAmount = pendingInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    
    // Recent month payments
    const currentDate = new Date();
    const paymentsThisMonth = dashboardData.payments
      .filter(payment => {
        const paymentDate = new Date(payment.date);
        return paymentDate.getMonth() === currentDate.getMonth() && 
               paymentDate.getFullYear() === currentDate.getFullYear();
      })
      .reduce((sum, payment) => sum + payment.amount, 0);

    return (
      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">Outstanding Invoices</h3>
            <p className="text-3xl font-bold text-gray-800">{pendingCount}</p>
            <p className="text-sm text-gray-600">${pendingAmount.toFixed(2)} total</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">Payments This Month</h3>
            <p className="text-3xl font-bold text-gray-800">${paymentsThisMonth.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">Total Income</h3>
            <p className="text-3xl font-bold text-gray-800">${totalIncome.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">Total Expenses</h3>
            <p className="text-3xl font-bold text-gray-800">${totalExpenses.toFixed(2)}</p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold text-gray-800">Recent Activity</h2>
          </div>
          <div className="p-4">
            <div className="space-y-4">
              {/* Combine recent invoices and payments, sort by date */}
              {[
                ...dashboardData.invoices.map(inv => ({
                  type: 'invoice',
                  date: new Date(inv.date),
                  data: inv
                })),
                ...dashboardData.payments.map(payment => ({
                  type: 'payment',
                  date: new Date(payment.date),
                  data: payment
                }))
              ]
                .sort((a, b) => b.date - a.date)
                .slice(0, 5)
                .map((activity, index) => (
                  <div className="flex items-center" key={index}>
                    {activity.type === 'invoice' ? (
                      <>
                        <FileText className="text-blue-500 mr-3" size={20} />
                        <div>
                          <p className="font-medium">New invoice created</p>
                          <p className="text-sm text-gray-500">
                            Patient: {activity.data.patientName} - ${activity.data.totalAmount.toFixed(2)}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <CreditCard className="text-green-500 mr-3" size={20} />
                        <div>
                          <p className="font-medium">Payment received</p>
                          <p className="text-sm text-gray-500">
                            Patient: {activity.data.patientName} - ${activity.data.amount.toFixed(2)}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                ))}

              {/* Show message if no activity */}
              {dashboardData.invoices.length === 0 && dashboardData.payments.length === 0 && (
                <div className="text-gray-500 text-center py-4">No recent activity</div>
              )}
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
      case 'invoices':
        return <BillingInvoices />;
      case 'payments':
        return <BillingPayments />;
      case 'reports':
       return <BillingReports />;
       case 'insurance-claims':
      return <InsuranceClaims />;
      case 'expenses':
      return <ExpenseTracking />;
      default:
        return renderDashboardContent();
    }
  };

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

        <div className="absolute bottom-0 w-full p-4 border-t">
          <button onClick={() => window.location.href = '/login'} className="flex items-center w-full p-2 text-red-600 hover:bg-red-50 rounded-lg">
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

export default BillingDashboard;