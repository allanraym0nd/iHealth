import React, { useState, useEffect } from 'react';
import { Calendar, Download, FileText, Filter, Printer, RefreshCw } from 'lucide-react';
import pharmacyService from '../../api/pharmacyService';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const PharmacyReports = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportType, setReportType] = useState('prescriptions');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Last 30 days
    endDate: new Date().toISOString().split('T')[0] // Today
  });
  const [filters, setFilters] = useState({
    status: 'all',
    medication: '',
    doctor: ''
  });
  const [reportData, setReportData] = useState({
    prescriptions: [],
    inventory: [],
    refillRequests: []
  });
  const [isGenerating, setIsGenerating] = useState(false);

  // Generate the appropriate report when the user clicks the Generate button
  const generateReport = async () => {
    setIsGenerating(true);
    setLoading(true);
    setError(null);
    
    try {
      switch (reportType) {
        case 'prescriptions':
          await generatePrescriptionsReport();
          break;
        case 'inventory':
          await generateInventoryReport();
          break;
        case 'refillRequests':
          await generateRefillRequestsReport();
          break;
        case 'dispensing':
          await generateDispensingReport();
          break;
        default:
          break;
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error generating report:', error);
      setError('Failed to generate report');
      setLoading(false);
    }
  };

  // Fetch and process prescription data
  const generatePrescriptionsReport = async () => {
    try {
      // Get prescriptions with status parameter to fetch all statuses
      const response = await pharmacyService.getPrescriptions('all');
      let prescriptions = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.data || []);
      
      // Filter by date range
      prescriptions = prescriptions.filter(prescription => {
        const prescriptionDate = new Date(prescription.date);
        const startDate = new Date(dateRange.startDate);
        const endDate = new Date(dateRange.endDate);
        endDate.setHours(23, 59, 59, 999); // Set to end of day
        
        return prescriptionDate >= startDate && prescriptionDate <= endDate;
      });
      
      // Filter by status if specified
      if (filters.status !== 'all') {
        prescriptions = prescriptions.filter(prescription => 
          prescription.status === filters.status
        );
      }
      
      // Filter by medication if specified
      if (filters.medication) {
        prescriptions = prescriptions.filter(prescription => 
          prescription.medications.some(med => 
            med.name.toLowerCase().includes(filters.medication.toLowerCase())
          )
        );
      }
      
      // Filter by doctor if specified
      if (filters.doctor) {
        prescriptions = prescriptions.filter(prescription => 
          prescription.doctor?.name?.toLowerCase().includes(filters.doctor.toLowerCase())
        );
      }
      
      setReportData(prev => ({ ...prev, prescriptions }));
    } catch (error) {
      console.error('Error generating prescriptions report:', error);
      throw error;
    }
  };

  // Fetch and process inventory data
  const generateInventoryReport = async () => {
    try {
      const response = await pharmacyService.getInventory();
      let inventory = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.data || []);
      
      // Filter by medication name if specified
      if (filters.medication) {
        inventory = inventory.filter(item => 
          item.medication.toLowerCase().includes(filters.medication.toLowerCase())
        );
      }
      
      setReportData(prev => ({ ...prev, inventory }));
    } catch (error) {
      console.error('Error generating inventory report:', error);
      throw error;
    }
  };

  // Fetch and process refill request data
  const generateRefillRequestsReport = async () => {
    try {
      const response = await pharmacyService.getRefillRequests();
      let refillRequests = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.data || []);
      
      // Filter by date range
      refillRequests = refillRequests.filter(request => {
        const requestDate = new Date(request.requestDate);
        const startDate = new Date(dateRange.startDate);
        const endDate = new Date(dateRange.endDate);
        endDate.setHours(23, 59, 59, 999); // Set to end of day
        
        return requestDate >= startDate && requestDate <= endDate;
      });
      
      // Filter by status if specified
      if (filters.status !== 'all') {
        refillRequests = refillRequests.filter(request => 
          request.status === filters.status
        );
      }
      
      setReportData(prev => ({ ...prev, refillRequests }));
    } catch (error) {
      console.error('Error generating refill requests report:', error);
      throw error;
    }
  };

  // Generate dispensing report (completed prescriptions)
  const generateDispensingReport = async () => {
    try {
      // Get all prescriptions
      const response = await pharmacyService.getPrescriptions('completed');
      let dispensedPrescriptions = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.data || []);
      
      // Only include completed prescriptions
      dispensedPrescriptions = dispensedPrescriptions.filter(prescription => 
        prescription.status === 'completed'
      );
      
      // Filter by date range
      dispensedPrescriptions = dispensedPrescriptions.filter(prescription => {
        const prescriptionDate = new Date(prescription.updatedAt || prescription.date);
        const startDate = new Date(dateRange.startDate);
        const endDate = new Date(dateRange.endDate);
        endDate.setHours(23, 59, 59, 999); // Set to end of day
        
        return prescriptionDate >= startDate && prescriptionDate <= endDate;
      });
      
      // Store in reportData
      setReportData(prev => ({ 
        ...prev, 
        dispensedPrescriptions 
      }));
    } catch (error) {
      console.error('Error generating dispensing report:', error);
      throw error;
    }
  };

  // Download the report as PDF
  const downloadReport = () => {
    const doc = new jsPDF();
    
    // Add title
    const title = `${getReportTypeName()} Report`;
    doc.setFontSize(18);
    doc.text(title, 105, 15, null, null, 'center');
    
    // Add date range
    doc.setFontSize(12);
    doc.text(`Period: ${formatDate(dateRange.startDate)} to ${formatDate(dateRange.endDate)}`, 105, 25, null, null, 'center');
    
    // Add generation date
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, 30, null, null, 'center');
    
    // Add appropriate content based on report type
    switch (reportType) {
      case 'prescriptions':
        addPrescriptionsToPDF(doc);
        break;
      case 'inventory':
        addInventoryToPDF(doc);
        break;
      case 'refillRequests':
        addRefillRequestsToPDF(doc);
        break;
      case 'dispensing':
        addDispensingToPDF(doc);
        break;
      default:
        break;
    }
    
    // Save the PDF
    doc.save(`pharmacy-${reportType}-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Add prescriptions report to PDF
  const addPrescriptionsToPDF = (doc) => {
    // Report summary
    doc.setFontSize(14);
    doc.text('Prescription Summary', 14, 40);
    
    // Calculate statistics
    const totalPrescriptions = reportData.prescriptions.length;
    const activePrescriptions = reportData.prescriptions.filter(p => p.status === 'active').length;
    const completedPrescriptions = reportData.prescriptions.filter(p => p.status === 'completed').length;
    
    doc.setFontSize(11);
    doc.text(`Total Prescriptions: ${totalPrescriptions}`, 14, 50);
    doc.text(`Active Prescriptions: ${activePrescriptions}`, 14, 57);
    doc.text(`Completed Prescriptions: ${completedPrescriptions}`, 14, 64);
    
    // Create prescription table
    doc.autoTable({
      startY: 75,
      head: [['Patient', 'Doctor', 'Medication', 'Date', 'Status']],
      body: reportData.prescriptions.map(prescription => [
        prescription.patient?.name || 'Unknown',
        prescription.doctor?.name || 'Unknown',
        prescription.medications?.map(med => `${med.name} ${med.dosage}`).join(', ') || 'N/A',
        new Date(prescription.date).toLocaleDateString(),
        prescription.status.charAt(0).toUpperCase() + prescription.status.slice(1)
      ]),
      theme: 'grid',
      headStyles: { fillColor: [0, 123, 255] },
      styles: { overflow: 'linebreak' },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 35 },
        2: { cellWidth: 45 },
        3: { cellWidth: 30 },
        4: { cellWidth: 25 }
      }
    });
    
    // Add a note at the bottom
    const finalY = doc.previousAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.text('This report shows all prescriptions within the selected date range.', 14, finalY);
  };

  // Add inventory report to PDF
  const addInventoryToPDF = (doc) => {
    // Report summary
    doc.setFontSize(14);
    doc.text('Inventory Summary', 14, 40);
    
    // Calculate statistics
    const totalItems = reportData.inventory.length;
    const lowStockItems = reportData.inventory.filter(item => 
      item.quantity <= item.reorderLevel
    ).length;
    
    doc.setFontSize(11);
    doc.text(`Total Inventory Items: ${totalItems}`, 14, 50);
    doc.text(`Low Stock Items: ${lowStockItems}`, 14, 57);
    
    // Create inventory table
    doc.autoTable({
      startY: 65,
      head: [['Medication', 'Quantity', 'Reorder Level', 'Expiry Date', 'Status']],
      body: reportData.inventory.map(item => {
        let status = 'In Stock';
        if (item.quantity <= 0) status = 'Out of Stock';
        else if (item.quantity <= item.reorderLevel) status = 'Low Stock';
        
        return [
          item.medication,
          item.quantity.toString(),
          item.reorderLevel.toString(),
          item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A',
          status
        ];
      }),
      theme: 'grid',
      headStyles: { fillColor: [0, 123, 255] }
    });
    
    // Add a note at the bottom
    const finalY = doc.previousAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.text('This report shows the current inventory status.', 14, finalY);
  };

  // Add refill requests report to PDF
  const addRefillRequestsToPDF = (doc) => {
    // Report summary
    doc.setFontSize(14);
    doc.text('Refill Requests Summary', 14, 40);
    
    // Calculate statistics
    const totalRequests = reportData.refillRequests.length;
    const pendingRequests = reportData.refillRequests.filter(r => r.status === 'Pending').length;
    const approvedRequests = reportData.refillRequests.filter(r => r.status === 'Approved').length;
    const rejectedRequests = reportData.refillRequests.filter(r => r.status === 'Rejected').length;
    
    doc.setFontSize(11);
    doc.text(`Total Refill Requests: ${totalRequests}`, 14, 50);
    doc.text(`Pending Requests: ${pendingRequests}`, 14, 57);
    doc.text(`Approved Requests: ${approvedRequests}`, 14, 64);
    doc.text(`Rejected Requests: ${rejectedRequests}`, 14, 71);
    
    // Helper function to get patient name from refill request
    const getPatientName = (request) => {
      if (request.patient) {
        if (typeof request.patient === 'object' && request.patient.name) {
          return request.patient.name;
        }
        if (typeof request.patient === 'string') {
          return 'Patient #' + request.patient.substring(0, 6);
        }
      }
      
      if (request.prescription && request.prescription.patient) {
        if (typeof request.prescription.patient === 'object' && request.prescription.patient.name) {
          return request.prescription.patient.name;
        }
      }
      
      return 'Unknown Patient';
    };
    
    // Create refill requests table
    doc.autoTable({
      startY: 80,
      head: [['Patient', 'Medication', 'Request Date', 'Status', 'Notes']],
      body: reportData.refillRequests.map(request => [
        getPatientName(request),
        request.prescription?.medications?.[0]?.name || 'N/A',
        new Date(request.requestDate).toLocaleDateString(),
        request.status,
        request.notes || ''
      ]),
      theme: 'grid',
      headStyles: { fillColor: [0, 123, 255] },
      styles: { overflow: 'linebreak' },
      columnStyles: {
        4: { cellWidth: 'auto' }
      }
    });
    
    // Add a note at the bottom
    const finalY = doc.previousAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.text('This report shows all refill requests within the selected date range.', 14, finalY);
  };

  // Add dispensing report to PDF
  const addDispensingToPDF = (doc) => {
    // Report summary
    doc.setFontSize(14);
    doc.text('Medication Dispensing Summary', 14, 40);
    
    const dispensedPrescriptions = reportData.dispensedPrescriptions || [];
    
    // Calculate statistics
    const totalDispensed = dispensedPrescriptions.length;
    
    // Count unique patients
    const uniquePatients = new Set(
      dispensedPrescriptions.map(p => 
        p.patient?._id || p.patient
      )
    ).size;
    
    // Count total medications dispensed
    let totalMedications = 0;
    dispensedPrescriptions.forEach(p => {
      totalMedications += p.medications?.length || 0;
    });
    
    doc.setFontSize(11);
    doc.text(`Total Prescriptions Dispensed: ${totalDispensed}`, 14, 50);
    doc.text(`Unique Patients Served: ${uniquePatients}`, 14, 57);
    doc.text(`Total Medications Dispensed: ${totalMedications}`, 14, 64);
    
    // Create dispensed medications table
    doc.autoTable({
      startY: 75,
      head: [['Patient', 'Medication', 'Dosage', 'Dispensed Date']],
      body: dispensedPrescriptions.flatMap(prescription => 
        prescription.medications.map(med => [
          prescription.patient?.name || 'Unknown',
          med.name,
          `${med.dosage} ${med.frequency}${med.duration ? ` for ${med.duration}` : ''}`,
          new Date(prescription.updatedAt || prescription.date).toLocaleDateString()
        ])
      ),
      theme: 'grid',
      headStyles: { fillColor: [0, 123, 255] },
      styles: { overflow: 'linebreak' }
    });
    
    // Add a note at the bottom
    const finalY = doc.previousAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.text('This report shows all medications dispensed within the selected date range.', 14, finalY);
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Get user-friendly report type name
  const getReportTypeName = () => {
    switch (reportType) {
      case 'prescriptions': return 'Prescription';
      case 'inventory': return 'Inventory';
      case 'refillRequests': return 'Refill Request';
      case 'dispensing': return 'Medication Dispensing';
      default: return '';
    }
  };

  // Get appropriate filter options based on report type
  const getFilterOptions = () => {
    switch (reportType) {
      case 'prescriptions':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Medication</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Filter by medication..."
                value={filters.medication}
                onChange={(e) => setFilters({ ...filters, medication: e.target.value })}
              />
            </div>
          </>
        );
      
      case 'inventory':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Medication</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Filter by medication..."
              value={filters.medication}
              onChange={(e) => setFilters({ ...filters, medication: e.target.value })}
            />
          </div>
        );
      
      case 'refillRequests':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="all">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        );
      
      case 'dispensing':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Medication</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Filter by medication..."
              value={filters.medication}
              onChange={(e) => setFilters({ ...filters, medication: e.target.value })}
            />
          </div>
        );
      
      default:
        return null;
    }
  };

  // Render report preview
  const renderReportPreview = () => {
    if (loading) {
      return <div className="text-center py-8">Loading report data...</div>;
    }
    
    if (error) {
      return <div className="text-center py-8 text-red-500">{error}</div>;
    }
    
    if (!isGenerating) {
      return (
        <div className="text-center py-8 text-gray-500">
          <FileText size={48} className="mx-auto mb-4 text-gray-400" />
          <p>Configure your report parameters and click "Generate Report" to preview</p>
        </div>
      );
    }
    
    switch (reportType) {
      case 'prescriptions':
        return renderPrescriptionsPreview();
      case 'inventory':
        return renderInventoryPreview();
      case 'refillRequests':
        return renderRefillRequestsPreview();
      case 'dispensing':
        return renderDispensingPreview();
      default:
        return <div className="text-center py-8 text-gray-500">Select a report type</div>;
    }
  };

  // Render prescriptions report preview
  const renderPrescriptionsPreview = () => {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Prescription Report</h2>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Prescriptions:</span>
                <span className="font-bold">{reportData.prescriptions.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Active Prescriptions:</span>
                <span className="font-bold">
                  {reportData.prescriptions.filter(p => p.status === 'active').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Completed Prescriptions:</span>
                <span className="font-bold">
                  {reportData.prescriptions.filter(p => p.status === 'completed').length}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Prescriptions Table */}
        <h3 className="text-lg font-semibold mt-6 mb-3">Prescription Details</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border-b text-left">Patient</th>
                <th className="py-2 px-4 border-b text-left">Doctor</th>
                <th className="py-2 px-4 border-b text-left">Medication</th>
                <th className="py-2 px-4 border-b text-left">Date</th>
                <th className="py-2 px-4 border-b text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {reportData.prescriptions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-4 text-center text-gray-500">No prescriptions found for the selected filters</td>
                </tr>
              ) : (
                reportData.prescriptions.map((prescription, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b">{prescription.patient?.name || 'Unknown'}</td>
                    <td className="py-2 px-4 border-b">{prescription.doctor?.name || 'Unknown'}</td>
                    <td className="py-2 px-4 border-b">
                      {prescription.medications?.map(med => 
                        `${med.name} ${med.dosage}`
                      ).join(', ') || 'N/A'}
                    </td>
                    <td className="py-2 px-4 border-b">{new Date(prescription.date).toLocaleDateString()}</td>
                    <td className="py-2 px-4 border-b">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        prescription.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : prescription.status === 'active'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {prescription.status.charAt(0).toUpperCase() + prescription.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Render inventory report preview
  const renderInventoryPreview = () => {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Inventory Report</h2>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Inventory Items:</span>
                <span className="font-bold">{reportData.inventory.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Low Stock Items:</span>
                <span className="font-bold">
                  {reportData.inventory.filter(item => item.quantity <= item.reorderLevel).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Out of Stock Items:</span>
                <span className="font-bold">
                  {reportData.inventory.filter(item => item.quantity <= 0).length}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Inventory Table */}
        <h3 className="text-lg font-semibold mt-6 mb-3">Inventory Details</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border-b text-left">Medication</th>
                <th className="py-2 px-4 border-b text-right">Quantity</th>
                <th className="py-2 px-4 border-b text-right">Reorder Level</th>
                <th className="py-2 px-4 border-b text-left">Expiry Date</th>
                <th className="py-2 px-4 border-b text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {reportData.inventory.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-4 text-center text-gray-500">No inventory items found for the selected filters</td>
                </tr>
              ) : (
                reportData.inventory.map((item, index) => {
                  let status = 'In Stock';
                  if (item.quantity <= 0) status = 'Out of Stock';
                  else if (item.quantity <= item.reorderLevel) status = 'Low Stock';
                  
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="py-2 px-4 border-b">{item.medication}</td>
                      <td className={`py-2 px-4 border-b text-right ${
                        item.quantity <= item.reorderLevel 
                          ? 'text-red-600 font-bold' 
                          : ''
                      }`}>
                        {item.quantity}
                      </td>
                      <td className="py-2 px-4 border-b text-right">{item.reorderLevel}</td>
                      <td className="py-2 px-4 border-b">
                        {item.expiryDate
                          ? new Date(item.expiryDate).toLocaleDateString()
                          : 'N/A'
                        }
                      </td>
                      <td className="py-2 px-4 border-b">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          status === 'In Stock'
                            ? 'bg-green-100 text-green-800'
                            : status === 'Low Stock'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Render refill requests report preview
  const renderRefillRequestsPreview = () => {
    // Helper function to get patient name
    const getPatientName = (request) => {
      if (request.patient) {
        if (typeof request.patient === 'object' && request.patient.name) {
          return request.patient.name;
        }
        if (typeof request.patient === 'string') {
          return 'Patient #' + request.patient.substring(0, 6);
        }
      }
      
      if (request.prescription && request.prescription.patient) {
        if (typeof request.prescription.patient === 'object' && request.prescription.patient.name) {
          return request.prescription.patient.name;
        }
      }
      
      return 'Unknown Patient';
    };
    
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Refill Requests Report</h2>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Refill Requests:</span>
                <span className="font-bold">{reportData.refillRequests.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Pending Requests:</span>
                <span className="font-bold">
                  {reportData.refillRequests.filter(r => r.status === 'Pending').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Approved Requests:</span>
                <span className="font-bold">
                  {reportData.refillRequests.filter(r => r.status === 'Approved').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Rejected Requests:</span>
                <span className="font-bold">
                  {reportData.refillRequests.filter(r => r.status === 'Rejected').length}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Refill Requests Table */}
        <h3 className="text-lg font-semibold mt-6 mb-3">Refill Request Details</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border-b text-left">Patient</th>
                <th className="py-2 px-4 border-b text-left">Medication</th>
                <th className="py-2 px-4 border-b text-left">Request Date</th>
                <th className="py-2 px-4 border-b text-left">Status</th>
                <th className="py-2 px-4 border-b text-left">Notes</th>
              </tr>
            </thead>
            <tbody>
              {reportData.refillRequests.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-4 text-center text-gray-500">No refill requests found for the selected filters</td>
                </tr>
              ) : (
                reportData.refillRequests.map((request, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b">{getPatientName(request)}</td>
                    <td className="py-2 px-4 border-b">
                      {request.prescription?.medications?.[0]?.name || 'N/A'}
                    </td>
                    <td className="py-2 px-4 border-b">
                      {new Date(request.requestDate).toLocaleDateString()}
                    </td>
                    <td className="py-2 px-4 border-b">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        request.status === 'Approved' 
                          ? 'bg-green-100 text-green-800'
                          : request.status === 'Pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="py-2 px-4 border-b">{request.notes || 'N/A'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  // Render dispensing report preview
  const renderDispensingPreview = () => {
    const dispensedPrescriptions = reportData.dispensedPrescriptions || [];
    
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Medication Dispensing Report</h2>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Prescriptions Dispensed:</span>
                <span className="font-bold">{dispensedPrescriptions.length}</span>
              </div>
              
              {/* Count unique patients */}
              <div className="flex justify-between">
                <span>Unique Patients Served:</span>
                <span className="font-bold">
                  {new Set(
                    dispensedPrescriptions.map(p => 
                      p.patient?._id || p.patient
                    )
                  ).size}
                </span>
              </div>
              
              {/* Count total medications dispensed */}
              <div className="flex justify-between">
                <span>Total Medications Dispensed:</span>
                <span className="font-bold">
                  {dispensedPrescriptions.reduce((total, p) => 
                    total + (p.medications?.length || 0), 0
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Medications Table */}
        <h3 className="text-lg font-semibold mt-6 mb-3">Dispensed Medications</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border-b text-left">Patient</th>
                <th className="py-2 px-4 border-b text-left">Medication</th>
                <th className="py-2 px-4 border-b text-left">Dosage</th>
                <th className="py-2 px-4 border-b text-left">Dispensed Date</th>
              </tr>
            </thead>
            <tbody>
              {dispensedPrescriptions.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-4 text-center text-gray-500">No dispensed medications found for the selected date range</td>
                </tr>
              ) : (
                dispensedPrescriptions.flatMap((prescription, idx) => 
                  prescription.medications.map((med, medIdx) => (
                    <tr key={`${idx}-${medIdx}`} className="hover:bg-gray-50">
                      <td className="py-2 px-4 border-b">{prescription.patient?.name || 'Unknown'}</td>
                      <td className="py-2 px-4 border-b">{med.name}</td>
                      <td className="py-2 px-4 border-b">
                        {`${med.dosage} ${med.frequency}${med.duration ? ` for ${med.duration}` : ''}`}
                      </td>
                      <td className="py-2 px-4 border-b">
                        {new Date(prescription.updatedAt || prescription.date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Pharmacy Reports</h2>
      </div>

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Report Configuration</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Report Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={reportType}
                onChange={(e) => {
                  setReportType(e.target.value);
                  setIsGenerating(false);
                }}
              >
                <option value="prescriptions">Prescriptions</option>
                <option value="inventory">Inventory</option>
                <option value="refillRequests">Refill Requests</option>
                <option value="dispensing">Medication Dispensing</option>
              </select>
            </div>
            
            {/* Date Range Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              />
            </div>
            
            {/* Generate Report Button */}
            <div className="flex items-end">
              <button
                onClick={generateReport}
                disabled={loading}
                className={`w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center ${
                  loading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText size={16} className="mr-2" />
                    Generate Report
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* Additional Filters Section */}
          <div>
            <div className="flex items-center mb-2">
              <Filter size={16} className="mr-1 text-gray-500" />
              <h4 className="text-sm font-medium text-gray-700">Additional Filters</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getFilterOptions()}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">Report Preview</h3>
          
          {/* Download & Print Buttons */}
          {isGenerating && (
            <div className="flex space-x-2">
              <button
                onClick={downloadReport}
                className="px-3 py-1 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center"
              >
                <Download size={16} className="mr-1" />
                Download PDF
              </button>
              <button
                onClick={() => window.print()}
                className="px-3 py-1 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center"
              >
                <Printer size={16} className="mr-1" />
                Print
              </button>
            </div>
          )}
        </div>
        
        <div className="p-4 bg-gray-50 min-h-[400px]" id="report-content">
          {renderReportPreview()}
        </div>
      </div>
    </div>
  );
};

export default PharmacyReports;