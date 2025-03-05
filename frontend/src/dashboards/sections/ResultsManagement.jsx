import React, { useState, useEffect } from 'react';
import { Plus, Search, AlertCircle } from 'lucide-react';
import labService from '../../api/labService';

const AddResultModal = ({ isOpen, onClose, onResultAdded }) => {
  const [formData, setFormData] = useState({
    testId: '',
    value: '',
    unit: '',
    referenceRange: '',
    interpretation: '',
    isCritical: false,
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pendingTests, setPendingTests] = useState([]);

  useEffect(() => {
    if (isOpen) {
      fetchPendingTests();
    }
  }, [isOpen]);

  const fetchPendingTests = async () => {
    try {
      const response = await labService.getTestsReadyForResults();
      setPendingTests(response.data || []);
    } catch (error) {
      console.error('Error fetching tests ready for results:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
  
    console.log('Submitting Test Result:', {
      testId: formData.testId,
      value: formData.value,
      unit: formData.unit,
      referenceRange: formData.referenceRange,
      interpretation: formData.interpretation,
      isCritical: formData.isCritical,
      notes: formData.notes
    });
  
    try {
      const response = await labService.addTestResult({
        testId: formData.testId,
        value: formData.value,
        unit: formData.unit,
        referenceRange: formData.referenceRange,
        interpretation: formData.interpretation,
        isCritical: formData.isCritical,
        notes: formData.notes
      });
  
      console.log('Server Response:', response);
  
      onResultAdded(); // This will trigger result refresh and dashboard refresh
      onClose();
    } catch (error) {
      console.error('Detailed Error:', error.response?.data || error);
      setError(error.response?.data?.message || 'Failed to add test result');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Add Test Result</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Test</label>
            <select
              className="mt-1 w-full p-2 border rounded-lg"
              value={formData.testId}
              onChange={(e) => setFormData({ ...formData, testId: e.target.value })}
              required
            >
              <option value="">Select Test</option>
              {pendingTests.map(test => (
                <option key={test._id} value={test._id}>
                  {test.testType} - {test.patient?.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Result Value</label>
            <input
              type="text"
              className="mt-1 w-full p-2 border rounded-lg"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Unit</label>
            <input
              type="text"
              className="mt-1 w-full p-2 border rounded-lg"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Reference Range</label>
            <input
              type="text"
              className="mt-1 w-full p-2 border rounded-lg"
              value={formData.referenceRange}
              onChange={(e) => setFormData({ ...formData, referenceRange: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Interpretation</label>
            <select
              className="mt-1 w-full p-2 border rounded-lg"
              value={formData.interpretation}
              onChange={(e) => setFormData({ ...formData, interpretation: e.target.value })}
              required
            >
              <option value="">Select Interpretation</option>
              <option value="Normal">Normal</option>
              <option value="High">High</option>
              <option value="Low">Low</option>
              <option value="Inconclusive">Inconclusive</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isCritical"
              checked={formData.isCritical}
              onChange={(e) => setFormData({ ...formData, isCritical: e.target.checked })}
              className="h-4 w-4 text-blue-600"
            />
            <label htmlFor="isCritical" className="ml-2 text-sm text-gray-700">
              Mark as Critical Result
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              className="mt-1 w-full p-2 border rounded-lg"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows="3"
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm flex items-center">
              <AlertCircle size={16} className="mr-1" />
              {error}
            </div>
          )}

          <div className="flex space-x-2 pt-4">
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 py-2 rounded-lg transition-colors ${
                loading 
                  ? 'bg-blue-300 cursor-not-allowed' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {loading ? 'Adding...' : 'Add Result'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ResultsManagement = (props) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const response = await labService.getTestResults();
      
      // Log the full response for debugging
      console.log('Fetched Test Results Response:', response);
      
      // Ensure we're accessing the correct data property
      setResults(response.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching results:', err);
      setError('Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  // This function will be passed to the modal
  // It will refresh the results and notify the parent dashboard
  const handleResultAdded = () => {
    fetchResults(); // Refresh the results list
    
    // Notify the parent dashboard to refresh as well
    if (props.onResultAdded) {
      props.onResultAdded();
    }
  };

  const filteredResults = results.filter(result => {
    const matchesSearch = 
      result.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.testType?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || result.interpretation === filterStatus;

    return matchesSearch && matchesStatus;
  });

  if (loading) return <div className="p-4">Loading results...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Test Results</h2>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          <Plus size={20} className="mr-2" />
          Add Result
        </button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search results..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="px-4 py-2 border rounded-lg"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Results</option>
          <option value="Normal">Normal</option>
          <option value="High">High</option>
          <option value="Low">Low</option>
          <option value="Inconclusive">Inconclusive</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Test Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Result</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference Range</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Interpretation</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredResults.map((result) => (
              <tr key={result._id}>
                <td className="px-6 py-4">{result.patient?.name || 'Unknown Patient'}</td>
                <td className="px-6 py-4">{result.testType}</td>
                <td className="px-6 py-4">
                  {result.value} {result.unit}
                </td>
                <td className="px-6 py-4">{result.referenceRange}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    result.interpretation === 'Normal'
                      ? 'bg-green-100 text-green-800'
                      : result.interpretation === 'High'
                      ? 'bg-red-100 text-red-800'
                      : result.interpretation === 'Low'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {result.interpretation}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {result.isCritical && (
                    <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                      CRITICAL
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AddResultModal 
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onResultAdded={handleResultAdded} // Use our new function instead of just fetchResults
      />
    </div>
  );
};

export default ResultsManagement;