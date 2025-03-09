// PatientRegistration.jsx for Reception Portal
import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, X } from 'lucide-react';
import receptionService from '../../api/receptionService'; // You'll need to create this

const EnhancedPatientModal = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Default values for a new patient
    name: '',
    age: '',
    gender: '',
    dateOfBirth: '',
    contact: {
      phone: '',
      email: '',
      address: ''
    },
    emergencyContact: {
      name: '',
      relationship: '',
      phone: ''
    },
    insurance: {
      provider: '',
      policyNumber: '',
      groupNumber: '',
      policyHolder: ''
    },
    allergies: '',
    medications: '',
    medicalConditions: '',
    status: 'active'
  });

  // Initialize form with existing data if editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        age: initialData.age || '',
        gender: initialData.gender || '',
        dateOfBirth: initialData.dateOfBirth || '',
        contact: {
          phone: initialData.contact?.phone || '',
          email: initialData.contact?.email || '',
          address: initialData.contact?.address || ''
        },
        emergencyContact: {
          name: initialData.emergencyContact?.name || '',
          relationship: initialData.emergencyContact?.relationship || '',
          phone: initialData.emergencyContact?.phone || ''
        },
        insurance: {
          provider: initialData.insurance?.provider || '',
          policyNumber: initialData.insurance?.policyNumber || '',
          groupNumber: initialData.insurance?.groupNumber || '',
          policyHolder: initialData.insurance?.policyHolder || ''
        },
        allergies: initialData.allergies || '',
        medications: initialData.medications || '',
        medicalConditions: initialData.medicalConditions || '',
        status: initialData.status || 'active'
      });
    }
  }, [initialData]);
  // ...


  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onSubmit(formData);
      setFormData({
        name: '',
        age: '',
        gender: '',
        dateOfBirth: '',
        contact: {
          phone: '',
          email: '',
          address: ''
        },
        emergencyContact: {
          name: '',
          relationship: '',
          phone: ''
        },
        insurance: {
          provider: '',
          policyNumber: '',
          groupNumber: '',
          policyHolder: ''
        },
        allergies: '',
        medications: '',
        medicalConditions: '',
        status: 'active'
      });
      onClose();
    } catch (error) {
      console.error('Error submitting patient data:', error);
    }
  };

  // In the EnhancedPatientModal component
const nextStep = (e) => {
  // Prevent any form submission
  e.preventDefault(); 
  e.stopPropagation();
  // Just change the step
  setStep(step + 1);
};

const prevStep = (e) => {
  // Prevent any form submission
  e.preventDefault();
  e.stopPropagation();
  // Just change the step
  setStep(step - 1);
};

