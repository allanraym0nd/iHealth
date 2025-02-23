import React, { useState, useEffect } from 'react';
import { Plus, Search, Calendar, AlertCircle } from 'lucide-react';
import labService from '../../api/labService';

const CreateTestOrderModal = ({ isOpen, onClose, onTestOrderCreated }) => {
  const [formData, setFormData] = useState({
    patient: '',
    doctor: '',
    testType: '',
    scheduledDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    if (isOpen) {
      fetchDoctorsAndPatients();
    }
  }, [isOpen]);

  const fetchDoctorsAndPatients = async () => {
    try {
      // You'll need to add these methods to your service
      const [patientsRes, doctorsRes] = await Promise.all([
        labService.getPatients(),
        labService.getDoctors()
      ]);
      setPatients(patientsRes.data || []);
      setDoctors(doctorsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
  
    console.log('Sending test order data:', {
      patient: formData.patient,
      doctor: formData.doctor,
      testType: formData.testType,
      scheduledDate: formData.scheduledDate
    });
  
    try {
      const response = await labService.createTestOrder({
        patient: formData.patient,
        doctor: formData.doctor,
        testType: formData.testType,
        scheduledDate: formData.scheduledDate
      });
      onTestOrderCreated();
      onClose();
    } catch (error) {
      console.error('Full error details:', error);
      setError(error.response?.data?.message || 'Failed to create test order');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Create Test Order</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Patient</label>
            <select
              className="mt-1 w-full p-2 border rounded-lg"
              value={formData.patient}
              onChange={(e) => setFormData({ ...formData, patient: e.target.value })}
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
            <label className="block text-sm font-medium text-gray-700">Doctor</label>
            <select
              className="mt-1 w-full p-2 border rounded-lg"
              value={formData.doctor}
              onChange={(e) => setFormData({ ...formData, doctor: e.target.value })}
              required
            >
              <option value="">Select Doctor</option>
              {doctors.map(doctor => (
                <option key={doctor._id} value={doctor._id}>
                  Dr. {doctor.name}
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
              <option value="X-Ray">X-Ray</option>
              <option value="MRI">MRI</option>
              <option value="CT Scan">CT Scan</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Scheduled Date</label>
            <input
              type="datetime-local"
              className="mt-1 w-full p-2 border rounded-lg"
              value={formData.scheduledDate}
              onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
              required
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
              {loading ? 'Creating...' : 'Create Test Order'}
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

const TestOrders = () => {
  const [testOrders, setTestOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchTestOrders();
  }, []);

  const fetchTestOrders = async () => {
    try {
      setLoading(true);
      const response = await labService.getTestOrders();
      setTestOrders(response.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching test orders:', err);
      setError('Failed to load test orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await labService.updateTestStatus(orderId, newStatus);
      fetchTestOrders();
    } catch (error) {
      console.error('Error updating test status:', error);
    }
  };

  const filteredOrders = testOrders.filter(order => {
    if (filterStatus === 'all') return true;
    return order.status === filterStatus;
  });

  if (loading) return <div className="p-4">Loading test orders...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Test Orders</h2>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          <Plus size={20} className="mr-2" />
          New Test Order
        </button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search test orders..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>
        <select 
          className="px-4 py-2 border rounded-lg"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Test Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doctor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scheduled Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredOrders.map((order) => (
              <tr key={order._id}>
                <td className="px-6 py-4 whitespace-nowrap">{order.patient?.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{order.testType}</td>
                <td className="px-6 py-4 whitespace-nowrap">Dr. {order.doctor?.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {new Date(order.scheduledDate).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    order.status === 'Pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : order.status === 'In Progress'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    className="px-2 py-1 border rounded"
                    value={order.status}
                    onChange={(e) => handleStatusChange(order._id, e.target.value)}
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CreateTestOrderModal 
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onTestOrderCreated={fetchTestOrders}
      />
    </div>
  );
};

export default TestOrders;