import React, { useState } from 'react';
import { Download, Calendar, Filter } from 'lucide-react';
import billingService from '../api/billingService';

const ReportGenerator = () => {
  const [reportType, setReportType] = useState('financialSummary');
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [exportFormat, setExportFormat] = useState('pdf');
  const [filters, setFilters] = useState({
    paymentStatus: {
      paid: true,
      pending: true,
      overdue: true
    },
    paymentMethods: {
      cash: true,
      creditCard: true,
      mpesa: true,
      insurance: true,
      bankTransfer: true
    }
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const handleFilterChange = (category, key, value) => {
    setFilters(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const generateReport = async () => {
    try {
      setIsGenerating(true);
      
      // For downloadable formats, open in new window
      if (exportFormat === 'pdf' || exportFormat === 'csv' || exportFormat === 'excel') {
        const queryParams = new URLSearchParams({
          reportType,
          startDate,
          endDate,
          format: exportFormat,
          filters: JSON.stringify(filters)
        }).toString();
        
        window.open(`http://localhost:5000/api/billing/reports/generate?${queryParams}`, '_blank');
      } else {
        // For JSON format, handle in-app (though we don't currently use this)
        const response = await billingService.generateReport({
          reportType,
          startDate,
          endDate,
          format: exportFormat,
          filters
        });
        console.log('Report generated:', response);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      // You could add toast notifications here for errors
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Generate Printable Reports</h3>
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className="text-blue-500 flex items-center text-sm"
        >
          <Filter size={16} className="mr-1" />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Report Type Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Report Type
          </label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="w-full p-2 border rounded-md"
          >
            <option value="financialSummary">Financial Summary</option>
            <option value="invoiceDetails">Invoice Details</option>
            <option value="paymentAnalysis">Payment Analysis</option>
            <option value="insuranceClaims">Insurance Claims</option>
          </select>
        </div>
        
        {/* Date Range Selectors */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full p-2 border rounded-md"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full p-2 border rounded-md"
          />
        </div>
        
        {/* Export Format Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Export Format
          </label>
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value)}
            className="w-full p-2 border rounded-md"
          >
            <option value="pdf">PDF</option>

          </select>
        </div>
      </div>
      
      {/* Filters Section */}
      {showFilters && (
        <div className="p-4 bg-gray-50 rounded-md mb-4">
          <h4 className="font-medium mb-2">Additional Filters</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Payment Status Filters */}
            <div>
              <h5 className="font-medium text-sm mb-2">Payment Status</h5>
              <div className="space-y-2">
                {Object.entries(filters.paymentStatus).map(([key, value]) => (
                  <label key={key} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => handleFilterChange('paymentStatus', key, e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm capitalize">{key}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Payment Methods Filters */}
            <div>
              <h5 className="font-medium text-sm mb-2">Payment Methods</h5>
              <div className="space-y-2">
                {Object.entries(filters.paymentMethods).map(([key, value]) => (
                  <label key={key} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => handleFilterChange('paymentMethods', key, e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm capitalize">
                      {key === 'mpesa' ? 'M-Pesa' : 
                       key === 'creditCard' ? 'Credit Card' : 
                       key === 'bankTransfer' ? 'Bank Transfer' : 
                       key}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Generate Button */}
      <div className="flex justify-end">
        <button
          onClick={generateReport}
          disabled={isGenerating}
          className={`px-4 py-2 rounded-lg bg-blue-500 text-white flex items-center ${
            isGenerating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'
          }`}
        >
          <Download size={16} className="mr-2" />
          {isGenerating ? 'Generating...' : 'Generate Report'}
        </button>
      </div>
    </div>
  );
};

export default ReportGenerator;