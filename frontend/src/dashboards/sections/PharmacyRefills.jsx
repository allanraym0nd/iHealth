import React, { useState, useEffect } from 'react';
import { Search, Check, X, Eye, AlertCircle } from 'lucide-react';
import pharmacyService from '../../api/pharmacyService';

// Refill Request Details Modal
// Refill Request Details Modal
const RefillRequestModal = ({ isOpen, onClose, refillRequest, onApprove, onReject }) => {
  if (!isOpen || !refillRequest) return null;

  // Add the same getPatientName function inside the modal component
  const getPatientName = (request) => {
    // Try to get patient info from patient field
    if (request.patient) {
      if (typeof request.patient === 'object' && request.patient.name) {
        return request.patient.name;
      }
      if (typeof request.patient === 'string') {
        return 'Patient #' + request.patient.substring(0, 6);
      }
    }
    
    // If no patient, try to get from prescription
    if (request.prescription && request.prescription.patient) {
      if (typeof request.prescription.patient === 'object' && request.prescription.patient.name) {
        return request.prescription.patient.name;
      }
    }
    
    // Default fallback
    return 'Unknown Patient';
  };

  const handleApprove = () => {
    onApprove(refillRequest._id);
  };

  const handleReject = () => {
    onReject(refillRequest._id);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">Refill Request Details</h3>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        {/* Refill Request Information */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Patient Name</label>
            <p className="mt-1 text-gray-900">
              {getPatientName(refillRequest)}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Request Date</label>
            <p className="mt-1 text-gray-900">
              {new Date(refillRequest.requestDate).toLocaleDateString()}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <span className={`inline-block mt-1 px-2 py-1 text-xs rounded-full ${
              refillRequest.status === 'Approved'
                ? 'bg-green-100 text-green-800'
                : refillRequest.status === 'Pending'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {refillRequest.status}
            </span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Prescription</label>
            <p className="mt-1 text-gray-900">
              {refillRequest.prescription?.medications?.[0]?.name || 'N/A'}
            </p>
          </div>
        </div>

        {/* Prescription Details */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-3">
            Original Prescription Details
          </h4>
          {refillRequest.prescription ? (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Prescribed By
                  </label>
                  <p>{refillRequest.prescription.doctor?.name || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Original Date
                  </label>
                  <p>
                    {new Date(refillRequest.prescription.date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Medications
                  </label>
                  {refillRequest.prescription.medications?.map((med, index) => (
                    <p key={index} className="text-sm text-gray-600">
                      {med.name} - {med.dosage}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No prescription details available</p>
          )}
        </div>

        {/* Notes */}
        {refillRequest.notes && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes
            </label>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-800">{refillRequest.notes}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-2">
          {refillRequest.status === 'Pending' && (
            <>
              <button
                onClick={handleApprove}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                Approve
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Reject
              </button>
            </>
          )}
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

const PharmacyRefills = () => {
  const [refillRequests, setRefillRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRefillRequest, setSelectedRefillRequest] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch refill requests
  useEffect(() => {
    fetchRefillRequests();
  }, []);

  const fetchRefillRequests = async () => {
    try {
      setIsLoading(true);
      const response = await pharmacyService.getRefillRequests();
      
      // Log the response to debug
      console.log('Raw refill requests data:', response);
      
      // Ensure we have an array
      const refillData = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.data || []);
      
      console.log('Processed refill data:', refillData);
      
      // For debugging: Log patient info from the first item
      if (refillData.length > 0) {
        console.log('First refill request patient:', refillData[0].patient);
      }
      
      setRefillRequests(refillData);
      setError(null);
    } catch (err) {
      console.error('Error fetching refill requests:', err);
      setError('Failed to fetch refill requests');
      setRefillRequests([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle approve refill request
  const handleApproveRequest = async (requestId) => {
    try {
      await pharmacyService.processRefillRequest(requestId, { status: 'Approved' });
      fetchRefillRequests(); // Refresh the list
      // Close the modal if it's the approved request
      if (selectedRefillRequest && selectedRefillRequest._id === requestId) {
        setSelectedRefillRequest(null);
      }
    } catch (err) {
      console.error('Error approving refill request:', err);
      setError('Failed to approve refill request');
    }
  };

  // Handle reject refill request
  const handleRejectRequest = async (requestId) => {
    try {
      await pharmacyService.processRefillRequest(requestId, { status: 'Rejected' });
      fetchRefillRequests(); // Refresh the list
      // Close the modal if it's the rejected request
      if (selectedRefillRequest && selectedRefillRequest._id === requestId) {
        setSelectedRefillRequest(null);
      }
    } catch (err) {
      console.error('Error rejecting refill request:', err);
      setError('Failed to reject refill request');
    }
  };

  // Get patient name function with fallback handling
  // Add this improved getPatientName function
const getPatientName = (request) => {
  // Try to get patient info from patient field
  if (request.patient) {
    if (typeof request.patient === 'object' && request.patient.name) {
      return request.patient.name;
    }
    if (typeof request.patient === 'string') {
      return 'Patient #' + request.patient.substring(0, 6);
    }
  }
  
  // If no patient, try to get from prescription
  if (request.prescription && request.prescription.patient) {
    if (typeof request.prescription.patient === 'object' && request.prescription.patient.name) {
      return request.prescription.patient.name;
    }
  }
  
  // Default fallback
  return 'Unknown Patient';
};
  // Filter refill requests
  const filteredRefillRequests = refillRequests.filter(request => {
    const matchesStatus = filterStatus === 'all' || request.status === filterStatus;
    
    // Use the getPatientName function for consistent display and searching
    const patientName = getPatientName(request);
    
    const matchesSearch = 
      searchTerm === '' ||
      patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (request.prescription?.medications?.[0]?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  if (isLoading) return <div className="p-4">Loading refill requests...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Refill Requests</h2>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search refill requests..."
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
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {/* Refill Requests List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredRefillRequests.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No refill requests found
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredRefillRequests.map((request) => (
              <div key={request._id} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center">
                      <h3 className="font-medium">
                        {getPatientName(request)}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {request.prescription?.medications?.[0]?.name || 'No Medication'}
                      {' '}on {new Date(request.requestDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`px-2 py-1 text-sm rounded-full ${
                      request.status === 'Approved' 
                        ? 'bg-green-100 text-green-800'
                        : request.status === 'Pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {request.status}
                    </span>
                    <div className="flex space-x-2">
                      {request.status === 'Pending' && (
                        <>
                          <button 
                            onClick={() => handleApproveRequest(request._id)}
                            className="text-green-600 hover:text-green-900"
                            title="Approve refill"
                          >
                            <Check size={20} />
                          </button>
                          <button 
                            onClick={() => handleRejectRequest(request._id)}
                            className="text-red-600 hover:text-red-900"
                            title="Reject refill"
                          >
                            <X size={20} />
                          </button>
                        </>
                      )}
                      <button 
                        onClick={() => setSelectedRefillRequest(request)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View details"
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

      {/* Refill Request Details Modal */}
      <RefillRequestModal 
        isOpen={selectedRefillRequest !== null}
        onClose={() => setSelectedRefillRequest(null)}
        refillRequest={selectedRefillRequest}
        onApprove={handleApproveRequest}
        onReject={handleRejectRequest}
      />
    </div>
  );
};

export default PharmacyRefills;