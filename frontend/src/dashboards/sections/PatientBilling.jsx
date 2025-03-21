import React, { useState, useEffect } from 'react';
import { CreditCard, Download, DollarSign, Filter, Printer, X } from 'lucide-react';
import patientService from '../../api/patientService';

// Payment Modal with improved functionality
const PaymentModal = ({ isOpen, onClose, invoice, onPaymentComplete }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentData, setPaymentData] = useState({
    paymentMethod: 'credit',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cashReferenceNumber: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Ensure we're sending the complete payment amount
      await patientService.makePayment(invoice._id, {
        ...paymentData,
        amount: invoice.amount || invoice.totalAmount
      });
      onPaymentComplete();
      onClose();
    } catch (error) {
      setError(error.response?.data?.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !invoice) return null;

  // Correctly determine the invoice amount
  const invoiceAmount = invoice.amount || invoice.totalAmount || 0;

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
            <h4 className="font-medium">Invoice #{invoice.number || ('INV-' + (invoice._id?.substring(0, 8)))}</h4>
            <p className="text-2xl font-bold text-gray-800 mt-1">${invoiceAmount.toFixed(2)}</p>
            <p className="text-sm text-gray-600">Due by {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Payment Method</label>
            <select 
              className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={paymentData.paymentMethod}
              onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
            >
              <option value="credit">Credit Card</option>
              <option value="cash">Cash</option>
              
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

          {paymentData.paymentMethod === 'cash' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Cash Reference Number (Optional)</label>
              <input
                type="text"
                placeholder="Reference #"
                className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={paymentData.cashReferenceNumber}
                onChange={(e) => setPaymentData({ ...paymentData, cashReferenceNumber: e.target.value })}
              />
              <p className="mt-1 text-sm text-gray-500">You can pay cash at the reception desk.</p>
            </div>
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
              {loading ? 'Processing...' : `Pay $${invoiceAmount.toFixed(2)}`}
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

// Fix Download function to handle cases when properties might be undefined
const handleDownloadInvoice = (invoice) => {
  try {
    // Determine the proper invoice number format
    const invoiceNumber = invoice.number || ('INV-' + (invoice._id?.substring(0, 8))) || 'N/A';
    // Get the correct amount
    const invoiceAmount = invoice.amount || invoice.totalAmount || 0;
    
    const invoiceContent = `
INVOICE

Invoice #: ${invoiceNumber}
Date: ${(invoice.date || invoice.createdAt) ? new Date(invoice.date || invoice.createdAt).toLocaleDateString() : 'N/A'}
Due Date: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}
-----------------------------------------

Patient: ${invoice.patientName || "Patient"}
Status: ${invoice.status || 'N/A'}

ITEMS:
${invoice.items ? invoice.items.map(item => 
  `${item.service || 'Service'} - ${item.description || 'N/A'}: $${item.amount ? item.amount.toFixed(2) : '0.00'}`
).join('\n') : invoice.description + `: $${invoiceAmount.toFixed(2)}`}

-----------------------------------------
TOTAL: $${invoiceAmount.toFixed(2)}

Thank you for your business!
`;

    const blob = new Blob([invoiceContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice-${invoiceNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading invoice:', error);
    alert('Failed to download invoice');
  }
};

// Fix Print function to handle undefined values
const handlePrintInvoice = (invoice) => {
  try {
    // Determine the proper invoice number format
    const invoiceNumber = invoice.number || ('INV-' + (invoice._id?.substring(0, 8))) || 'N/A';
    // Get the correct amount
    const invoiceAmount = invoice.amount || invoice.totalAmount || 0;
    
    const printWindow = window.open('', '_blank');
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          .invoice-header { margin-bottom: 20px; }
          .invoice-title { font-size: 24px; font-weight: bold; }
          .invoice-details { display: flex; justify-content: space-between; margin-bottom: 20px; }
          .invoice-details div { flex: 1; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background-color: #f2f2f2; }
          .total-row { font-weight: bold; }
          .footer { margin-top: 40px; text-align: center; color: #666; }
          @media print {
            body { padding: 0; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-header">
          <div class="invoice-title">INVOICE</div>
          <p>Invoice #: ${invoiceNumber}</p>
          <p>Date: ${(invoice.date || invoice.createdAt) ? new Date(invoice.date || invoice.createdAt).toLocaleDateString() : 'N/A'}</p>
          <p>Due Date: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}</p>
        </div>
        
        <div class="invoice-details">
          <div>
            <strong>Patient:</strong>
            <p>${invoice.patientName || "Patient"}</p>
          </div>
          <div>
            <strong>Status:</strong>
            <p>${invoice.status || 'N/A'}</p>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Service</th>
              <th>Description</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items ? invoice.items.map(item => `
              <tr>
                <td>${item.service || 'Service'}</td>
                <td>${item.description || 'N/A'}</td>
                <td style="text-align: right;">$${item.amount ? item.amount.toFixed(2) : '0.00'}</td>
              </tr>
            `).join('') : `
              <tr>
                <td colspan="2">${invoice.description || 'Medical Service'}</td>
                <td style="text-align: right;">$${invoiceAmount.toFixed(2)}</td>
              </tr>
            `}
            <tr class="total-row">
              <td colspan="2" style="text-align: right;">Total</td>
              <td style="text-align: right;">$${invoiceAmount.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
        
        <div class="footer">
          <p>Thank you for your business!</p>
        </div>
        
        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  } catch (error) {
    console.error('Error printing invoice:', error);
    alert('Failed to print invoice');
  }
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
      console.log('Billing data:', response); // Debug
      
      // Ensure we have valid invoice data with proper status values
      const invoicesData = response.data?.invoices || [];
      
      // Normalize invoice status values to lowercase for consistent comparison
      const normalizedInvoices = invoicesData.map(invoice => ({
        ...invoice,
        // Make sure status exists and is normalized to lowercase
        status: (invoice.status || 'pending').toLowerCase(),
        // Ensure amount is set correctly
        amount: invoice.amount || invoice.totalAmount || 0,
        // Set proper invoice number format
        number: invoice.number || ('INV-' + (invoice._id?.substring(0, 8)))
      }));
      
      setInvoices(normalizedInvoices);
      
      // Safely set summary data with fallbacks
      setSummaryData({
        outstandingBalance: response.data?.outstandingBalance || 0,
        lastPayment: response.data?.lastPayment || { amount: 0, date: null },
        insuranceCoverage: response.data?.insuranceCoverage || 0
      });
      
      setError(null);
    } catch (err) {
      console.error('Error fetching billing data:', err);
      setError('Failed to load billing data');
    } finally {
      setLoading(false);
    }
  };

  // Improved filtering logic
  const filteredInvoices = invoices.filter(invoice => {
    if (filterStatus === 'all') return true;
    return invoice.status.toLowerCase() === filterStatus.toLowerCase();
  });

  if (loading) return <div className="p-4">Loading billing data...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-6">
      {/* Header with Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium">Outstanding Balance</h3>
          <p className="text-3xl font-bold text-gray-800">
            ${summaryData.outstandingBalance !== undefined ? summaryData.outstandingBalance.toFixed(2) : '0.00'}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium">Last Payment</h3>
          <p className="text-3xl font-bold text-gray-800">${summaryData.lastPayment?.amount ? summaryData.lastPayment.amount.toFixed(2) : '0.00'}</p>
          {summaryData.lastPayment?.date && (
            <p className="text-sm text-gray-500">
              {new Date(summaryData.lastPayment.date).toLocaleDateString()}
            </p>
          )}
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium">Insurance Coverage</h3>
          <p className="text-3xl font-bold text-gray-800">
            {summaryData.insuranceCoverage !== undefined ? summaryData.insuranceCoverage : 0}%
          </p>
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
              {filterStatus !== 'all' 
                ? `No ${filterStatus} invoices found` 
                : "No invoices found"}
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
                        {invoice.status ? invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1) : 'Unknown'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{invoice.description || 'Medical services'}</p>
                    <p className="text-sm text-gray-500">
                      Due: {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <p className="text-xl font-bold">${invoice.amount.toFixed(2)}</p>
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
                      <button 
                        onClick={() => handleDownloadInvoice(invoice)}
                        className="text-gray-600 hover:text-gray-900"
                        title="Download invoice"
                      >
                        <Download size={20} />
                      </button>
                      <button 
                        onClick={() => handlePrintInvoice(invoice)}
                        className="text-gray-600 hover:text-gray-900"
                        title="Print invoice"
                      >
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