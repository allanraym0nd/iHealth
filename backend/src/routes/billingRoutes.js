const router = require('express').Router();
const billingController = require('../controllers/billingController');
const mpesaController = require('../controllers/mpesaController');

// Add this right at the top of your routes, after the imports

const { 
  invoiceValidation, 
  paymentValidation, 
  insuranceClaimValidation 
} = require('../middleware/billingValidation');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');

// Profile creation
router.post('/create', auth, billingController.createProfile);

// Invoice routes
router.post('/invoices/:patientId', auth, invoiceValidation, validate, billingController.createInvoice);
router.get('/invoices', auth, billingController.getInvoices);
router.get('/invoices/:patientId', auth, billingController.getPatientInvoices);
// Add this route in billingRoutes.js
router.get('/financial-summary', auth, billingController.getFinancialSummary);

// Modified payment route to handle both regular and M-Pesa payments
router.put('/invoices/:invoiceId/payment', auth, billingController.processPayment);

// Insurance claim routes
router.post('/insurance-claims', auth, insuranceClaimValidation, validate, billingController.submitInsuranceClaim);
router.get('/insurance-claims', auth, billingController.getInsuranceClaims);
router.get('/insurance-claims/:patientId', auth, billingController.getPatientInsuranceClaims);

// Expense routes
router.get('/expenses', auth, billingController.getExpenses);
router.post('/expenses', auth, billingController.trackExpenses);

// Payment routes
router.get('/payments', auth, billingController.getPayments);

// Keep the callback endpoint for M-Pesa
router.post('/mpesa-callback', mpesaController.mpesaCallback);

// Status checking endpoint for M-Pesa
router.get('/invoices/:invoiceId/payment-status', billingController.checkPaymentStatus);

// Invoice status update route
router.put('/invoices/:invoiceId/update-status', billingController.updatePaymentStatus);

// Report routes
router.get('/reports', auth, billingController.getFinancialReports);

// NEW: Report generation routes
router.post('/reports/generate', auth, billingController.generateReport);
// Modify this route for testing
router.get('/reports/generate', (req, res, next) => {
  console.log('Report generate route hit with params:', req.query);
  
  try {
    // Convert query params to body for the controller
    req.body = {
      reportType: req.query.reportType,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      format: req.query.format,
      filters: req.query.filters ? JSON.parse(req.query.filters) : {}
    };
    
    // Use the actual controller function now
    billingController.generateReport(req, res, next);
  } catch (error) {
    console.error('Error in reports/generate route:', error);
    res.status(500).send('Error processing report request');
  }
});
// Patient routes
router.get('/patients/all', auth, billingController.getAllPatients);



router.get('/mpesa-transactions/:transactionId/status', mpesaController.checkTransactionStatus);
router.post('/invoices/:invoiceId/simulate-payment', mpesaController.simulatePayment);

module.exports = router;