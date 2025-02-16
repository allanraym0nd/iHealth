
import React, { useState, useEffect } from 'react';
import { Plus, Search, Eye, Download } from 'lucide-react';
import doctorService from '../../api/doctorService';

const AddPrescriptionModal = ({ isOpen, onClose, onPrescriptionAdded }) => {
  const [formData, setFormData] = useState({
    patientId: '',
    medications: [{
      name: '',
      dosage: '',
      frequency: '',
      duration: ''
    }],
    notes: ''
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

  const handleMedicationChange = (index, field, value) => {
    const newMedications = [...formData.medications];
    newMedications[index][field] = value;
    setFormData({ ...formData, medications: newMedications });
  };

  const addMedication = () => {
    setFormData({
      ...formData,
      medications: [...formData.medications, { name: '', dosage: '', frequency: '', duration: '' }]
    });
  };

  const removeMedication = (index) => {
    if (formData.medications.length > 1) {
      const newMedications = formData.medications.filter((_, i) => i !== index);
      setFormData({ ...formData, medications: newMedications });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await doctorService.createPrescription(formData);
      onPrescriptionAdded();
      onClose();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create prescription');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Create Prescription</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">×</button>
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

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-medium">Medications</h4>
              <button
                type="button"
                onClick={addMedication}
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                + Add Medication
              </button>
            </div>

            {formData.medications.map((medication, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <h5 className="font-medium">Medication {index + 1}</h5>
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => removeMedication(index)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      value={medication.name}
                      onChange={(e) => handleMedicationChange(index, 'name', e.target.value)}
                      className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Dosage</label>
                    <input
                      type="text"
                      value={medication.dosage}
                      onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                      className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 500mg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Frequency</label>
                    <input
                      type="text"
                      value={medication.frequency}
                      onChange={(e) => handleMedicationChange(index, 'frequency', e.target.value)}
                      className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., twice daily"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Duration</label>
                    <input
                      type="text"
                      value={medication.duration}
                      onChange={(e) => handleMedicationChange(index, 'duration', e.target.value)}
                      className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 7 days"
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows="3"
              placeholder="Any additional instructions or notes"
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
              {loading ? 'Creating...' : 'Create Prescription'}
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

const Prescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const response = await doctorService.getPrescriptions();
      setPrescriptions(response.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching prescriptions:', err);
      setError('Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-4">Loading prescriptions...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Prescriptions</h2>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          <Plus size={20} className="mr-2" />
          New Prescription
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medications</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {prescriptions.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  No prescriptions found
                </td>
              </tr>
            ) : (
              prescriptions.map((prescription) => (
                <tr key={prescription._id}>
                  <td className="px-6 py-4 whitespace-nowrap">{prescription.patient?.name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(prescription.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    {prescription.medications.map((med, index) => (
                      <div key={index} className="text-sm">
                        {med.name} - {med.dosage} ({med.frequency})
                      </div>
                    ))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-sm rounded-full ${
                      prescription.status === 'active' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {prescription.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <Eye size={18} />
                      </button>
                      <button className="text-gray-600 hover:text-gray-900">
                        <Download size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AddPrescriptionModal 
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onPrescriptionAdded={fetchPrescriptions}
      />
    </div>
  );
};

export default Prescriptions;