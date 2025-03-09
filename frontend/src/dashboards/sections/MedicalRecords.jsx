import React, { useState, useEffect } from 'react';
import { FileText, Search, Filter, Download, Eye, Plus, X } from 'lucide-react';
import doctorService from '../../api/doctorService';

// Add Record Modal Component
const AddRecordModal = ({ isOpen, onClose, onRecordAdded }) => {
  const [formData, setFormData] = useState({
    patientId: '',
    diagnosis: '',
    symptoms: '',
    treatment: '',
    notes: '',
    type: '' // Adding type field
  });
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await doctorService.getPatients();
        setPatients(response.data || []);
      } catch (error) {
        console.error('Error fetching patients:', error);
      }
    };
    fetchPatients();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await doctorService.createMedicalRecord(formData);
      onRecordAdded();
      onClose();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create record');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Add Medical Record</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Patient</label>
            <select
              className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.patientId}
              onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
              required
            >
              <option value="">Select Patient</option>
              {patients.map(patient => (
                <option key={patient._id} value={patient._id}>
                  {patient.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Record Type</label>
            <select
              className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              required
            >
              <option value="">Select Type</option>
              <option value="Check-up">Check-up</option>
              <option value="Emergency">Emergency</option>
              <option value="Surgery">Surgery</option>
              <option value="Follow-up">Follow-up</option>
              <option value="Consultation">Consultation</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Diagnosis</label>
            <input
              type="text"
              className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.diagnosis}
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Symptoms</label>
            <textarea
              className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.symptoms}
              onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
              required
              rows="3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Treatment</label>
            <textarea
              className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.treatment}
              onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
              required
              rows="3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows="3"
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm">
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
              {loading ? 'Adding...' : 'Add Record'}
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

// Main Component
const MedicalRecords = () => {
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'week', 'month'

  useEffect(() => {
    fetchRecords();
  }, [dateFilter]);

  // Filter records when search term or type filter changes
  useEffect(() => {
    if (records.length > 0) {
      setIsFiltering(true);
      
      // Use a small timeout to avoid flickering for fast filters
      const filterTimer = setTimeout(() => {
        const filtered = records.filter(record => {
          // Filter by search term
          const matchesSearch = searchTerm === '' || 
            (record.patient?.name && record.patient.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (record.diagnosis && record.diagnosis.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (record.symptoms && typeof record.symptoms === 'string' && record.symptoms.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (record.treatment && typeof record.treatment === 'string' && record.treatment.toLowerCase().includes(searchTerm.toLowerCase()));
          
          // Filter by type
          const matchesType = typeFilter === 'all' || record.type === typeFilter;
          
          return matchesSearch && matchesType;
});
        
        setFilteredRecords(filtered);
        setIsFiltering(false);
      }, 200);
      
      return () => clearTimeout(filterTimer);
    } else {
      setFilteredRecords([]);
    }
  }, [searchTerm, typeFilter, records]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      
      // Prepare date filter parameters
      let params = {};
      if (dateFilter === 'week') {
        const today = new Date();
        const weekAgo = new Date();
        weekAgo.setDate(today.getDate() - 7);
        params = { startDate: weekAgo.toISOString(), endDate: today.toISOString() };
      } else if (dateFilter === 'month') {
        const today = new Date();
        const monthAgo = new Date();
        monthAgo.setMonth(today.getMonth() - 1);
        params = { startDate: monthAgo.toISOString(), endDate: today.toISOString() };
      }
      
      const response = await doctorService.getMedicalRecords(params);
      setRecords(response.data || []);
      setFilteredRecords(response.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching medical records:', err);
      setError('Failed to load medical records');
    } finally {
      setLoading(false);
    }
  };

  const handleViewRecord = (record) => {
    setSelectedRecord(record);
  };

  const handleDownloadRecord = (record) => {
    // Create a text representation of the record
    const recordText = `
      MEDICAL RECORD
      
      Patient: ${record.patient?.name || 'N/A'}
      Date: ${new Date(record.date).toLocaleDateString()}
      Type: ${record.type || 'N/A'}
      Diagnosis: ${record.diagnosis || 'N/A'}
      
      Symptoms:
      ${record.symptoms || 'None recorded'}
      
      Treatment:
      ${record.treatment || 'None recorded'}
      
      Notes:
      ${record.notes || 'None recorded'}
    `;
    
    // Create blob and download
    const blob = new Blob([recordText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Medical_Record_${record.patient?.name}_${new Date(record.date).toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading && !isFiltering) return <div className="p-4">Loading medical records...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Medical Records</h2>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          <Plus size={20} className="mr-2" />
          Add Record
        </button>
      </div>

      {/* Date Filter Buttons */}
      <div className="flex space-x-2 mb-4">
        <button 
          onClick={() => setDateFilter('all')}
          className={`px-3 py-1 rounded ${dateFilter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          All Records
        </button>
        <button 
          onClick={() => setDateFilter('week')}
          className={`px-3 py-1 rounded ${dateFilter === 'week' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Last 7 Days
        </button>
        <button 
          onClick={() => setDateFilter('month')}
          className={`px-3 py-1 rounded ${dateFilter === 'month' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Last 30 Days
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search records by patient, diagnosis..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="all">All Types</option>
          <option value="Check-up">Check-ups</option>
          <option value="Emergency">Emergency</option>
          <option value="Surgery">Surgery</option>
          <option value="Follow-up">Follow-ups</option>
          <option value="Consultation">Consultations</option>
        </select>
      </div>

      {/* Filtering indicator */}
      {isFiltering && (
        <div className="text-center py-2 mb-4">
          <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-blue-500 border-r-transparent"></div>
          <span className="ml-2 text-sm text-gray-600">Filtering...</span>
        </div>
      )}

      {/* Results counter */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {filteredRecords.length} of {records.length} medical records
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Diagnosis</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  {(searchTerm || typeFilter !== 'all') 
                    ? "No medical records match your search criteria" 
                    : "No medical records found for the selected period"}
                </td>
              </tr>
            ) : (
              filteredRecords.map((record) => (
                <tr key={record._id}>
                  <td className="px-6 py-4 whitespace-nowrap">{record.patient?.name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(record.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      record.type === 'Emergency' 
                        ? 'bg-red-100 text-red-800'
                        : record.type === 'Surgery'
                        ? 'bg-purple-100 text-purple-800'
                        : record.type === 'Check-up'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {record.type || 'General'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{record.diagnosis}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleViewRecord(record)}
                        className="text-blue-600 hover:text-blue-900 font-medium flex items-center"
                      >
                        <Eye size={18} className="mr-1" />
                        View
                      </button>
                      <button 
                        onClick={() => handleDownloadRecord(record)}
                        className="text-green-600 hover:text-green-900 font-medium flex items-center"
                      >
                        <Download size={18} className="mr-1" />
                        Download
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Record Details Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Medical Record Details</h3>
              <button 
                onClick={() => setSelectedRecord(null)} 
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Patient Name</label>
                  <p className="mt-1">{selectedRecord.patient?.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <p className="mt-1">{new Date(selectedRecord.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <p className="mt-1">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      selectedRecord.type === 'Emergency' 
                        ? 'bg-red-100 text-red-800'
                        : selectedRecord.type === 'Surgery'
                        ? 'bg-purple-100 text-purple-800'
                        : selectedRecord.type === 'Check-up'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {selectedRecord.type || 'General'}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Diagnosis</label>
                  <p className="mt-1">{selectedRecord.diagnosis}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Symptoms</label>
                <p className="mt-1 p-2 bg-gray-50 rounded">{selectedRecord.symptoms || 'None recorded'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Treatment</label>
                <p className="mt-1 p-2 bg-gray-50 rounded">{selectedRecord.treatment || 'None recorded'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <p className="mt-1 p-2 bg-gray-50 rounded">{selectedRecord.notes || 'None recorded'}</p>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  onClick={() => handleDownloadRecord(selectedRecord)}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center"
                >
                  <Download size={18} className="mr-2" />
                  Download
                </button>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Record Modal */}
      <AddRecordModal 
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onRecordAdded={fetchRecords}
      />
    </div>
  );
};

export default MedicalRecords;