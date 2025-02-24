import React, { useState, useEffect } from 'react';
import { Search, Check, X, Eye } from 'lucide-react';
import pharmacyService from '../../api/pharmacyService';

const PrescriptionModal = ({ isOpen, onClose, prescription }) => {
  if (!isOpen || !prescription) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">Prescription Details</h3>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>
        {/* Patient and Prescription Info */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Patient Name</label>
            <p className="mt-1 text-gray-900">{prescription.patient?.name || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Prescribing Doctor</label>
            <p className="mt-1 text-gray-900">{prescription.doctor?.name || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Date Prescribed</label>
            <p className="mt-1 text-gray-900">
              {new Date(prescription.date).toLocaleDateString()}
            </p>
          </div>
          <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
            <span className={`inline-block mt-1 px-2 py-1 text-xs rounded-full ${
              prescription.status === 'completed' 
                ? 'bg-green-100 text-green-800'
                : prescription.status === 'active'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {prescription.status.charAt(0).toUpperCase() + prescription.status.slice(1)}
            </span>
          </div>
        </div>

      {/* Medications List */}
      <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-3">Medications</h4>
          {prescription.medications?.map((med, index) => (
            <div 
              key={index} 
              className="bg-gray-50 p-4 rounded-lg mb-3 last:mb-0"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-800">{med.name}</p>
                  <p className="text-sm text-gray-600">Dosage: {med.dosage}</p>
                  <p className="text-sm text-gray-600">Frequency: {med.frequency}</p>
                  {med.duration && (
                    <p className="text-sm text-gray-600">Duration: {med.duration}</p>
                  )}
                </div>
              </div>
            </div>
            ))}
            </div>
    
            {/* Notes Section */}
            {prescription.notes && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-800">{prescription.notes}</p>
                </div>
              </div>
            )}
    
            {/* Action Buttons */}
            <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const PharmacyPrescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch prescriptions
  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      setIsLoading(true);
      const response = await pharmacyService.getPrescriptions();
      
      // Ensure we have an array
      const prescriptionData = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.data || []);

      setPrescriptions(prescriptionData);
      setError(null);
    } catch (err) {
      console.error('Error fetching prescriptions:', err);
      setError('Failed to fetch prescriptions');
      setPrescriptions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter prescriptions based on status and search term
  const filteredPrescriptions = prescriptions.filter(prescription => {
    const matchesStatus = filterStatus === 'all' || prescription.status === filterStatus;
    const matchesSearch = 
      (prescription.patient?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (prescription.doctor?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (isLoading) return <div className="p-4">Loading prescriptions...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Prescriptions</h2>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search prescriptions..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Prescriptions List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredPrescriptions.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No prescriptions found
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredPrescriptions.map((prescription) => (
              <div key={prescription._id} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center">
                      <h3 className="font-medium">
                        {prescription.patient?.name || 'Unknown Patient'}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Prescribed by {prescription.doctor?.name || 'Unknown Doctor'} 
                      on {new Date(prescription.date).toLocaleDateString()}
                    </p>
                    <div className="mt-2">
                      {prescription.medications?.map((med, index) => (
                        <p key={index} className="text-sm text-gray-600">
                          {med.name} - {med.dosage}
                        </p>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`px-2 py-1 text-sm rounded-full ${
                      prescription.status === 'completed' 
                        ? 'bg-green-100 text-green-800'
                        : prescription.status === 'active'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {prescription.status.charAt(0).toUpperCase() + prescription.status.slice(1)}
                    </span>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => setSelectedPrescription(prescription)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Prescription Details Modal (you can add this later) */}

      <PrescriptionModal 
        isOpen={selectedPrescription !== null}
        onClose={() => setSelectedPrescription(null)}
        prescription={selectedPrescription}
      />
    
    </div>
  );
};

export default PharmacyPrescriptions;