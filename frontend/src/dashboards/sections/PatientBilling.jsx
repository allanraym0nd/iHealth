import React, { useState } from 'react';
import { CreditCard, Download, DollarSign, Filter, Printer } from 'lucide-react';

// Payment Modal
const PaymentModal = ({ isOpen, onClose, invoice }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Make Payment</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">×</button>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium">Invoice #{invoice.number}</h4>
            <p className="text-2xl font-bold text-gray-800 mt-1">${invoice.amount}</p>
            <p className="text-sm text-gray-600">Due by {invoice.dueDate}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Payment Method</label>
            <select className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Credit Card</option>
              <option>Bank Transfer</option>
              <option>Insurance</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Card Number</label>
            <input
              type="text"
              placeholder="**** **** **** ****"
              className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
              <input
                type="text"
                placeholder="MM/YY"
                className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">CVV</label>
              <input
                type="text"
                placeholder="***"
                className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex space-x-2 pt-4">
            <button
              className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Pay ${invoice.amount}
            </button>
            <button
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PatientBilling = () => {
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  // Sample invoices data
  const invoices = [
    {
      id: 1,
      number: 'INV-2024-001',
      date: 'Jan 15, 2024',
      dueDate: 'Feb 15, 2024',
      amount: 150.00,
      description: 'General Checkup',
      status: 'pending'
    },
    // Add more sample invoices
  ];

  return (
    <div className="p-6">
      {/* Header with Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium">Outstanding Balance</h3>
          <p className="text-3xl font-bold text-gray-800">$350.00</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium">Last Payment</h3>
          <p className="text-3xl font-bold text-gray-800">$75.00</p>
          <p className="text-sm text-gray-500">Jan 10, 2024</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium">Insurance Coverage</h3>
          <p className="text-3xl font-bold text-gray-800">80%</p>
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
          {invoices.map((invoice) => (
            <div key={invoice.id} className="p-4">
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
                  <p className="text-sm text-gray-500">Due: {invoice.dueDate}</p>
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
          ))}
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal 
        isOpen={selectedInvoice !== null}
        onClose={() => setSelectedInvoice(null)}
        invoice={selectedInvoice}
      />
    </div>
  );
};

export default PatientBilling;