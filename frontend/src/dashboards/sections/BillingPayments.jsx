import React, { useState, useEffect } from 'react';
import { Search, CreditCard, Eye, X, Filter } from 'lucide-react';
import billingService from '../../api/billingService';

// Payment Details Modal
const PaymentModal = ({ isOpen, onClose, payment }) => {
  if (!isOpen || !payment) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Payment Details</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Payment Information */}
          <div className="grid grid-cols-2 gap-4 border-b pb-4">
            <div>
              <label className="block text-sm font-medium text-gray-600">Patient Name</label>
              <p className="font-medium">{payment.patientName}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Payment Date</label>
              <p>{new Date(payment.date).toLocaleDateString()}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Amount</label>
              <p className="font-bold text-green-600">Ksh{payment.amount.toFixed(2)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Payment Method</label>
              <p>{payment.method}</p>
            </div>
          </div>

          {/* Invoice Related Information */}
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Invoice Details</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Invoice #{payment.invoiceId}</p>
                  <p className="text-sm text-gray-600">Total Invoice Amount: Ksh{payment.invoiceTotal?.toFixed(2) || 'N/A'}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  payment.status === 'completed' 
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {payment.status}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
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

const BillingPayments = () => {
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  
  // Filtering States
  const [filterMethod, setFilterMethod] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch Payments
  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setIsLoading(true);
        const response = await billingService.getPayments();
        const paymentsData = response.data || response;
        setPayments(paymentsData);
        setFilteredPayments(paymentsData);
      } catch (err) {
        console.error('Error fetching payments:', err);
        setError('Failed to load payments');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayments();
  }, []);

  // Filter payments when search or filter changes
  useEffect(() => {
    let result = payments;

    // Filter by payment method
    if (filterMethod !== 'all') {
      result = result.filter(payment => 
        payment.method.toLowerCase() === filterMethod.toLowerCase()
      );
    }

    // Search filter
    if (searchTerm) {
      result = result.filter(payment => 
        payment.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.invoiceId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredPayments(result);
  }, [filterMethod, searchTerm, payments]);

  if (isLoading) return <div className="p-4">Loading payments...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Payments</h2>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search payments..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filterMethod}
          onChange={(e) => setFilterMethod(e.target.value)}
        >
          <option value="all">All Methods</option>
          <option value="credit card">Credit Card</option>
          <option value="bank transfer">Bank Transfer</option>
          <option value="cash">Cash</option>
          <option value="insurance">Insurance</option>
        </select>
      </div>

      {/* Payments List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredPayments.length > 0 ? (
              filteredPayments.map((payment) => (
                <tr key={payment._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    PAY-{payment._id.toString().slice(-8)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {payment.patientName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(payment.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                    Ksh{payment.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {payment.method}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => setSelectedPayment(payment)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  No payments found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Payment Details Modal */}
      <PaymentModal 
        isOpen={selectedPayment !== null}
        onClose={() => setSelectedPayment(null)}
        payment={selectedPayment}
      />
    </div>
  );
};

export default BillingPayments;