// In the JSX for step navigation buttons
{step < 4 ? (
  <button
    type="button" // Important: ensure this is type="button" not "submit"
    onClick={nextStep}
    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
  >
    Next
  </button>
) : (
  <button
    type="submit" // Only this button should be type="submit"
    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
  >
    Register Patient
  </button>
)};
  

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Complete Patient Registration</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="mb-6">
          <div className="flex justify-between">
            <div className={`text-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-100' : 'bg-gray-100'}`}>
                1
              </div>
              <p className="text-xs mt-1">Personal Info</p>
            </div>
            <div className={`text-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-100' : 'bg-gray-100'}`}>
                2
              </div>
              <p className="text-xs mt-1">Emergency Contact</p>
            </div>
            <div className={`text-center ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center ${step >= 3 ? 'bg-blue-100' : 'bg-gray-100'}`}>
                3
              </div>
              <p className="text-xs mt-1">Insurance</p>
            </div>
            <div className={`text-center ${step >= 4 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center ${step >= 4 ? 'bg-blue-100' : 'bg-gray-100'}`}>
                4
              </div>
              <p className="text-xs mt-1">Medical Info</p>
            </div>
          </div>
          <div className="w-full bg-gray-200 h-1 mt-2 rounded">
            <div 
              className="bg-blue-600 h-1 rounded" 
              style={{ width: `${(step / 4) * 100}%` }}
            ></div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Step 1: Personal Information */}
          {step === 1 && (
            <div className="space-y-4">
              <h4 className="font-medium text-lg">Personal Information</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="contact.phone"
                  value={formData.contact.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="contact.email"
                  value={formData.contact.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Home Address
                </label>
                <textarea
                  name="contact.address"
                  value={formData.contact.address}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows="2"
                  required
                />
              </div>
            </div>
          )}

          {/* Step 2: Emergency Contact */}
          {step === 2 && (
            <div className="space-y-4">
              <h4 className="font-medium text-lg">Emergency Contact</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Name
                </label>
                <input
                  type="text"
                  name="emergencyContact.name"
                  value={formData.emergencyContact.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Relationship
                </label>
                <input
                  type="text"
                  name="emergencyContact.relationship"
                  value={formData.emergencyContact.relationship}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="emergencyContact.phone"
                  value={formData.emergencyContact.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
            </div>
          )}

          {/* Step 3: Insurance Information */}
          {step === 3 && (
            <div className="space-y-4">
              <h4 className="font-medium text-lg">Insurance Information</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Insurance Provider
                </label>
                <input
                  type="text"
                  name="insurance.provider"
                  value={formData.insurance.provider}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Policy Number
                  </label>
                  <input
                    type="text"
                    name="insurance.policyNumber"
                    value={formData.insurance.policyNumber}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Group Number
                  </label>
                  <input
                    type="text"
                    name="insurance.groupNumber"
                    value={formData.insurance.groupNumber}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Policy Holder (if not self)
                </label>
                <input
                  type="text"
                  name="insurance.policyHolder"
                  value={formData.insurance.policyHolder}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          )}

          {/* Step 4: Medical Information */}
          {step === 4 && (
            <div className="space-y-4">
              <h4 className="font-medium text-lg">Medical Information</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Allergies
                </label>
                <textarea
                  name="allergies"
                  value={formData.allergies}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows="2"
                  placeholder="List any allergies or write 'None'"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Medications
                </label>
                <textarea
                  name="medications"
                  value={formData.medications}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows="2"
                  placeholder="List all current medications or write 'None'"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Medical Conditions
                </label>
                <textarea
                  name="medicalConditions"
                  value={formData.medicalConditions}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows="2"
                  placeholder="List any current or past medical conditions"
                />
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6 pt-4 border-t">
            {step > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Previous
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
            
            {step < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                Register Patient
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

// PatientRegistration.jsx - Updated with working search and action buttons

const PatientRegistration = () => {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPatients();
  }, []);

  // Add effect to filter patients when search or filter changes
  useEffect(() => {
    if (patients.length > 0) {
      const filtered = patients.filter(patient => {
        // Filter by search term
        const matchesSearch = searchTerm === '' || 
          (patient.name && patient.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (patient.contact?.phone && patient.contact.phone.includes(searchTerm)) ||
          (patient.contact?.email && patient.contact.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (patient._id && patient._id.toLowerCase().includes(searchTerm.toLowerCase()));
        
        // Filter by status
        const matchesStatus = filterStatus === '' || patient.status === filterStatus;
        
        return matchesSearch && matchesStatus;
      });
      
      setFilteredPatients(filtered);
    } else {
      setFilteredPatients([]);
    }
  }, [searchTerm, filterStatus, patients]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await receptionService.getAllPatients();
      setPatients(response.data || []);
      setFilteredPatients(response.data || []); // Initialize filtered patients
      setError(null);
    } catch (err) {
      console.error('Error fetching patients:', err);
      setError('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterPatient = async (patientData) => {
    try {
      console.log('SUBMITTING PATIENT DATA:', JSON.stringify(patientData, null, 2));
      
      const formattedData = {
        name: patientData.name,
        age: parseInt(patientData.age),
        gender: patientData.gender,
        dateOfBirth: patientData.dateOfBirth,
        contact: patientData.contact,
        emergencyContact: patientData.emergencyContact,
        insurance: patientData.insurance,
        medicalHistory: {
          allergies: patientData.allergies || 'None',
          medications: patientData.medications || 'None',
          conditions: patientData.medicalConditions || 'None'
        },
        status: patientData.status || 'active'
      };
      
      await receptionService.registerPatient(formattedData);
      fetchPatients();
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      alert('Failed to register patient');
      return false;
    }
  };

  const handleEditPatient = async (patientData) => {
    try {
      const formattedData = {
        name: patientData.name,
        age: parseInt(patientData.age),
        gender: patientData.gender,
        dateOfBirth: patientData.dateOfBirth,
        contact: patientData.contact,
        emergencyContact: patientData.emergencyContact,
        insurance: patientData.insurance,
        medicalHistory: {
          allergies: patientData.allergies || 'None',
          medications: patientData.medications || 'None',
          conditions: patientData.medicalConditions || 'None'
        },
        status: patientData.status || 'active'
      };

      await receptionService.updatePatient(editingPatient._id, formattedData);
      fetchPatients();
      return true;
    } catch (error) {
      console.error('Update error:', error);
      alert('Failed to update patient');
      return false;
    }
  };

  const handleDeletePatient = async (patientId) => {
    if (window.confirm('Are you sure you want to delete this patient? This action cannot be undone.')) {
      try {
        await receptionService.deletePatient(patientId);
        fetchPatients();
      } catch (error) {
        console.error('Delete error:', error);
        alert('Failed to delete patient');
      }
    }
  };

  const openEditModal = (patient) => {
    setEditingPatient({
      ...patient,
      allergies: patient.medicalHistory?.allergies || '',
      medications: patient.medicalHistory?.medications || '',
      medicalConditions: patient.medicalHistory?.conditions || ''
    });
    setShowEditModal(true);
  };

  if (loading) return <div className="p-4">Loading patients...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Patient Registration</h2>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          <Plus size={20} className="mr-2" />
          New Patient
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search patients by name, ID, or contact..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          onChange={(e) => setFilterStatus(e.target.value)}
          value={filterStatus}
        >
          <option value="">All Patients</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Results count */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {filteredPatients.length} of {patients.length} patients
      </div>

      {/* Patients Table with Horizontal Scroll */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Insurance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    {searchTerm || filterStatus 
                      ? "No patients match your search criteria" 
                      : "No patients found"}
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient) => (
                  <tr key={patient._id}>
                    <td className="px-6 py-4 whitespace-nowrap">{patient.name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{patient._id?.substring(0, 6) || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{patient.age || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>{patient.contact?.phone || 'N/A'}</div>
                      <div className="text-xs text-gray-500">{patient.contact?.email || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{patient.insurance?.provider || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-sm ${
                        patient.status === 'active' 
                          ? 'text-green-800 bg-green-100' 
                          : 'text-red-800 bg-red-100'
                        } rounded-full`}
                      >
                        {patient.status || 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => openEditModal(patient)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit patient"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeletePatient(patient._id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete patient"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Patient Modal */}
      <EnhancedPatientModal 
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleRegisterPatient}
      />

      {/* Edit Patient Modal */}
      {editingPatient && (
        <EnhancedPatientModal 
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingPatient(null);
          }}
          onSubmit={handleEditPatient}
          initialData={editingPatient}
        />
      )}
    </div>
  );
};

export default PatientRegistration;