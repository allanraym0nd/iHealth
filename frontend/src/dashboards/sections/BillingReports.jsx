import React, { useState, useEffect } from 'react';
import { BarChart2, FileText, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import billingService from '../../api/billingService';
import ReportGenerator from '../../components/ReportGenerator'; 

const BillingReports = () => {
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeReport, setActiveReport] = useState('monthly');
  
  // Store all report data by period
  const [reportsByPeriod, setReportsByPeriod] = useState({
    monthly: null,
    quarterly: null,
    annual: null
  });

  // Fetch financial reports for all periods
  useEffect(() => {
    const fetchFinancialReports = async () => {
      try {
        setIsLoading(true);
        
        // Fetch reports for all periods
        const [monthlyResponse, quarterlyResponse, annualResponse] = await Promise.all([
          billingService.getFinancialReports({ period: 'monthly' }),
          billingService.getFinancialReports({ period: 'quarterly' }),
          billingService.getFinancialReports({ period: 'annual' })
        ]);
        
        // Store all reports by period
        const allReports = {
          monthly: monthlyResponse,
          quarterly: quarterlyResponse,
          annual: annualResponse
        };
        
        setReportsByPeriod(allReports);
        setReportData(allReports[activeReport]); // Set current period data
        
      } catch (err) {
        console.error('Error fetching financial reports:', err);
        setError('Failed to load financial reports');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFinancialReports();
  }, []);
  
  // Update report data when period changes
  useEffect(() => {
    if (reportsByPeriod[activeReport]) {
      setReportData(reportsByPeriod[activeReport]);
    }
  }, [activeReport, reportsByPeriod]);

  const handlePeriodChange = (period) => {
    setActiveReport(period);
  };

  if (isLoading) return <div className="p-4">Loading financial reports...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  // Prepare data for charts
  const invoiceStatusData = [
    { name: 'Pending', value: reportData.pendingInvoices || 0, color: '#F59E0B' },
    { name: 'Paid', value: reportData.paidInvoices || 0, color: '#10B981' },
    { name: 'Overdue', value: reportData.overdueInvoices || 0, color: '#EF4444' }
  ];

  const paymentMethodsData = reportData.paymentMethods?.map(method => ({
    name: method.name,
    value: method.total,
    percentage: method.percentage,
    color: method.name === 'Cash' ? '#10B981' : 
           method.name === 'Credit Card' ? '#3B82F6' : 
           method.name === 'Bank Transfer' ? '#8B5CF6' : 
           method.name === 'Insurance' ? '#EC4899' : '#6B7280'
  })) || [];

  const revenueExpenseData = [
    { name: 'Income', value: reportData.totalIncome || 0, color: '#3B82F6' },
    { name: 'Expenses', value: reportData.totalExpenses || 0, color: '#EF4444' },
    { name: 'Profit', value: reportData.netProfit || 0, color: '#10B981' }
  ];

  // Get period label for display
  const getPeriodLabel = () => {
    switch (activeReport) {
      case 'monthly':
        return 'This Month';
      case 'quarterly':
        return 'This Quarter';
      case 'annual':
        return 'This Year';
      default:
        return 'Current Period';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Financial Reports</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => handlePeriodChange('monthly')}
            className={`px-4 py-2 rounded-lg ${
              activeReport === 'monthly' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => handlePeriodChange('quarterly')}
            className={`px-4 py-2 rounded-lg ${
              activeReport === 'quarterly' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            Quarterly
          </button>
          <button
            onClick={() => handlePeriodChange('annual')}
            className={`px-4 py-2 rounded-lg ${
              activeReport === 'annual' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            Annual
          </button>
        </div>
      </div>

      {/* Period indicator */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-600">{getPeriodLabel()} Overview</h3>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-2">
            <BarChart2 className="text-blue-500" size={24} />
            <h3 className="text-sm font-medium text-gray-500">Total Income</h3>
          </div>
          <p className="text-3xl font-bold text-gray-800">
            Ksh {reportData.totalIncome?.toLocaleString() || '0'}
          </p>
          <p className="text-sm text-green-600 flex items-center mt-1">
            <TrendingUp size={16} className="mr-1" />
            {reportData.incomeTrend || '0'}% from previous {activeReport === 'monthly' ? 'month' : activeReport === 'quarterly' ? 'quarter' : 'year'}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-2">
            <DollarSign className="text-red-500" size={24} />
            <h3 className="text-sm font-medium text-gray-500">Total Expenses</h3>
          </div>
          <p className="text-3xl font-bold text-gray-800">
            Ksh {reportData.totalExpenses?.toLocaleString() || '0'}
          </p>
          <p className="text-sm text-red-600 flex items-center mt-1">
            <TrendingUp size={16} className="mr-1" />
            {reportData.expensesTrend || '0'}% from previous {activeReport === 'monthly' ? 'month' : activeReport === 'quarterly' ? 'quarter' : 'year'}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-2">
            <FileText className="text-green-500" size={24} />
            <h3 className="text-sm font-medium text-gray-500">Total Invoices</h3>
          </div>
          <p className="text-3xl font-bold text-gray-800">
            {reportData.totalInvoices || 0}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {reportData.paidInvoices || 0} paid
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-2">
            <BarChart2 className="text-purple-500" size={24} />
            <h3 className="text-sm font-medium text-gray-500">Net Profit</h3>
          </div>
          <p className="text-3xl font-bold text-gray-800">
            Ksh {reportData.netProfit?.toLocaleString() || '0'}
          </p>
          <p className="text-sm text-green-600 flex items-center mt-1">
            <TrendingUp size={16} className="mr-1" />
            {reportData.profitMargin || '0'}% margin
          </p>
        </div>
      </div>

      {/* Financial Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Revenue vs Expenses</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueExpenseData}>
                <Tooltip
                  formatter={(value) => [`Ksh ${value.toLocaleString()}`, '']}
                  labelFormatter={() => ''}
                />
                <Bar dataKey="value" fill="#3B82F6">
                  {revenueExpenseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Invoice Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={invoiceStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {invoiceStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, 'Count']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Reports Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Invoice Status Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Invoice Status</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Pending Invoices</span>
              <span className="font-medium text-yellow-600">
                {reportData.pendingInvoices || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Paid Invoices</span>
              <span className="font-medium text-green-600">
                {reportData.paidInvoices || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Overdue Invoices</span>
              <span className="font-medium text-red-600">
                {reportData.overdueInvoices || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Method Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Payment Methods</h3>
          <div className="space-y-4">
            {paymentMethodsData.length > 0 ? (
              <>
                {paymentMethodsData.map((method, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-gray-600">{method.name}</span>
                    <div>
                      <span className="font-medium mr-2">
                        Ksh {method.value.toLocaleString()}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({method.percentage}%)
                      </span>
                    </div>
                  </div>
                ))}
                
                {/* Pie chart for payment methods */}
                <div className="h-48 mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentMethodsData}
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                      >
                        {paymentMethodsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`Ksh ${value.toLocaleString()}`, '']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : (
              <p className="text-gray-500 text-center py-4">No payment method data available</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Report Generator Section */}
      <ReportGenerator />
    </div>
  );
};

export default BillingReports;