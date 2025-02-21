import React, { useState, useEffect } from 'react';
import { Plus, Search, AlertCircle } from 'lucide-react';
import labService from '../../api/labService';

const CollectSampleModal = ({ isOpen, onClose, onSampleCollected }) => {
  const [formData, setFormData] = useState({
    patientId: '',
    testType: '',
    collectionDate: '',
    notes: '',
    storageLocation: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    if (isOpen) {
      fetchPatients();
    }
  }, [isOpen]);

  const fetchPatients = async () => {
    try {
      const response = await labService.getPatients();
      setPatients(response.data || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
  
    console.log('Sending sample data:', formData); // Add this
  
    try {
      await labService.collectSample(formData);
      onSampleCollected();
      onClose();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to collect sample');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Collect New Sample</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Patient</label>
            <select
              className="mt-1 w-full p-2 border rounded-lg"
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
            <label className="block text-sm font-medium text-gray-700">Test Type</label>
            <select
              className="mt-1 w-full p-2 border rounded-lg"
              value={formData.testType}
              onChange={(e) => setFormData({ ...formData, testType: e.target.value })}
              required
            >
              <option value="">Select Test Type</option>
              <option value="Blood Test">Blood Test</option>
              <option value="Urine Test">Urine Test</option>
              <option value="Swab Test">Swab Test</option>
              <option value="Tissue Sample">Tissue Sample</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Collection Date</label>
            <input
              type="datetime-local"
              className="mt-1 w-full p-2 border rounded-lg"
              value={formData.collectionDate}
              onChange={(e) => setFormData({ ...formData, collectionDate: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Storage Location</label>
            <input
              type="text"
              className="mt-1 w-full p-2 border rounded-lg"
              value={formData.storageLocation}
              onChange={(e) => setFormData({ ...formData, storageLocation: e.target.value })}
              placeholder="e.g., Lab Storage Room A-123"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              className="mt-1 w-full p-2 border rounded-lg"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows="3"
              placeholder="Any additional notes about the sample"
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
              {loading ? 'Collecting...' : 'Collect Sample'}
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

const SampleManagement = () => {
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchSamples();
  }, []);

  const fetchSamples = async () => {
    try {
      setLoading(true);
      const response = await labService.getSamples();
      setSamples(response.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching samples:', err);
      setError('Failed to load samples');
    } finally {
      setLoading(false);
    }
  };

  const filteredSamples = samples.filter(sample => {
    const matchesSearch = 
      sample.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sample.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sample.sampleId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || sample.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  if (loading) return <div className="p-4">Loading samples...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Sample Management</h2>
        <button 
          onClick={() => setShowCollectModal(true)}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          <Plus size={20} className="mr-2" />
          Collect New Sample
        </button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search samples..."
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
          <option value="all">All Status</option>
          <option value="collected">Collected</option>
          <option value="processing">Processing</option>
          <option value="stored">Stored</option>
          <option value="disposed">Disposed</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sample ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Collection Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Storage Location</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredSamples.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  No samples found
                </td>
              </tr>
            ) : (
              filteredSamples.map((sample) => (
                <tr key={sample._id}>
                  <td className="px-6 py-4">{sample.sampleId}</td>
                  <td className="px-6 py-4">{sample.patient?.name}</td>
                  <td className="px-6 py-4">{sample.type}</td>
                  <td className="px-6 py-4">
                    {new Date(sample.collectionDate).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
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
                  <td className="px-6 py-4">{sample.storageLocation}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <CollectSampleModal 
        isOpen={showCollectModal}
        onClose={() => setShowCollectModal(false)}
        onSampleCollected={fetchSamples}
      />
    </div>
  );
};

export default SampleManagement;