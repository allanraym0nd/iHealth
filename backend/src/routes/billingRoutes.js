const router = require('express').Router();
const billingController = require('../controllers/billingController');
const { invoiceValidation, paymentValidation, insuranceClaimValidation } = require('../middleware/billingValidation');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');

router.post('/invoices/:patientId', auth, invoiceValidation, validate, billingController.createInvoice);
router.put('/invoices/:invoiceId/payment', auth, paymentValidation, validate, billingController.processPayment);
router.post('/insurance-claims/:patientId', auth, insuranceClaimValidation, validate, billingController.submitInsuranceClaim);

module.exports = router;