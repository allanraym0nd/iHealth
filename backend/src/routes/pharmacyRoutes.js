const router = require('express').Router();
const pharmacyController = require('../controllers/pharmacyController');
console.log("pharmacyController:", pharmacyController); // Debugging log
const { inventoryValidation, prescriptionValidation, refillRequestValidation } = require('../middleware/pharmacyValidation');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');

// Inventory routes
router.post('/inventory', auth, inventoryValidation, validate, pharmacyController.create);
router.get('/inventory', auth, pharmacyController.getInventory);
router.put('/inventory', auth, inventoryValidation, validate, pharmacyController.updateInventory);

// Prescription routes
router.post('/prescriptions', auth, prescriptionValidation, validate, pharmacyController.createPrescription);
router.get('/prescriptions', auth, pharmacyController.getPrescriptions);

// Refill request routes
router.post('/refill-requests', auth, refillRequestValidation, validate, pharmacyController.handleRefillRequest);
router.get('/refill-requests', auth, pharmacyController.getRefillRequests);

module.exports = router;