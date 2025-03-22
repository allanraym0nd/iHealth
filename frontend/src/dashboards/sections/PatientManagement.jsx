import React, { useState, useEffect } from 'react';
import { Search, Plus } from 'lucide-react';
import doctorService from '../../api/doctorService';

const AddPatientModal = ({ isOpen, onClose, onPatientAdded }) => {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    contact: {
      phone: '',
      email: ''
    },
    status: 'active'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
    setLoading(true);
    setError(null);

    try {
      await doctorService.createPatient(formData);
      setFormData({
        name: '',
        age: '',
        contact: {
          phone: '',
          email: ''
        },
        status: 'active'
      });
      if (onPatientAdded) {
        onPatientAdded();
      }
      onClose();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to add patient');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-white rounded-lg p-6 w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Add New Patient</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Age</label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input
              type="tel"
              name="contact.phone"
              value={formData.contact.phone}
              onChange={handleChange}
              className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="contact.email"
              value={formData.contact.email}
              onChange={handleChange}
              className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
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
              {loading ? 'Adding...' : 'Add Patient'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const PatientManagement = () => {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPatients();
  }, []);

  // Filter patients when search term or status filter changes
  useEffect(() => {
    if (patients.length > 0) {
      setIsFiltering(true);
      
      // Use a small timeout to avoid flickering for fast filters
      const filterTimer = setTimeout(() => {
        const filtered = patients.filter(patient => {
          // Filter by search term
          const matchesSearch = searchTerm === '' || 
            (patient.name && patient.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (patient.contact?.phone && patient.contact.phone.includes(searchTerm)) ||
            (patient.contact?.email && patient.contact.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (patient.age && patient.age.toString().includes(searchTerm));
          
          // Filter by status
          const matchesStatus = filterStatus === '' || patient.status === filterStatus;
          
          return matchesSearch && matchesStatus;
        });
        
        setFilteredPatients(filtered);
        setIsFiltering(false);
      }, 200);
      
      return () => clearTimeout(filterTimer);
    } else {
      setFilteredPatients([]);
    }
  }, [searchTerm, filterStatus, patients]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await doctorService.getPatients();
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

  if (loading) return <div className="p-4">Loading patients...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Patient Management</h2>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          <Plus size={20} className="mr-2" />
          Add Patient
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search patients..."
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

      {/* Filtering indicator */}
      {isFiltering && (
        <div className="text-center py-2 mb-4">
          <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-blue-500 border-r-transparent"></div>
          <span className="ml-2 text-sm text-gray-600">Filtering...</span>
        </div>
      )}

      {/* Results counter */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {filteredPatients.length} of {patients.length} patients
      </div>

      {/* Patients Table - Removed Last Visit and Actions columns */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredPatients.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  {searchTerm || filterStatus ? "No patients match your search criteria" : "No patients found"}
                </td>
              </tr>
            ) : (
              filteredPatients.map((patient) => (
                <tr key={patient._id}>
                  <td className="px-6 py-4 whitespace-nowrap">{patient.name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{patient._id?.substring(0, 6) || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{patient.age || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{patient.contact?.phone || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-sm rounded-full ${
                      patient.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {patient.status || 'Active'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AddPatientModal 
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onPatientAdded={fetchPatients}
      />
    </div>
  );
};

export default PatientManagement;