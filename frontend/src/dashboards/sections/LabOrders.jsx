import React, { useState, useEffect } from 'react';
import { Plus, Search, X, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import doctorService from '../../api/doctorService';

// Lab Order Modal
const LabOrderModal = ({ isOpen, onClose, onSubmit, patients }) => {
  const [orderData, setOrderData] = useState({
    patientId: '',
    testType: '',
    priority: 'routine',
    notes: '',
    scheduledDate: new Date().toISOString().split('T')[0]
  });

  const testTypes = [
    'Complete Blood Count (CBC)',
    'Basic Metabolic Panel',
    'Comprehensive Metabolic Panel',
    'Lipid Panel',
    'Liver Function Tests',
    'Thyroid Function Tests',
    'Urinalysis',
    'HbA1c',
    'X-Ray',
    'MRI',
    'CT Scan',
    'Ultrasound'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(orderData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Order Lab Test</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Patient
            </label>
            <select
              value={orderData.patientId}
              onChange={(e) => setOrderData({...orderData, patientId: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Test Type
            </label>
            <select
              value={orderData.testType}
              onChange={(e) => setOrderData({...orderData, testType: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            >
              <option value="">Select Test Type</option>
              {testTypes.map((test, index) => (
                <option key={index} value={test}>
                  {test}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              value={orderData.priority}
              onChange={(e) => setOrderData({...orderData, priority: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="routine">Routine</option>
              <option value="urgent">Urgent</option>
              <option value="stat">STAT (Immediate)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Scheduled Date
            </label>
            <input
              type="date"
              value={orderData.scheduledDate}
              onChange={(e) => setOrderData({...orderData, scheduledDate: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Clinical Notes (Optional)
            </label>
            <textarea
              value={orderData.notes}
              onChange={(e) => setOrderData({...orderData, notes: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows="3"
              placeholder="Relevant clinical information, specific test parameters, etc."
            />
          </div>

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
              Submit Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Add this new component to your LabOrders.jsx file
const ViewLabOrderModal = ({ isOpen, onClose, order }) => {
  if (!isOpen || !order) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Lab Order Details</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Order Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Test Type</p>
                <p className="font-medium">{order.testType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    order.status === 'Completed' 
                      ? 'bg-green-100 text-green-800'
                      : order.status === 'Pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : order.status === 'In Progress'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Patient Information */}
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Patient Information</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p><span className="font-medium">Name:</span> {order.patient?.name || 'Unknown'}</p>
              {order.patient?.age && <p><span className="font-medium">Age:</span> {order.patient.age}</p>}
              {order.patient?.contact?.phone && (
                <p><span className="font-medium">Phone:</span> {order.patient.contact.phone}</p>
              )}
            </div>
          </div>

          {/* Order Details */}
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Order Details</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p><span className="font-medium">Scheduled Date:</span> {formatDate(order.scheduledDate)}</p>
              <p><span className="font-medium">Priority:</span> {order.priority || 'Routine'}</p>
              {order.notes && (
                <div className="mt-2">
                  <p className="font-medium">Clinical Notes:</p>
                  <p className="text-gray-700 mt-1">{order.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Test Results (if available) */}
          {order.results && order.status === 'Completed' && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Test Results</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                {order.results.value && (
                  <p><span className="font-medium">Result Value:</span> {order.results.value} {order.results.unit || ''}</p>
                )}
                {order.results.referenceRange && (
                  <p><span className="font-medium">Reference Range:</span> {order.results.referenceRange}</p>
                )}
                {order.results.interpretation && (
                  <p><span className="font-medium">Interpretation:</span> {order.results.interpretation}</p>
                )}
                {order.results.isCritical !== undefined && (
                  <p><span className="font-medium">Critical:</span> {order.results.isCritical ? 'Yes' : 'No'}</p>
                )}
                {order.results.notes && (
                  <div className="mt-2">
                    <p className="font-medium">Notes:</p>
                    <p className="text-gray-700 mt-1">{order.results.notes}</p>
                  </div>
                )}
                {order.results.date && (
                  <p className="mt-2 text-sm text-gray-500">
                    Results date: {formatDate(order.results.date)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
            {order.status === 'Completed' && (
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Print Results
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Lab Orders Component
const LabOrders = () => {
  const [labOrders, setLabOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewOrder, setViewOrder] = useState(null);

  // Fetch lab orders and patients
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const ordersResponse = await doctorService.getLabOrders();
        const patientsResponse = await doctorService.getPatients();
        
        setLabOrders(ordersResponse.data || []);
        setFilteredOrders(ordersResponse.data || []);
        setPatients(patientsResponse.data || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load lab orders');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter orders based on search term and status
  useEffect(() => {
    let result = labOrders;

    if (filterStatus !== 'all') {
      result = result.filter(order => order.status === filterStatus);
    }

    if (searchTerm) {
      result = result.filter(order => 
        order.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.testType.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredOrders(result);
  }, [filterStatus, searchTerm, labOrders]);

  // Handle creating new lab order
  const handleCreateOrder = async (orderData) => {
    try {
      const response = await doctorService.createLabOrder(orderData);
      
      // Add patient info to the new order for display purposes
      const patientInfo = patients.find(p => p._id === orderData.patientId);
      const newOrder = {
        ...response.data,
        patient: patientInfo
      };
      
      setLabOrders([...labOrders, newOrder]);
      setFilteredOrders([...filteredOrders, newOrder]);
      setIsOrderModalOpen(false);
    } catch (err) {
      console.error('Error creating lab order:', err);
      alert('Failed to create lab order');
    }
  };

  // Handle cancelling a lab order
  const handleCancelOrder = async (orderId) => {
    try {
      await doctorService.cancelLabOrder(orderId);
      
      // Update local state
      const updatedOrders = labOrders.map(order => 
        order._id === orderId ? {...order, status: 'Cancelled'} : order
      );
      
      setLabOrders(updatedOrders);
      setFilteredOrders(
        filteredOrders.map(order => 
          order._id === orderId ? {...order, status: 'Cancelled'} : order
        )
      );
    } catch (err) {
      console.error('Error cancelling lab order:', err);
      alert('Failed to cancel lab order');
    }
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    let color;
    let icon;
    
    switch(status) {
      case 'Pending':
        color = 'bg-yellow-100 text-yellow-800';
        icon = <Clock size={14} className="mr-1" />;
        break;
      case 'In Progress':
        color = 'bg-blue-100 text-blue-800';
        icon = <Clock size={14} className="mr-1" />;
        break;
      case 'Completed':
        color = 'bg-green-100 text-green-800';
        icon = <CheckCircle size={14} className="mr-1" />;
        break;
      case 'Cancelled':
        color = 'bg-red-100 text-red-800';
        icon = <X size={14} className="mr-1" />;
        break;
      case 'sample_collected':
        color = 'bg-purple-100 text-purple-800';
        icon = <CheckCircle size={14} className="mr-1" />;
        break;
      default:
        color = 'bg-gray-100 text-gray-800';
        icon = null;
    }
    
    return (
      <span className={`px-2 py-1 rounded-full flex items-center text-xs ${color}`}>
        {icon}
        {status === 'sample_collected' ? 'Sample Collected' : status}
      </span>
    );
  };

  // Priority badge component
  const PriorityBadge = ({ priority }) => {
    let color;
    let icon;
    
    switch(priority) {
      case 'urgent':
        color = 'bg-orange-100 text-orange-800';
        icon = <AlertTriangle size={14} className="mr-1" />;
        break;
      case 'stat':
        color = 'bg-red-100 text-red-800';
        icon = <AlertTriangle size={14} className="mr-1" />;
        break;
      default:
        color = 'bg-blue-100 text-blue-800';
        icon = null;
    }
    
    return (
      <span className={`px-2 py-1 rounded-full flex items-center text-xs ${color}`}>
        {icon}
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    );
  };

  if (isLoading) return <div className="p-4">Loading lab orders...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Lab Orders</h2>
        <button 
          onClick={() => setIsOrderModalOpen(true)}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          <Plus size={20} className="mr-2" />
          New Lab Order
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search patient or test type..."
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
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
          <option value="sample_collected">Sample Collected</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* Lab Orders List */}
<div className="bg-white rounded-lg shadow overflow-hidden">
  <table className="min-w-full divide-y divide-gray-200">
    <thead className="bg-gray-50">
      <tr>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Patient
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Test Type
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Status
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Priority
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Scheduled Date
        </th>
        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
          Actions
        </th>
      </tr>
    </thead>
    <tbody className="bg-white divide-y divide-gray-200">
      {filteredOrders.length > 0 ? (
        filteredOrders.map((order) => (
          <tr key={order._id} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              {order.patient?.name || 'Unknown Patient'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {order.testType}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <StatusBadge status={order.status} />
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <PriorityBadge priority={order.priority || 'routine'} />
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {new Date(order.scheduledDate).toLocaleDateString()}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              {order.status === 'Pending' && (
                <button
                  onClick={() => handleCancelOrder(order._id)}
                  className="text-red-600 hover:text-red-900 ml-2"
                >
                  Cancel
                </button>
              )}
              {order.results && order.status === 'Completed' && (
                <button
                  onClick={() => setViewOrder(order)}
                  className="text-green-600 hover:text-green-900 ml-2"
                >
                  View Results
                </button>
              )}
              <button
                onClick={() => setViewOrder(order)}
                className="text-blue-600 hover:text-blue-900 ml-2"
              >
                View
              </button>
            </td>
          </tr>
        ))
      ) : (
        <tr>
          <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
            No lab orders found
          </td>
        </tr>
      )}
    </tbody>
  </table>
</div>

      {/* Lab Order Modal */}
      <LabOrderModal 
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        onSubmit={handleCreateOrder}
        patients={patients}
      />

<ViewLabOrderModal 
    isOpen={viewOrder !== null}
    onClose={() => setViewOrder(null)}
    order={viewOrder}
  />

    </div>
  );
};

export default LabOrders;