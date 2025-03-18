import React, { useState, useEffect } from 'react';
import { CalendarRange, Download, FileText, Filter, Printer, RefreshCw } from 'lucide-react';
import labService from '../../api/labService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


// Report Generation Component
const LabReports = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportType, setReportType] = useState('testOrders');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default to last 30 days
    endDate: new Date().toISOString().split('T')[0]
  });
  const [filters, setFilters] = useState({
    status: 'all',
    testType: 'all',
    category: 'all'
  });
  const [reportData, setReportData] = useState({
    testOrders: [],
    samples: [],
    results: [],
    inventory: []
  });
  const [stats, setStats] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);

  // Filter data by date range
  const filterByDate = (item) => {
    const itemDate = new Date(item.scheduledDate || item.collectionDate || item.results?.date || item.lastRestocked);
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    endDate.setHours(23, 59, 59, 999); // Set to end of day
    
    return itemDate >= startDate && itemDate <= endDate;
  };

  // Generate report
  const generateReport = async () => {
    setIsGenerating(true);
    setLoading(true);
    setError(null);
    
    try {
      switch (reportType) {
        case 'testOrders':
          await generateTestOrdersReport();
          break;
          
        case 'samples':
          await generateSamplesReport();
          break;
          
        case 'results':
          await generateResultsReport();
          break;
          
        case 'inventory':
          await generateInventoryReport();
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

  // Generate test orders report
  const generateTestOrdersReport = async () => {
    try {
      const pendingResponse = await labService.getPendingTests();
      const completedResponse = await labService.getCompletedTests();
      
      // Get all test orders
      const allTestOrders = await labService.getTestOrders();
      
      // Combine all test data
      let testOrders = [
        ...(pendingResponse.data || []), 
        ...(completedResponse.data || [])
      ];
      
      // Remove duplicates (if any)
      const testOrderMap = new Map();
      testOrders.forEach(order => {
        testOrderMap.set(order._id, order);
      });
      testOrders = Array.from(testOrderMap.values());
      
      // Apply date filter
      testOrders = testOrders.filter(filterByDate);
      
      // Apply additional filters
      if (filters.status !== 'all') {
        testOrders = testOrders.filter(order => order.status === filters.status);
      }
      
      if (filters.testType !== 'all') {
        testOrders = testOrders.filter(order => order.testType === filters.testType);
      }
      
      setReportData(prev => ({ ...prev, testOrders }));
      calculateTestStats(testOrders);
    } catch (error) {
      console.error('Error generating test orders report:', error);
      throw error;
    }
  };

  // Generate samples report
  const generateSamplesReport = async () => {
    try {
      const response = await labService.getSamples();
      let samples = response.data || [];
      
      // Apply date filter
      samples = samples.filter(filterByDate);
      
      // Apply additional filters
      if (filters.status !== 'all') {
        samples = samples.filter(sample => sample.status === filters.status);
      }
      
      if (filters.testType !== 'all') {
        samples = samples.filter(sample => sample.testType === filters.testType);
      }
      
      setReportData(prev => ({ ...prev, samples }));
      calculateSampleStats(samples);
    } catch (error) {
      console.error('Error generating samples report:', error);
      throw error;
    }
  };

  // Generate results report
  // Generate results report
const generateResultsReport = async () => {
  try {
    const response = await labService.getTestResults();
    let results = response.data || [];
    
    console.log("Test results before filtering:", results);
    
    // Skip date filtering for test results as they may not have the expected date fields
    // results = results.filter(filterByDate);
    
    // Apply additional filters
    if (filters.interpretation !== 'all' && filters.interpretation) {
      results = results.filter(result => result.interpretation === filters.interpretation);
    }
    
    if (filters.isCritical === 'true') {
      results = results.filter(result => result.isCritical === true);
    } else if (filters.isCritical === 'false') {
      results = results.filter(result => result.isCritical === false);
    }
    
    console.log("Filtered results:", results);
    
    setReportData(prev => ({ ...prev, results }));
    calculateResultStats(results);
  } catch (error) {
    console.error('Error generating results report:', error);
    throw error;
  }
};

  // Generate inventory report
  const generateInventoryReport = async () => {
    try {
      const response = await labService.getInventory();
      let inventory = response.data || [];
      
      // Apply filters
      if (filters.category !== 'all') {
        inventory = inventory.filter(item => item.category === filters.category);
      }
      
      if (filters.stockLevel === 'low') {
        inventory = inventory.filter(item => item.quantity <= item.reorderLevel && item.quantity > 0);
      } else if (filters.stockLevel === 'out') {
        inventory = inventory.filter(item => item.quantity <= 0);
      } else if (filters.stockLevel === 'healthy') {
        inventory = inventory.filter(item => item.quantity > item.reorderLevel);
      }
      
      setReportData(prev => ({ ...prev, inventory }));
      calculateInventoryStats(inventory);
    } catch (error) {
      console.error('Error generating inventory report:', error);
      throw error;
    }
  };

  // Calculate statistics based on test orders data
  const calculateTestStats = (data) => {
    const totalTests = data.length;
    const completeTests = data.filter(test => test.status === 'Completed').length;
    const pendingTests = data.filter(test => test.status === 'Pending').length;
    const inProgressTests = data.filter(test => test.status === 'In Progress').length;
    const sampleCollectedTests = data.filter(test => test.status === 'sample_collected').length;
    
    // Group by test type
    const testTypeGroups = data.reduce((acc, test) => {
      acc[test.testType] = (acc[test.testType] || 0) + 1;
      return acc;
    }, {});
    
    // Group by doctor
    const doctorGroups = data.reduce((acc, test) => {
      const doctorName = test.doctor?.name || 'Unknown';
      acc[doctorName] = (acc[doctorName] || 0) + 1;
      return acc;
    }, {});
    
    setStats({
      totalTests,
      completeTests,
      pendingTests,
      inProgressTests,
      sampleCollectedTests,
      completionRate: totalTests ? (completeTests / totalTests * 100).toFixed(2) : 0,
      testTypeGroups,
      doctorGroups
    });
  };

  // Calculate statistics based on samples data
  const calculateSampleStats = (data) => {
    const totalSamples = data.length;
    const collectedSamples = data.filter(sample => sample.status === 'collected').length;
    const processingSamples = data.filter(sample => sample.status === 'processing').length;
    const storedSamples = data.filter(sample => sample.status === 'stored').length;
    const disposedSamples = data.filter(sample => sample.status === 'disposed').length;
    
    // Group by test type
    const testTypeGroups = data.reduce((acc, sample) => {
      acc[sample.testType] = (acc[sample.testType] || 0) + 1;
      return acc;
    }, {});
    
    // Group by storage location
    const locationGroups = data.reduce((acc, sample) => {
      const location = sample.storageLocation || 'Unknown';
      acc[location] = (acc[location] || 0) + 1;
      return acc;
    }, {});
    
    setStats({
      totalSamples,
      collectedSamples,
      processingSamples,
      storedSamples,
      disposedSamples,
      testTypeGroups,
      locationGroups
    });
  };

  // Calculate statistics based on results data
  const calculateResultStats = (data) => {
    const totalResults = data.length;
    const normalResults = data.filter(result => result.interpretation === 'Normal').length;
    const highResults = data.filter(result => result.interpretation === 'High').length;
    const lowResults = data.filter(result => result.interpretation === 'Low').length;
    const inconclusiveResults = data.filter(result => result.interpretation === 'Inconclusive').length;
    const criticalResults = data.filter(result => result.isCritical).length;
    
    // Group by test type
    const testTypeGroups = data.reduce((acc, result) => {
      acc[result.testType] = (acc[result.testType] || 0) + 1;
      return acc;
    }, {});
    
    setStats({
      totalResults,
      normalResults,
      highResults,
      lowResults,
      inconclusiveResults,
      criticalResults,
      normalRate: totalResults ? (normalResults / totalResults * 100).toFixed(2) : 0,
      criticalRate: totalResults ? (criticalResults / totalResults * 100).toFixed(2) : 0,
      testTypeGroups
    });
  };

  // Calculate statistics based on inventory data
  const calculateInventoryStats = (data) => {
    const totalItems = data.length;
    const lowStockItems = data.filter(item => item.quantity <= item.reorderLevel && item.quantity > 0).length;
    const outOfStockItems = data.filter(item => item.quantity <= 0).length;
    const healthyStockItems = data.filter(item => item.quantity > item.reorderLevel).length;
    
    // Group by category
    const categoryGroups = data.reduce((acc, item) => {
      const category = item.category || 'Uncategorized';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});
    
    setStats({
      totalItems,
      lowStockItems,
      outOfStockItems,
      healthyStockItems,
      lowStockRate: totalItems ? (lowStockItems / totalItems * 100).toFixed(2) : 0,
      categoryGroups
    });
  };

  // Download the report as PDF
  const downloadReport = () => {
    const doc = new jsPDF();
    
    // Add title
    const title = `${getReportTypeName()} Report`;
    doc.setFontSize(20);
    doc.text(title, 105, 15, null, null, 'center');
    
    // Add date range
    doc.setFontSize(12);
    doc.text(`Period: ${formatDate(dateRange.startDate)} to ${formatDate(dateRange.endDate)}`, 105, 25, null, null, 'center');
    
    // Add stats summary
    doc.setFontSize(14);
    doc.text('Summary Statistics', 20, 35);
    
    let yPos = 45;
    doc.setFontSize(10);
    
    // Add specific stats based on report type
    switch (reportType) {
      case 'testOrders':
        addTestOrderStats(doc, yPos);
        yPos += 60;
        addTestOrderTable(doc, yPos);
        break;
        
      case 'samples':
        addSampleStats(doc, yPos);
        yPos += 60;
        addSampleTable(doc, yPos);
        break;
        
      case 'results':
        addResultStats(doc, yPos);
        yPos += 60;
        addResultTable(doc, yPos);
        break;
        
      case 'inventory':
        addInventoryStats(doc, yPos);
        yPos += 60;
        addInventoryTable(doc, yPos);
        break;
        
      default:
        break;
    }
    
    // Add footer with date generated
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Generated on ${new Date().toLocaleString()} - Page ${i} of ${pageCount}`, 105, 290, null, null, 'center');
    }
    
    // Save the PDF
    doc.save(`${reportType}-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Add test order statistics to PDF
  const addTestOrderStats = (doc, yPos) => {
    doc.text(`Total Tests: ${stats.totalTests}`, 20, yPos);
    doc.text(`Completed: ${stats.completeTests} (${stats.completionRate}%)`, 20, yPos + 8);
    doc.text(`Pending: ${stats.pendingTests}`, 20, yPos + 16);
    doc.text(`In Progress: ${stats.inProgressTests}`, 20, yPos + 24);
    doc.text(`Sample Collected: ${stats.sampleCollectedTests}`, 20, yPos + 32);
    
    // Add test type distribution
    doc.text('Test Type Distribution:', 120, yPos);
    let typeYPos = yPos + 8;
    Object.entries(stats.testTypeGroups || {}).forEach(([type, count], index) => {
      if (index < 5) { // Limit to top 5 for space
        doc.text(`${type}: ${count}`, 120, typeYPos);
        typeYPos += 8;
      }
    });
  };

  // Add test order table to PDF
  const addTestOrderTable = (doc, yPos) => {
    // Define tableColumn and tableRows within this function
    const tableColumn = ["Patient", "Test Type", "Doctor", "Scheduled Date", "Status"];
    const tableRows = reportData.testOrders.map(order => [
      order.patient?.name || 'N/A',
      order.testType || 'N/A',
      order.doctor?.name || 'N/A',
      new Date(order.scheduledDate).toLocaleDateString(),
      order.status
    ]);
    
    autoTable(doc, {
      startY: yPos,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [66, 139, 202] }
    });
  };

  // Add sample statistics to PDF
  const addSampleStats = (doc, yPos) => {
    doc.text(`Total Samples: ${stats.totalSamples}`, 20, yPos);
    doc.text(`Collected: ${stats.collectedSamples}`, 20, yPos + 8);
    doc.text(`Processing: ${stats.processingSamples}`, 20, yPos + 16);
    doc.text(`Stored: ${stats.storedSamples}`, 20, yPos + 24);
    doc.text(`Disposed: ${stats.disposedSamples}`, 20, yPos + 32);
    
    // Add test type distribution
    doc.text('Test Type Distribution:', 120, yPos);
    let typeYPos = yPos + 8;
    Object.entries(stats.testTypeGroups || {}).forEach(([type, count], index) => {
      if (index < 5) { // Limit to top 5 for space
        doc.text(`${type}: ${count}`, 120, typeYPos);
        typeYPos += 8;
      }
    });
  };

  // Add sample table to PDF
  const addSampleTable = (doc, yPos) => {
    // Define tableColumn and tableRows within this function
    const tableColumn = ["Patient", "Test Type", "Collection Date", "Storage Location", "Status"];
    const tableRows = reportData.samples.map(sample => [
      sample.patient?.name || 'N/A',
      sample.testType || 'N/A',
      new Date(sample.collectionDate).toLocaleDateString(),
      sample.storageLocation || 'N/A',
      sample.status
    ]);
    
    autoTable(doc, {
      startY: yPos,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [66, 139, 202] }
    });
};

  // Add result statistics to PDF
  const addResultStats = (doc, yPos) => {
    doc.text(`Total Results: ${stats.totalResults}`, 20, yPos);
    doc.text(`Normal: ${stats.normalResults} (${stats.normalRate}%)`, 20, yPos + 8);
    doc.text(`High: ${stats.highResults}`, 20, yPos + 16);
    doc.text(`Low: ${stats.lowResults}`, 20, yPos + 24);
    doc.text(`Inconclusive: ${stats.inconclusiveResults}`, 20, yPos + 32);
    doc.text(`Critical: ${stats.criticalResults} (${stats.criticalRate}%)`, 20, yPos + 40);
    
    // Add test type distribution
    doc.text('Test Type Distribution:', 120, yPos);
    let typeYPos = yPos + 8;
    Object.entries(stats.testTypeGroups || {}).forEach(([type, count], index) => {
      if (index < 5) { // Limit to top 5 for space
        doc.text(`${type}: ${count}`, 120, typeYPos);
        typeYPos += 8;
      }
    });
  };

  // Add result table to PDF
  const addResultTable = (doc, yPos) => {
    // Define tableColumn and tableRows within this function
    const tableColumn = ["Patient", "Test Type", "Result", "Reference Range", "Interpretation", "Critical"];
    const tableRows = reportData.results.map(result => [
      result.patient?.name || 'N/A',
      result.testType || 'N/A',
      `${result.value || 'N/A'} ${result.unit || ''}`,
      result.referenceRange || 'N/A',
      result.interpretation || 'N/A',
      result.isCritical ? 'Yes' : 'No'
    ]);
    
    autoTable(doc, {
      startY: yPos,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [66, 139, 202] }
    });
};

  // Add inventory statistics to PDF
  const addInventoryStats = (doc, yPos) => {
    doc.text(`Total Items: ${stats.totalItems}`, 20, yPos);
    doc.text(`Low Stock: ${stats.lowStockItems} (${stats.lowStockRate}%)`, 20, yPos + 8);
    doc.text(`Out of Stock: ${stats.outOfStockItems}`, 20, yPos + 16);
    doc.text(`Healthy Stock: ${stats.healthyStockItems}`, 20, yPos + 24);
    
    // Add category distribution
    doc.text('Category Distribution:', 120, yPos);
    let catYPos = yPos + 8;
    Object.entries(stats.categoryGroups || {}).forEach(([category, count], index) => {
      if (index < 5) { // Limit to top 5 for space
        doc.text(`${category}: ${count}`, 120, catYPos);
        catYPos += 8;
      }
    });
  };

  // Add inventory table to PDF
  const addInventoryTable = (doc, yPos) => {
    // Define tableColumn and tableRows within this function
    const tableColumn = ["Item", "Category", "Quantity", "Unit", "Reorder Level", "Location", "Status"];
    const tableRows = reportData.inventory.map(item => {
      let status = 'In Stock';
      if (item.quantity <= 0) status = 'Out of Stock';
      else if (item.quantity <= item.reorderLevel) status = 'Low Stock';
      
      return [
        item.item || 'N/A',
        item.category || 'N/A',
        item.quantity.toString(),
        item.unit || '',
        item.reorderLevel.toString(),
        item.location || 'N/A',
        status
      ];
    });
    autoTable(doc, {
        startY: yPos,
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [66, 139, 202] }
      });
    };


  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Get display name for report type
  const getReportTypeName = () => {
    switch (reportType) {
      case 'testOrders': return 'Test Orders';
      case 'samples': return 'Sample Management';
      case 'results': return 'Test Results';
      case 'inventory': return 'Inventory';
      default: return 'Unknown';
    }
  };

  // Get filter options based on report type
  const getFilterOptions = () => {
    switch (reportType) {
      case 'testOrders':
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
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="sample_collected">Sample Collected</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Test Type</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={filters.testType}
                onChange={(e) => setFilters({ ...filters, testType: e.target.value })}
              >
                <option value="all">All Test Types</option>
                <option value="Blood Test">Blood Test</option>
                <option value="Urine Test">Urine Test</option>
                <option value="Complete Blood Count (CBC)">Complete Blood Count (CBC)</option>
                <option value="Basic Metabolic Panel">Basic Metabolic Panel</option>
                <option value="Comprehensive Metabolic Panel">Comprehensive Metabolic Panel</option>
              </select>
            </div>
          </>
        );
        
      case 'samples':
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
                <option value="collected">Collected</option>
                <option value="processing">Processing</option>
                <option value="stored">Stored</option>
                <option value="disposed">Disposed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Test Type</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={filters.testType}
                onChange={(e) => setFilters({ ...filters, testType: e.target.value })}
              >
                <option value="all">All Test Types</option>
                <option value="Blood Test">Blood Test</option>
                <option value="Urine Test">Urine Test</option>
                <option value="Complete Blood Count (CBC)">Complete Blood Count (CBC)</option>
                <option value="Basic Metabolic Panel">Basic Metabolic Panel</option>
                <option value="Comprehensive Metabolic Panel">Comprehensive Metabolic Panel</option>
              </select>
            </div>
          </>
        );
        
      case 'results':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Interpretation</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={filters.interpretation}
                onChange={(e) => setFilters({ ...filters, interpretation: e.target.value })}
              >
                <option value="all">All Interpretations</option>
                <option value="Normal">Normal</option>
                <option value="High">High</option>
                <option value="Low">Low</option>
                <option value="Inconclusive">Inconclusive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Critical Results</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={filters.isCritical}
                onChange={(e) => setFilters({ ...filters, isCritical: e.target.value })}
              >
                <option value="all">All Results</option>
                <option value="true">Critical Only</option>
                <option value="false">Non-Critical Only</option>
              </select>
            </div>
          </>
        );
        
      case 'inventory':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              >
                <option value="all">All Categories</option>
                <option value="Reagents">Reagents</option>
                <option value="Equipment">Equipment</option>
                <option value="Consumables">Consumables</option>
                <option value="Glassware">Glassware</option>
                <option value="PPE">PPE</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Level</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={filters.stockLevel}
                onChange={(e) => setFilters({ ...filters, stockLevel: e.target.value })}
              >
                <option value="all">All Stock Levels</option>
                <option value="low">Low Stock</option>
                <option value="out">Out of Stock</option>
                <option value="healthy">Healthy Stock</option>
              </select>
            </div>
          </>
        );
        
      default:
        return null;
    }
  };

  // Render report preview based on type
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
      case 'testOrders':
        return renderTestOrdersPreview();
      case 'samples':
        return renderSamplesPreview();
      case 'results':
        return renderResultsPreview();
      case 'inventory':
        return renderInventoryPreview();
      default:
        return <div className="text-center py-8 text-gray-500">Select a report type</div>;
    }
  };

  // Render test orders report preview
  const renderTestOrdersPreview = () => {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Test Orders Report</h2>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Test Status</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Tests:</span>
                <span className="font-bold">{stats.totalTests}</span>
              </div>
              <div className="flex justify-between">
                <span>Completed:</span>
                <span className="font-bold">{stats.completeTests} ({stats.completionRate}%)</span>
              </div>
              <div className="flex justify-between">
                <span>Pending:</span>
                <span className="font-bold">{stats.pendingTests}</span>
              </div>
              <div className="flex justify-between">
                <span>In Progress:</span>
                <span className="font-bold">{stats.inProgressTests}</span>
              </div>
              <div className="flex justify-between">
                <span>Sample Collected:</span>
                <span className="font-bold">{stats.sampleCollectedTests}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Test Types</h3>
            <div className="space-y-2">
              {Object.entries(stats.testTypeGroups || {}).map(([type, count]) => (
                <div className="flex justify-between" key={type}>
                  <span>{type}:</span>
                  <span className="font-bold">{count}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Ordering Doctors</h3>
            <div className="space-y-2">
              {Object.entries(stats.doctorGroups || {}).map(([doctor, count]) => (
                <div className="flex justify-between" key={doctor}>
                  <span>{doctor}:</span>
                  <span className="font-bold">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Test Orders Table */}
        <h3 className="text-lg font-semibold mt-6 mb-3">Test Orders Data</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border-b text-left">Patient</th>
                <th className="py-2 px-4 border-b text-left">Test Type</th>
                <th className="py-2 px-4 border-b text-left">Doctor</th>
                <th className="py-2 px-4 border-b text-left">Scheduled Date</th>
                <th className="py-2 px-4 border-b text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {reportData.testOrders.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-4 text-center text-gray-500">No test orders found for the selected filters</td>
                </tr>
              ) : (
                reportData.testOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b">{order.patient?.name || 'N/A'}</td>
                    <td className="py-2 px-4 border-b">{order.testType || 'N/A'}</td>
                    <td className="py-2 px-4 border-b">{order.doctor?.name || 'N/A'}</td>
                    <td className="py-2 px-4 border-b">{new Date(order.scheduledDate).toLocaleString()}</td>
                    <td className="py-2 px-4 border-b">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        order.status === 'Completed' 
                          ? 'bg-green-100 text-green-800'
                          : order.status === 'Pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : order.status === 'In Progress'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {order.status}
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

  // Render samples report preview
  const renderSamplesPreview = () => {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Sample Management Report</h2>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Sample Status</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Samples:</span>
                <span className="font-bold">{stats.totalSamples}</span>
              </div>
              <div className="flex justify-between">
                <span>Collected:</span>
                <span className="font-bold">{stats.collectedSamples}</span>
              </div>
              <div className="flex justify-between">
                <span>Processing:</span>
                <span className="font-bold">{stats.processingSamples}</span>
              </div>
              <div className="flex justify-between">
                <span>Stored:</span>
                <span className="font-bold">{stats.storedSamples}</span>
              </div>
              <div className="flex justify-between">
                <span>Disposed:</span>
                <span className="font-bold">{stats.disposedSamples}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Test Types</h3>
            <div className="space-y-2">
              {Object.entries(stats.testTypeGroups || {}).map(([type, count]) => (
                <div className="flex justify-between" key={type}>
                  <span>{type}:</span>
                  <span className="font-bold">{count}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Storage Locations</h3>
            <div className="space-y-2">
              {Object.entries(stats.locationGroups || {}).map(([location, count]) => (
                <div className="flex justify-between" key={location}>
                  <span>{location}:</span>
                  <span className="font-bold">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Samples Table */}
        <h3 className="text-lg font-semibold mt-6 mb-3">Samples Data</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border-b text-left">Patient</th>
                <th className="py-2 px-4 border-b text-left">Test Type</th>
                <th className="py-2 px-4 border-b text-left">Collection Date</th>
                <th className="py-2 px-4 border-b text-left">Storage Location</th>
                <th className="py-2 px-4 border-b text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {reportData.samples.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-4 text-center text-gray-500">No samples found for the selected filters</td>
                </tr>
              ) : (
                reportData.samples.map((sample) => (
                  <tr key={sample._id} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b">{sample.patient?.name || 'N/A'}</td>
                    <td className="py-2 px-4 border-b">{sample.testType || 'N/A'}</td>
                    <td className="py-2 px-4 border-b">{new Date(sample.collectionDate).toLocaleString()}</td>
                    <td className="py-2 px-4 border-b">{sample.storageLocation || 'N/A'}</td>
                    <td className="py-2 px-4 border-b">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        sample.status === 'collected' 
                          ? 'bg-green-100 text-green-800'
                          : sample.status === 'processing'
                          ? 'bg-blue-100 text-blue-800'
                          : sample.status === 'stored'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {sample.status}
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

  // Render results report preview
  const renderResultsPreview = () => {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Test Results Report</h2>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Result Status</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Results:</span>
                <span className="font-bold">{stats.totalResults}</span>
              </div>
              <div className="flex justify-between">
                <span>Normal:</span>
                <span className="font-bold">{stats.normalResults} ({stats.normalRate}%)</span>
              </div>
              <div className="flex justify-between">
                <span>High:</span>
                <span className="font-bold">{stats.highResults}</span>
              </div>
              <div className="flex justify-between">
                <span>Low:</span>
                <span className="font-bold">{stats.lowResults}</span>
              </div>
              <div className="flex justify-between">
                <span>Inconclusive:</span>
                <span className="font-bold">{stats.inconclusiveResults}</span>
              </div>
              <div className="flex justify-between">
                <span>Critical:</span>
                <span className="font-bold">{stats.criticalResults} ({stats.criticalRate}%)</span>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Test Types</h3>
            <div className="space-y-2">
              {Object.entries(stats.testTypeGroups || {}).map(([type, count]) => (
                <div className="flex justify-between" key={type}>
                  <span>{type}:</span>
                  <span className="font-bold">{count}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Results Summary</h3>
            <div className="h-32 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600">{stats.normalRate}%</div>
                <div>Normal Results</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Results Table */}
        <h3 className="text-lg font-semibold mt-6 mb-3">Test Results Data</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border-b text-left">Patient</th>
                <th className="py-2 px-4 border-b text-left">Test Type</th>
                <th className="py-2 px-4 border-b text-left">Result</th>
                <th className="py-2 px-4 border-b text-left">Reference Range</th>
                <th className="py-2 px-4 border-b text-left">Interpretation</th>
                <th className="py-2 px-4 border-b text-left">Critical</th>
              </tr>
            </thead>
            <tbody>
              {reportData.results.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-4 text-center text-gray-500">No test results found for the selected filters</td>
                </tr>
              ) : (
                reportData.results.map((result) => (
                  <tr key={result._id} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b">{result.patient?.name || 'N/A'}</td>
                    <td className="py-2 px-4 border-b">{result.testType || 'N/A'}</td>
                    <td className="py-2 px-4 border-b">{`${result.value || 'N/A'} ${result.unit || ''}`}</td>
                    <td className="py-2 px-4 border-b">{result.referenceRange || 'N/A'}</td>
                    <td className="py-2 px-4 border-b">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        result.interpretation === 'Normal' 
                          ? 'bg-green-100 text-green-800'
                          : result.interpretation === 'High'
                          ? 'bg-red-100 text-red-800'
                          : result.interpretation === 'Low'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {result.interpretation || 'N/A'}
                      </span>
                    </td>
                    <td className="py-2 px-4 border-b">
                      {result.isCritical ? (
                        <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                          Yes
                        </span>
                      ) : 'No'}
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
            <h3 className="text-lg font-semibold mb-2">Inventory Status</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Items:</span>
                <span className="font-bold">{stats.totalItems}</span>
              </div>
              <div className="flex justify-between">
                <span>Low Stock:</span>
                <span className="font-bold">{stats.lowStockItems} ({stats.lowStockRate}%)</span>
              </div>
              <div className="flex justify-between">
                <span>Out of Stock:</span>
                <span className="font-bold">{stats.outOfStockItems}</span>
              </div>
              <div className="flex justify-between">
                <span>Healthy Stock:</span>
                <span className="font-bold">{stats.healthyStockItems}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Categories</h3>
            <div className="space-y-2">
              {Object.entries(stats.categoryGroups || {}).map(([category, count]) => (
                <div className="flex justify-between" key={category}>
                  <span>{category}:</span>
                  <span className="font-bold">{count}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Stock Health</h3>
            <div className="h-32 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600">
                  {stats.totalItems ? (100 - parseFloat(stats.lowStockRate)).toFixed(2) : 0}%
                </div>
                <div>Healthy Stock Rate</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Inventory Table */}
        <h3 className="text-lg font-semibold mt-6 mb-3">Inventory Data</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border-b text-left">Item</th>
                <th className="py-2 px-4 border-b text-left">Category</th>
                <th className="py-2 px-4 border-b text-left">Quantity</th>
                <th className="py-2 px-4 border-b text-left">Unit</th>
                <th className="py-2 px-4 border-b text-left">Reorder Level</th>
                <th className="py-2 px-4 border-b text-left">Location</th>
                <th className="py-2 px-4 border-b text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {reportData.inventory.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-4 text-center text-gray-500">No inventory items found for the selected filters</td>
                </tr>
              ) : (
                reportData.inventory.map((item) => {
                  let status = 'In Stock';
                  if (item.quantity <= 0) status = 'Out of Stock';
                  else if (item.quantity <= item.reorderLevel) status = 'Low Stock';
                  
                  return (
                    <tr key={item._id} className="hover:bg-gray-50">
                      <td className="py-2 px-4 border-b">{item.item || 'N/A'}</td>
                      <td className="py-2 px-4 border-b">{item.category || 'N/A'}</td>
                      <td className="py-2 px-4 border-b">{item.quantity}</td>
                      <td className="py-2 px-4 border-b">{item.unit || ''}</td>
                      <td className="py-2 px-4 border-b">{item.reorderLevel}</td>
                      <td className="py-2 px-4 border-b">{item.location || 'N/A'}</td>
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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Lab Reports</h2>
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
                <option value="testOrders">Test Orders</option>
                <option value="samples">Sample Management</option>
                <option value="results">Test Results</option>
                <option value="inventory">Inventory</option>
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

export default LabReports;