const router = require('express').Router();
const pharmacyController = require('../controllers/pharmacyController');
console.log("pharmacyController:", pharmacyController); // Debugging log
const { inventoryValidation, prescriptionValidation, refillRequestValidation } = require('../middleware/pharmacyValidation');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');

// Inventory routes
router.post('/inventory', auth, inventoryValidation, validate, pharmacyController.addInventoryItem);
router.get('/inventory', auth, pharmacyController.getInventory);
router.put('/inventory/:id', auth, inventoryValidation, validate, pharmacyController.updateInventoryItem);
router.delete('/inventory/:id', auth, pharmacyController.deleteInventoryItem);

// Prescription routes
router.post('/prescriptions', auth, prescriptionValidation, validate, pharmacyController.createPrescription);
router.get('/prescriptions', auth, pharmacyController.getPrescriptions);
router.put('/prescriptions/:prescriptionId/process', auth, pharmacyController.processPrescription);

// Refill request routes
router.post('/refill-requests', auth, pharmacyController.createRefillRequest);
router.post('/refill-requests', auth, refillRequestValidation, validate, pharmacyController.handleRefillRequest);
router.put('/refill-requests/:id', auth, pharmacyController.processRefillRequest);
router.get('/refill-requests', auth, pharmacyController.getRefillRequests);
router.get('/patient-refill-requests', auth, pharmacyController.getPatientRefillRequests);

router.post('/create', auth, pharmacyController.createProfile);

module.exports = router;