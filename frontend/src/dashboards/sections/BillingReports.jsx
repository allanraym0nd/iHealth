import React, { useState, useEffect } from 'react';
import { BarChart2, FileText, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import billingService from '../../api/billingService';

const BillingReports = () => {
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeReport, setActiveReport] = useState('monthly');

  // Fetch financial reports
  useEffect(() => {
    const fetchFinancialReports = async () => {
      try {
        setIsLoading(true);
        const response = await billingService.getFinancialReports();
        setReportData(response);
      } catch (err) {
        console.error('Error fetching financial reports:', err);
        setError('Failed to load financial reports');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFinancialReports();
  }, []);

  if (isLoading) return <div className="p-4">Loading financial reports...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Financial Reports</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveReport('monthly')}
            className={`px-4 py-2 rounded-lg ${
              activeReport === 'monthly' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setActiveReport('quarterly')}
            className={`px-4 py-2 rounded-lg ${
              activeReport === 'quarterly' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            Quarterly
          </button>
          <button
            onClick={() => setActiveReport('annual')}
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

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <BarChart2 className="text-blue-500" size={32} />
            <h3 className="text-sm font-medium text-gray-500">Total Income</h3>
          </div>
          <p className="text-3xl font-bold text-gray-800">
            ${reportData.totalIncome?.toLocaleString() || '0'}
          </p>
          <p className="text-sm text-green-600 flex items-center">
            <TrendingUp size={16} className="mr-1" />
            {reportData.incomeTrend || '0'}% from last period
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <DollarSign className="text-red-500" size={32} />
            <h3 className="text-sm font-medium text-gray-500">Total Expenses</h3>
          </div>
          <p className="text-3xl font-bold text-gray-800">
            ${reportData.totalExpenses?.toLocaleString() || '0'}
          </p>
          <p className="text-sm text-red-600 flex items-center">
            <TrendingDown size={16} className="mr-1" />
            {reportData.expensesTrend || '0'}% from last period
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <FileText className="text-green-500" size={32} />
            <h3 className="text-sm font-medium text-gray-500">Total Invoices</h3>
          </div>
          <p className="text-3xl font-bold text-gray-800">
            {reportData.totalInvoices || 0}
          </p>
          <p className="text-sm text-gray-600">
            {reportData.paidInvoices || 0} paid
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <BarChart2 className="text-purple-500" size={32} />
            <h3 className="text-sm font-medium text-gray-500">Net Profit</h3>
          </div>
          <p className="text-3xl font-bold text-gray-800">
            ${reportData.netProfit?.toLocaleString() || '0'}
          </p>
          <p className="text-sm text-green-600 flex items-center">
            <TrendingUp size={16} className="mr-1" />
            {reportData.profitMargin || '0'}% margin
          </p>
        </div>
      </div>

      {/* Detailed Reports Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Invoice Status Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Invoice Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Pending Invoices</span>
              <span className="font-medium">
                {reportData.pendingInvoices || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Paid Invoices</span>
              <span className="font-medium text-green-600">
                {reportData.paidInvoices || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Overdue Invoices</span>
              <span className="font-medium text-red-600">
                {reportData.overdueInvoices || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Method Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Payment Methods</h3>
          <div className="space-y-3">
            {reportData.paymentMethods?.map((method, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{method.name}</span>
                <div>
                  <span className="font-medium mr-2">
                    ${method.total.toLocaleString()}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({method.percentage}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingReports;