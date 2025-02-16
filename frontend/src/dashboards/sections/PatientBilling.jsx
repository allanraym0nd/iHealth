import React, { useState, useEffect } from 'react';
import { CreditCard, Download, DollarSign, Filter, Printer, X } from 'lucide-react';
import patientService from '../../api/patientService';

// Payment Modal
const PaymentModal = ({ isOpen, onClose, invoice, onPaymentComplete }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentData, setPaymentData] = useState({
    paymentMethod: 'credit',
    cardNumber: '',
    expiryDate: '',
    cvv: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await patientService.makePayment(invoice._id, paymentData);
      onPaymentComplete();
      onClose();
    } catch (error) {
      setError(error.response?.data?.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !invoice) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Make Payment</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium">Invoice #{invoice.number}</h4>
            <p className="text-2xl font-bold text-gray-800 mt-1">${invoice.amount}</p>
            <p className="text-sm text-gray-600">Due by {new Date(invoice.dueDate).toLocaleDateString()}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Payment Method</label>
            <select 
              className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={paymentData.paymentMethod}
              onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
            >
              <option value="credit">Credit Card</option>
              <option value="bank">Bank Transfer</option>
              <option value="insurance">Insurance</option>
            </select>
          </div>

          {paymentData.paymentMethod === 'credit' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">Card Number</label>
                <input
                  type="text"
                  placeholder="**** **** **** ****"
                  className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={paymentData.cardNumber}
                  onChange={(e) => setPaymentData({ ...paymentData, cardNumber: e.target.value })}
                  maxLength="16"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={paymentData.expiryDate}
                    onChange={(e) => setPaymentData({ ...paymentData, expiryDate: e.target.value })}
                    maxLength="5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">CVV</label>
                  <input
                    type="password"
                    placeholder="***"
                    className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={paymentData.cvv}
                    onChange={(e) => setPaymentData({ ...paymentData, cvv: e.target.value })}
                    maxLength="3"
                  />
                </div>
              </div>
            </>
          )}

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
              {loading ? 'Processing...' : `Pay $${invoice.amount}`}
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

const PatientBilling = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [summaryData, setSummaryData] = useState({
    outstandingBalance: 0,
    lastPayment: { amount: 0, date: null },
    insuranceCoverage: 0
  });

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      const response = await patientService.getBillingData();
      setInvoices(response.data.invoices || []);
      setSummaryData({
        outstandingBalance: response.data.outstandingBalance || 0,
        lastPayment: response.data.lastPayment || { amount: 0, date: null },
        insuranceCoverage: response.data.insuranceCoverage || 0
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching billing data:', err);
      setError('Failed to load billing data');
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    if (filterStatus === 'all') return true;
    return invoice.status === filterStatus;
  });

  if (loading) return <div className="p-4">Loading billing data...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-6">
      {/* Header with Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium">Outstanding Balance</h3>
          <p className="text-3xl font-bold text-gray-800">${summaryData.outstandingBalance}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium">Last Payment</h3>
          <p className="text-3xl font-bold text-gray-800">${summaryData.lastPayment.amount}</p>
          {summaryData.lastPayment.date && (
            <p className="text-sm text-gray-500">
              {new Date(summaryData.lastPayment.date).toLocaleDateString()}
            </p>
          )}
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium">Insurance Coverage</h3>
          <p className="text-3xl font-bold text-gray-800">{summaryData.insuranceCoverage}%</p>
        </div>
      </div>

      {/* Invoices Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">Invoices & Payments</h2>
            <select 
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Invoices</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredInvoices.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No invoices found
            </div>
          ) : (
            filteredInvoices.map((invoice) => (
              <div key={invoice._id} className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center">
                      <h3 className="font-medium">Invoice #{invoice.number}</h3>
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                        invoice.status === 'paid' 
                          ? 'bg-green-100 text-green-800'
                          : invoice.status === 'overdue'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{invoice.description}</p>
                    <p className="text-sm text-gray-500">
                      Due: {new Date(invoice.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <p className="text-xl font-bold">${invoice.amount}</p>
                    <div className="flex space-x-2">
                      {invoice.status !== 'paid' && (
                        <button
                          onClick={() => setSelectedInvoice(invoice)}
                          className="flex items-center px-3 py-1 text-white bg-blue-500 rounded-lg hover:bg-blue-600"
                        >
                          <CreditCard size={16} className="mr-1" />
                          Pay
                        </button>
                      )}
                      <button className="text-gray-600 hover:text-gray-900">
                        <Download size={20} />
                      </button>
                      <button className="text-gray-600 hover:text-gray-900">
                        <Printer size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal 
        isOpen={selectedInvoice !== null}
        onClose={() => setSelectedInvoice(null)}
        invoice={selectedInvoice}
        onPaymentComplete={fetchBillingData}
      />
    </div>
  );
};

export default PatientBilling;