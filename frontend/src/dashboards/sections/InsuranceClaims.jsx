import React, { useState, useEffect } from 'react';
import { FileText, Search, Plus, Eye, X } from 'lucide-react';
import billingService from '../../api/billingService';

// Insurance Claim Details Modal
const InsuranceClaimModal = ({ isOpen, onClose, claim }) => {
  if (!isOpen || !claim) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Insurance Claim Details</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Claim Header */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Claim #</p>
                <p className="font-medium">{claim.claimNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Provider</p>
                <p className="font-medium">{claim.provider}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Submission Date</p>
                <p className="font-medium">
                  {new Date(claim.submissionDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  claim.status === 'Approved' 
                    ? 'bg-green-100 text-green-800'
                    : claim.status === 'Rejected'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {claim.status}
                </span>
              </div>
            </div>
          </div>

          {/* Claim Details */}
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Claim Information</h4>
            <table className="min-w-full divide-y divide-gray-200">
              <tbody>
                <tr>
                  <td className="px-4 py-2 text-sm text-gray-600">Claim Amount</td>
                  <td className="px-4 py-2 text-sm font-medium">${claim.amount.toFixed(2)}</td>
                </tr>
                {claim.responseDate && (
                  <tr>
                    <td className="px-4 py-2 text-sm text-gray-600">Response Date</td>
                    <td className="px-4 py-2 text-sm">
                      {new Date(claim.responseDate).toLocaleDateString()}
                    </td>
                  </tr>
                )}
                {claim.notes && (
                  <tr>
                    <td className="px-4 py-2 text-sm text-gray-600">Notes</td>
                    <td className="px-4 py-2 text-sm">{claim.notes}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// New Insurance Claim Modal
const NewClaimModal = ({ isOpen, onClose, onSubmit, patients }) => {
  const [claimData, setClaimData] = useState({
    patient: '', // Change to patient name for direct selection
    provider: '',
    claimNumber: '',
    amount: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});

  // Validate form before submission
  const validateForm = () => {
    const newErrors = {};

    if (!claimData.patient) newErrors.patient = 'Patient is required';
    if (!claimData.provider) newErrors.provider = 'Insurance Provider is required';
    if (!claimData.claimNumber) newErrors.claimNumber = 'Claim Number is required';
    if (!claimData.amount || parseFloat(claimData.amount) <= 0) 
      newErrors.amount = 'Valid Claim Amount is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
  
    if (validateForm()) {
      onSubmit({
        patient: claimData.patient, // Pass patient name
        provider: claimData.provider,
        claimNumber: claimData.claimNumber,
        amount: claimData.amount,
        notes: claimData.notes
      });
    }
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setClaimData({
        patient: '',
        provider: '',
        claimNumber: '',
        amount: '',
        notes: ''
      });
      setErrors({});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Submit New Insurance Claim</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Patient Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Patient
            </label>
            <select
              value={claimData.patient}
              onChange={(e) => {
                setClaimData({...claimData, patient: e.target.value});
                if (errors.patient) {
                  setErrors(prev => {
                    const newErrors = {...prev};
                    delete newErrors.patient;
                    return newErrors;
                  });
                }
              }}
              className={`w-full px-3 py-2 border ${
                errors.patient 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-blue-500'
              } rounded-md`}
              required
            >
              <option value="">Select Patient</option>
              {patients.map(patient => (
                <option key={patient._id} value={patient.name}>
                  {patient.name}
                </option>
              ))}
            </select>
            {errors.patient && (
              <p className="text-red-500 text-xs mt-1">{errors.patient}</p>
            )}
          </div>

          {/* Insurance Provider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Insurance Provider
            </label>
            <input
              type="text"
              value={claimData.provider}
              onChange={(e) => {
                setClaimData({...claimData, provider: e.target.value});
                if (errors.provider) {
                  setErrors(prev => {
                    const newErrors = {...prev};
                    delete newErrors.provider;
                    return newErrors;
                  });
                }
              }}
              className={`w-full px-3 py-2 border ${
                errors.provider 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-blue-500'
              } rounded-md`}
              required
            />
            {errors.provider && (
              <p className="text-red-500 text-xs mt-1">{errors.provider}</p>
            )}
          </div>

          {/* Claim Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Claim Number
            </label>
            <input
              type="text"
              value={claimData.claimNumber}
              onChange={(e) => {
                setClaimData({...claimData, claimNumber: e.target.value});
                if (errors.claimNumber) {
                  setErrors(prev => {
                    const newErrors = {...prev};
                    delete newErrors.claimNumber;
                    return newErrors;
                  });
                }
              }}
              className={`w-full px-3 py-2 border ${
                errors.claimNumber 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-blue-500'
              } rounded-md`}
              required
            />
            {errors.claimNumber && (
              <p className="text-red-500 text-xs mt-1">{errors.claimNumber}</p>
            )}
          </div>

          {/* Claim Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Claim Amount
            </label>
            <input
              type="number"
              step="0.01"
              value={claimData.amount}
              onChange={(e) => {
                setClaimData({...claimData, amount: e.target.value});
                if (errors.amount) {
                  setErrors(prev => {
                    const newErrors = {...prev};
                    delete newErrors.amount;
                    return newErrors;
                  });
                }
              }}
              className={`w-full px-3 py-2 border ${
                errors.amount 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-blue-500'
              } rounded-md`}
              required
            />
            {errors.amount && (
              <p className="text-red-500 text-xs mt-1">{errors.amount}</p>
            )}
          </div>

          {/* Notes (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={claimData.notes}
              onChange={(e) => setClaimData({...claimData, notes: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows="3"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Submit Claim
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main Insurance Claims Component
const InsuranceClaims = () => {
  const [claims, setClaims] = useState([]);
  const [patients, setPatients] = useState([]);
  const [filteredClaims, setFilteredClaims] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [isNewClaimModalOpen, setIsNewClaimModalOpen] = useState(false);
  
  // Filtering States
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch Insurance Claims and Patients
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Fetch claims
        const claimsResponse = await billingService.getInsuranceClaims();
        const claimsData = claimsResponse.data || claimsResponse;
        setClaims(claimsData);
        setFilteredClaims(claimsData);
  
        // Fetch patients
        const patientsResponse = await billingService.getAllPatients();
        console.log('Fetched patients:', patientsResponse.data);
        setPatients(patientsResponse.data || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load insurance claims and patients');
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchData();
  }, []);
  // Filter claims when search or filter changes
  useEffect(() => {
    let result = claims;

    // Filter by status
    if (filterStatus !== 'all') {
      result = result.filter(claim => 
        claim.status.toLowerCase() === filterStatus.toLowerCase()
      );
    }

    // Search filter
    if (searchTerm) {
      result = result.filter(claim => 
        claim.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.claimNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredClaims(result);
  }, [filterStatus, searchTerm, claims]);

  // Submit new claim
  const handleSubmitClaim = async (claimData) => {
    try {
      console.log('Full claim data:', claimData);
      console.log('Available patients:', patients);
  
      // Find patient by exact name match
      const patient = patients.find(p => 
        p.name.toLowerCase() === claimData.patient.toLowerCase()
      );
  
      if (!patient) {
        console.error('Patient not found:', claimData.patient);
        alert('Patient not found. Please select a patient from the list.');
        return;
      }
  
      // Prepare submission data
      const submissionData = {
        patientId: patient._id,
        provider: claimData.provider,
        claimNumber: claimData.claimNumber,
        amount: parseFloat(claimData.amount),
        notes: claimData.notes
      };
  
      console.log('Submission data:', submissionData);
  
      const response = await billingService.submitInsuranceClaim(submissionData);
      
      // Update claims list
      setClaims(prevClaims => [...prevClaims, response.data]);
      setFilteredClaims(prevClaims => [...prevClaims, response.data]);
      
      // Close modal
      setIsNewClaimModalOpen(false);
    } catch (err) {
      console.error('Error submitting insurance claim:', err);
      alert('Failed to submit insurance claim');
    }
  };

  if (isLoading) return <div className="p-4">Loading insurance claims...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Insurance Claims</h2>
        <button 
          onClick={() => setIsNewClaimModalOpen(true)}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          <Plus size={20} className="mr-2" />
          New Claim
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search claims..."
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
          <option value="submitted">Submitted</option>
          <option value="processing">Processing</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="paid">Paid</option>
        </select>
      </div>

      {/* Claims List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Claim #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Provider
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Submission Date
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredClaims.length > 0 ? (
              filteredClaims.map((claim) => (
                <tr key={claim._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {claim.claimNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {claim.provider}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(claim.submissionDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                    ${claim.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                      claim.status === 'Approved' 
                        ? 'bg-green-100 text-green-800'
                        : claim.status === 'Rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {claim.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => setSelectedClaim(claim)}
                      className="text-blue-600 hover:text-blue-900 mr-2"
                      title="View Claim Details"
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  No insurance claims found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Insurance Claim Details Modal */}
      <InsuranceClaimModal 
        isOpen={selectedClaim !== null}
        onClose={() => setSelectedClaim(null)}
        claim={selectedClaim}
      />

      {/* New Insurance Claim Modal */}
      <NewClaimModal
        isOpen={isNewClaimModalOpen}
        onClose={() => setIsNewClaimModalOpen(false)}
        onSubmit={handleSubmitClaim}
        patients={patients}
      />
    </div>
  );
};

export default InsuranceClaims;