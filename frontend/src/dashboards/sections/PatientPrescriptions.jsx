import React, { useState, useEffect } from 'react';
import { Pill, Search, RefreshCw, AlertCircle } from 'lucide-react';
import patientService from '../../api/patientService';

// Refill Request Modal
const RefillModal = ({ isOpen, onClose, prescription }) => {
  const [formData, setFormData] = useState({
    pharmacyLocation: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await patientService.requestRefill(prescription._id, formData);
      onClose();
    } catch (error) {
      console.error('Error requesting refill:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !prescription) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Request Refill</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">×</button>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium">{prescription.medications[0]?.name}</h4>
            <p className="text-sm text-gray-600 mt-1">
              {prescription.medications[0]?.dosage} - {prescription.medications[0]?.frequency}
            </p>
            <p className="text-sm text-gray-600">Prescribed by: Dr. {prescription.doctor?.name}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Pharmacy Location</label>
            <select 
              className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.pharmacyLocation}
              onChange={(e) => setFormData({...formData, pharmacyLocation: e.target.value})}
            >
              <option value="">Select Pharmacy</option>
              <option value="main">Main Street Pharmacy</option>
              <option value="hospital">Hospital Pharmacy</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
            <textarea 
              className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Any special instructions or notes"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
            ></textarea>
          </div>

          <div className="flex space-x-2 pt-4">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PatientPrescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [activeTab, setActiveTab] = useState('active');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const response = await patientService.getPrescriptions();
      setPrescriptions(response.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching prescriptions:', err);
      setError('Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const filteredPrescriptions = prescriptions.filter(prescription => {
    const matchesTab = activeTab === 'active' ? 
      prescription.status === 'active' : 
      prescription.status !== 'active';
    
    const matchesSearch = searchTerm === '' ||
      prescription.medications.some(med => 
        med.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

    return matchesTab && matchesSearch;
  });

  if (loading) return <div className="p-4">Loading prescriptions...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">My Prescriptions</h2>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 rounded-lg ${
            activeTab === 'active' 
              ? 'bg-blue-50 text-blue-600'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          Active Prescriptions
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`px-4 py-2 rounded-lg ${
            activeTab === 'past' 
              ? 'bg-blue-50 text-blue-600'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          Past Prescriptions
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search prescriptions..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Prescriptions List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="divide-y divide-gray-200">
          {filteredPrescriptions.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No prescriptions found
            </div>
          ) : (
            filteredPrescriptions.map((prescription) => (
              <div key={prescription._id} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center">
                      <h3 className="font-medium">{prescription.medications[0]?.name}</h3>
                      {prescription.refillsLeft > 0 && (
                        <span className="ml-2 px-2 py-1 text-xs text-green-800 bg-green-100 rounded-full">
                          {prescription.refillsLeft} refills left
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {prescription.medications[0]?.dosage} - {prescription.medications[0]?.frequency}
                    </p>
                    <p className="text-sm text-gray-500">
                      Prescribed by Dr. {prescription.doctor?.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      Prescribed on {new Date(prescription.date).toLocaleDateString()}
                    </p>
                  </div>
                  {prescription.status === 'active' && (
                    <button
                      onClick={() => setSelectedPrescription(prescription)}
                      className="flex items-center px-3 py-1 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <RefreshCw size={16} className="mr-1" />
                      Request Refill
                    </button>
                  )}
                </div>
                {prescription.status === 'active' && prescription.notes && (
                  <div className="mt-3 flex items-center text-sm text-gray-500">
                    <AlertCircle size={16} className="mr-1" />
                    {prescription.notes}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Refill Request Modal */}
      <RefillModal 
        isOpen={selectedPrescription !== null}
        onClose={() => setSelectedPrescription(null)}
        prescription={selectedPrescription}
      />
    </div>
  );
};

export default PatientPrescriptions;