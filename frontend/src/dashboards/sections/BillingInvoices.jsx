import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Download, Printer, Eye, X } from 'lucide-react';
import billingService from '../../api/billingService';
import doctorService from '../../api/doctorService';

// New Invoice Modal Component
const CreateInvoiceModal = ({ isOpen, onClose, onCreateSuccess }) => {
 const [patients, setPatients] = useState([]);
 const [loading, setLoading] = useState(false);
 const [formData, setFormData] = useState({
   patientId: '',
   items: [{ service: '', description: '', amount: 0 }],
   totalAmount: 0
 });

 // Fetch patients on modal open
useEffect(() => {
  if (isOpen) {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        console.log('Fetching all patients for billing...');
        
        // Use the billing service instead of doctor service
        const response = await billingService.getAllPatients();
        console.log('All patients response:', response);
        
        let patientsList = [];
        if (response && response.data) {
          patientsList = response.data;
        } else if (response) {
          patientsList = response;
        }
        
        console.log('Patients list for billing:', patientsList);
        setPatients(patientsList || []);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching patients for billing:', error);
        setLoading(false);
      }
    };
    
    fetchPatients();
  }
}, [isOpen]);
 // Calculate total when items change
 useEffect(() => {
   const total = formData.items.reduce((sum, item) => sum + Number(item.amount), 0);
   setFormData(prev => ({ ...prev, totalAmount: total }));
 }, [formData.items]);

 // Add new item field
 const addItem = () => {
   setFormData({
     ...formData,
     items: [...formData.items, { service: '', description: '', amount: 0 }]
   });
 };

 // Remove item field
 const removeItem = (index) => {
   const newItems = [...formData.items];
   newItems.splice(index, 1);
   setFormData({
     ...formData,
     items: newItems
   });
 };

 // Update item field
 const updateItem = (index, field, value) => {
   const newItems = [...formData.items];
   newItems[index][field] = field === 'amount' ? Number(value) : value;
   setFormData({
     ...formData,
     items: newItems
   });
 };

 // Submit form
 const handleSubmit = async (e) => {
   e.preventDefault();
   setLoading(true);
   
   try {
     await billingService.createInvoice(formData.patientId, {
       items: formData.items,
       totalAmount: formData.totalAmount
     });
     
     onCreateSuccess();
     onClose();
   } catch (error) {
     console.error('Error creating invoice:', error);
     alert('Failed to create invoice');
   } finally {
     setLoading(false);
   }
 };

 if (!isOpen) return null;

 return (
   <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
     <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
       <div className="flex justify-between items-center mb-4">
         <h3 className="text-xl font-bold">Create New Invoice</h3>
         <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
           <X size={20} />
         </button>
       </div>

       <form onSubmit={handleSubmit} className="space-y-6">
         {/* Patient Selection */}
         <div>
           <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
           <select 
             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
             value={formData.patientId}
             onChange={(e) => setFormData({...formData, patientId: e.target.value})}
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

         {/* Invoice Items */}
         <div>
           <div className="flex justify-between items-center mb-2">
             <h4 className="font-medium text-gray-700">Invoice Items</h4>
             <button 
               type="button"
               onClick={addItem}
               className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
             >
               <Plus size={16} className="mr-1" /> Add Item
             </button>
           </div>
           
           {formData.items.map((item, index) => (
             <div key={index} className="bg-gray-50 p-4 rounded-lg mb-3">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
                   <input
                     type="text"
                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                     value={item.service}
                     onChange={(e) => updateItem(index, 'service', e.target.value)}
                     required
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                   <input
                     type="text"
                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                     value={item.description}
                     onChange={(e) => updateItem(index, 'description', e.target.value)}
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
                   <input
                     type="number"
                     step="0.01"
                     min="0"
                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                     value={item.amount}
                     onChange={(e) => updateItem(index, 'amount', e.target.value)}
                     required
                   />
                 </div>
               </div>
               {formData.items.length > 1 && (
                 <div className="mt-2 text-right">
                   <button
                     type="button"
                     onClick={() => removeItem(index)}
                     className="text-red-600 hover:text-red-800 text-sm"
                   >
                     Remove
                   </button>
                 </div>
               )}
             </div>
           ))}
           
           <div className="bg-gray-100 p-3 rounded-lg mt-2">
             <div className="flex justify-between items-center">
               <span className="font-medium">Total Amount:</span>
               <span className="font-bold">${formData.totalAmount.toFixed(2)}</span>
             </div>
           </div>
         </div>

         {/* Submit Button */}
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
             disabled={loading}
             className={`px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
           >
             {loading ? 'Creating...' : 'Create Invoice'}
           </button>
         </div>
       </form>
     </div>
   </div>
 );
};

// Invoice Modal Component
// Invoice Modal Component with M-Pesa integration
const InvoiceModal = ({ isOpen, onClose, invoice, onDownload, onPrint }) => {
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  
  // For M-Pesa payment
  const [phoneNumber, setPhoneNumber] = useState('');
  const [checkingStatus, setCheckingStatus] = useState(false);

  if (!isOpen || !invoice) return null;

  // Validate Kenyan phone number
  const validatePhoneNumber = (number) => {
    // Allow formats: 07XXXXXXXX, 01XXXXXXXX, 254XXXXXXXXX
    const regex = /^(07|01|254)\d{8,9}$/;
    return regex.test(number.replace(/\s/g, ''));
  };

  // Format phone number to international format
  const formatPhoneNumber = (number) => {
    const cleaned = number.replace(/\s/g, '');
    // If starts with 0, replace with 254
    if (cleaned.startsWith('0')) {
      return '254' + cleaned.substring(1);
    }
    return cleaned;
  };

  // In the InvoiceModal component
  const handleProcessPayment = async () => {
    try {
        setProcessingPayment(true);
        console.log("Processing payment for Invoice ID:", invoice._id);
        let transactionId = null;

        if (paymentMethod === 'M-Pesa') {
            if (!phoneNumber || !validatePhoneNumber(phoneNumber)) {
                throw new Error('Please enter a valid Kenyan phone number');
            }
            
            console.log("Sending M-Pesa payment request with Invoice ID:", invoice._id);
            const paymentResponse = await billingService.processMpesaPayment(invoice._id, {
                phoneNumber: formatPhoneNumber(phoneNumber),
                amount: invoice.totalAmount
            });
            
            // Store the transaction ID if returned from the API
            transactionId = paymentResponse.transactionId;
            console.log("M-Pesa transaction initiated with ID:", transactionId);

            setCheckingStatus(true);
            
            // Start polling for status updates
            const statusCheckInterval = setInterval(async () => {
                try {
                    console.log("Checking payment status for invoice:", invoice._id);
                    const statusResponse = await billingService.checkPaymentStatus(invoice._id);
                    
                    const currentStatus = statusResponse.status.toLowerCase();
                    console.log("Current payment status:", currentStatus);
                    
                    if (currentStatus === 'paid') {
                        clearInterval(statusCheckInterval);
                        setCheckingStatus(false);
                        setPaymentSuccess(true);
                        
                        setTimeout(() => {
                            onClose();
                            window.location.reload();
                        }, 2000);
                    }
                } catch (statusError) {
                    console.error('Error checking payment status:', statusError);
                }
            }, 5000);
            
            // Set timeout for payment verification
            setTimeout(() => {
                clearInterval(statusCheckInterval);
                setCheckingStatus(false);
                
                // If we have a transaction ID, try direct status check with Safaricom
                if (transactionId) {
                    setPaymentError('Payment verification in progress. Checking directly with M-Pesa...');
                    
                    // Direct check with Safaricom
                    billingService.checkMpesaTransactionStatus(transactionId)
                        .then(result => {
                            if (result.status === 'success') {
                                setPaymentSuccess(true);
                                setTimeout(() => {
                                    onClose();
                                    window.location.reload();
                                }, 2000);
                            } else {
                                setPaymentError(`Payment verification failed: ${result.message}. Please try again.`);
                            }
                        })
                        .catch(err => {
                            console.error('Direct status check failed:', err);
                            setPaymentError('Payment verification timed out. Please check if payment was completed and refresh the page.');
                        })
                        .finally(() => {
                            setProcessingPayment(false);
                        });
                } else {
                    setPaymentError('Payment verification timed out. Please check if payment was completed and refresh the page.');
                    setProcessingPayment(false);
                }
            }, 60000);
        } else {
            await billingService.processPayment(invoice._id, { 
                paymentMethod: paymentMethod,
                totalAmount: invoice.totalAmount
            });

            setPaymentSuccess(true);
            setTimeout(() => {
                onClose();
                window.location.reload(); 
            }, 2000);
        }
    } catch (error) {
        console.error('Error processing payment:', error);
        setPaymentError(error.message || 'Failed to process payment. Please try again.');
        setProcessingPayment(false);
        setCheckingStatus(false);
    }
};
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Invoice Details</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Invoice Header */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Invoice #</p>
                <p className="font-medium">INV-{invoice._id.toString().slice(-8)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-medium">{invoice.date ? new Date(invoice.date).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Patient</p>
                <p className="font-medium">{invoice.patientName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  invoice.status.toLowerCase() === 'paid' 
                    ? 'bg-green-100 text-green-800'
                    : invoice.status.toLowerCase() === 'overdue'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {invoice.status}
                </span>
              </div>
            </div>
          </div>

          {/* Invoice Items */}
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Invoice Items</h4>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoice.items && invoice.items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 text-sm text-gray-900">{item.service}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">{item.description}</td>
                    <td className="px-4 py-2 text-sm text-gray-900 text-right">${item.amount.toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="bg-gray-50">
                  <td colSpan="2" className="px-4 py-2 text-sm font-medium text-right">Total</td>
                  <td className="px-4 py-2 text-sm font-bold text-right">${invoice.totalAmount.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Payment Processing Section - only for pending invoices */}
          {invoice.status.toLowerCase() === 'pending' && (
            <div className="mt-4 border-t pt-4">
              <h4 className="text-lg font-semibold mb-2">Process Payment</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    disabled={processingPayment || checkingStatus}
                  >
                    <option value="Credit Card">Credit Card</option>
                    <option value="Cash">Cash</option>
                    <option value="M-Pesa">M-Pesa</option>
                  </select>
                </div>

                {/* M-Pesa phone number input */}
                {paymentMethod === 'M-Pesa' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number (format: 07XXXXXXXX or 254XXXXXXXXX)
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 0712345678"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      disabled={processingPayment || checkingStatus}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      You will receive an STK push on this number to complete the payment
                    </p>
                  </div>
                )}

                {/* Payment error message */}
                {paymentError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                    {paymentError}
                  </div>
                )}

                {/* Success message */}
                {paymentSuccess && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
                    Payment processed successfully! Redirecting...
                  </div>
                )}

                <button
                  onClick={handleProcessPayment}
                  disabled={processingPayment || checkingStatus || paymentSuccess}
                  className={`w-full px-4 py-2 bg-blue-500 text-white rounded-lg ${
                    processingPayment || checkingStatus || paymentSuccess ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'
                  }`}
                >
                  {processingPayment ? 'Processing...' : 
                   checkingStatus ? 'Waiting for confirmation...' :
                   paymentSuccess ? 'Payment Successful' : 
                   paymentMethod === 'M-Pesa' ? 'Send Payment Request' : 'Process Payment'}
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              disabled={processingPayment || checkingStatus}
            >
              Close
            </button>
            <button 
              onClick={() => onDownload(invoice)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center"
            >
              <Download size={16} className="mr-1" /> Download
            </button>
            <button 
              onClick={() => onPrint(invoice)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center"
            >
              <Printer size={16} className="mr-1" /> Print
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Component
const BillingInvoices = () => {
 const [invoices, setInvoices] = useState([]);
 const [isLoading, setIsLoading] = useState(true);
 const [error, setError] = useState(null);
 const [selectedInvoice, setSelectedInvoice] = useState(null);
 const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
 const [filterStatus, setFilterStatus] = useState('all');
 const [searchTerm, setSearchTerm] = useState('');

 // Fetch invoices
 const fetchInvoices = async () => {
   try {
     setIsLoading(true);
     const response = await billingService.getInvoices();
     const data = response.data || response;
     setInvoices(data);
   } catch (err) {
     console.error('Error fetching invoices:', err);
     setError('Failed to load invoices');
   } finally {
     setIsLoading(false);
   }
 };

 // Initial fetch
 useEffect(() => {
   fetchInvoices();
 }, []);

 // Handle invoice creation success
 const handleCreateSuccess = () => {
   fetchInvoices(); // Refresh the invoices list
   alert('Invoice created successfully!');
 };

 // Download invoice function
 const handleDownloadInvoice = useCallback((invoice) => {
   try {
     // Create the invoice content as text
     const invoiceContent = `
INVOICE

Invoice #: INV-${invoice._id.toString().slice(-8)}
Date: ${invoice.date ? new Date(invoice.date).toLocaleDateString() : 'N/A'}
-----------------------------------------

Patient: ${invoice.patientName}
Status: ${invoice.status}

ITEMS:
${invoice.items.map(item => `${item.service} - ${item.description || 'N/A'}: $${item.amount.toFixed(2)}`).join('\n')}

-----------------------------------------
TOTAL: $${invoice.totalAmount.toFixed(2)}

Thank you for your business!
`;

     // Create a blob with the content
     const blob = new Blob([invoiceContent], { type: 'text/plain' });
     
     // Create a download link and trigger the download
     const url = URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     a.download = `Invoice-${invoice._id.toString().slice(-8)}.txt`;
     document.body.appendChild(a);
     a.click();
     
     // Clean up
     document.body.removeChild(a);
     URL.revokeObjectURL(url);
   } catch (error) {
     console.error('Error downloading invoice:', error);
     alert('Failed to download invoice');
   }
 }, []);

 // Print invoice function
 const handlePrintInvoice = useCallback((invoice) => {
   try {
     // Create a new window for printing
     const printWindow = window.open('', '_blank');
     
     // Create the HTML content for printing
     const htmlContent = `
       <!DOCTYPE html>
       <html>
       <head>
         <title>Invoice ${invoice._id.toString().slice(-8)}</title>
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
           <p>Invoice #: INV-${invoice._id.toString().slice(-8)}</p>
           <p>Date: ${invoice.date ? new Date(invoice.date).toLocaleDateString() : 'N/A'}</p>
         </div>
         
         <div class="invoice-details">
           <div>
             <strong>Patient:</strong>
             <p>${invoice.patientName}</p>
           </div>
           <div>
             <strong>Status:</strong>
             <p>${invoice.status}</p>
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
             ${invoice.items.map(item => `
               <tr>
                 <td>${item.service}</td>
                 <td>${item.description || 'N/A'}</td>
                 <td style="text-align: right;">$${item.amount.toFixed(2)}</td>
               </tr>
             `).join('')}
             <tr class="total-row">
               <td colspan="2" style="text-align: right;">Total</td>
               <td style="text-align: right;">$${invoice.totalAmount.toFixed(2)}</td>
             </tr>
           </tbody>
         </table>
         
         <div class="footer">
           <p>Thank you for your business!</p>
         </div>
         
         <script>
           // Auto-print when loaded
           window.onload = function() {
             window.print();
           }
         </script>
       </body>
       </html>
     `;
     
     // Write the HTML content to the new window
     printWindow.document.write(htmlContent);
     printWindow.document.close();
   } catch (error) {
     console.error('Error printing invoice:', error);
     alert('Failed to print invoice');
   }
 }, []);

 // Filter invoices based on status and search term
 const filteredInvoices = invoices.filter(invoice => {
   const matchesStatus = filterStatus === 'all' || invoice.status.toLowerCase() === filterStatus.toLowerCase();
   const matchesSearch = (invoice.patientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (invoice._id || '').toString().includes(searchTerm);
   return matchesStatus && matchesSearch;
 });

 if (isLoading) return <div className="p-4">Loading invoices...</div>;
 if (error) return <div className="p-4 text-red-500">{error}</div>;

 return (
   <div className="p-6">
     {/* Header */}
     <div className="flex justify-between items-center mb-6">
       <h2 className="text-2xl font-bold text-gray-800">Invoices</h2>
       <button 
         onClick={() => setIsCreateModalOpen(true)}
         className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
       >
         <Plus size={20} className="mr-2" />
         New Invoice
       </button>
     </div>

     {/* Search and Filter */}
     <div className="flex gap-4 mb-6">
       <div className="flex-1 relative">
         <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
         <input
           type="text"
           placeholder="Search invoices..."
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
         <option value="pending">Pending</option>
         <option value="paid">Paid</option>
         <option value="overdue">Overdue</option>
       </select>
     </div>

     {/* Invoices List */}
     <div className="bg-white rounded-lg shadow overflow-hidden">
       <div className="overflow-x-auto">
         <table className="min-w-full divide-y divide-gray-200">
           <thead className="bg-gray-50">
             <tr>
               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
               <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
               <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
             </tr>
           </thead>
           <tbody className="bg-white divide-y divide-gray-200">
             {filteredInvoices.length > 0 ? (
               filteredInvoices.map((invoice) => (
                <tr key={invoice._id} className="hover:bg-gray-50">
                   <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">INV-{invoice._id.toString().slice(-8)}</td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{invoice.patientName}</td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{invoice.date ? new Date(invoice.date).toLocaleDateString() : 'N/A'}</td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">${invoice.totalAmount.toFixed(2)}</td>
                   <td className="px-6 py-4 whitespace-nowrap">
                     <span className={`px-2 py-1 text-xs rounded-full ${
                       invoice.status.toLowerCase() === 'paid' 
                         ? 'bg-green-100 text-green-800'
                         : invoice.status.toLowerCase() === 'overdue'
                         ? 'bg-red-100 text-red-800'
                         : 'bg-yellow-100 text-yellow-800'
                     }`}>
                       {invoice.status}
                     </span>
                   </td>
                   <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                     <div className="flex justify-end space-x-2">
                       <button 
                         onClick={() => setSelectedInvoice(invoice)}
                         className="text-blue-600 hover:text-blue-900"
                         title="View invoice details"
                       >
                         <Eye size={18} />
                       </button>
                       <button 
                         onClick={() => handleDownloadInvoice(invoice)}
                         className="text-gray-600 hover:text-gray-900"
                         title="Download invoice"
                       >
                         <Download size={18} />
                       </button>
                       <button 
                         onClick={() => handlePrintInvoice(invoice)}
                         className="text-gray-600 hover:text-gray-900"
                         title="Print invoice"
                       >
                         <Printer size={18} />
                       </button>
                     </div>
                   </td>
                 </tr>
               ))
             ) : (
               <tr>
                 <td colSpan="6" className="px-6 py-4 text-center text-gray-500">No invoices found</td>
               </tr>
             )}
           </tbody>
         </table>
       </div>
     </div>

     {/* Invoice Details Modal */}
     <InvoiceModal 
       isOpen={selectedInvoice !== null}
       onClose={() => setSelectedInvoice(null)}
       invoice={selectedInvoice}
       onDownload={handleDownloadInvoice}
       onPrint={handlePrintInvoice}
     />

     {/* Create Invoice Modal */}
     <CreateInvoiceModal
       isOpen={isCreateModalOpen}
       onClose={() => setIsCreateModalOpen(false)}
       onCreateSuccess={handleCreateSuccess}
     />
   </div>
 );
};

export default BillingInvoices;