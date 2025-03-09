const router = require('express').Router();
const labController = require('../controllers/labController');
const { testOrderValidation, resultValidation, inventoryValidation } = require('../middleware/labValidation');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');

// Lab core routes
router.post('/create', auth, labController.create);

// Test Orders routes
router.get('/test-orders', auth, labController.getTestOrders);
router.post('/test-orders', auth, testOrderValidation, validate, labController.createTestOrder);
router.put('/test-orders/:id/status', auth, labController.updateTestStatus);
router.put('/test-orders/:id/results', auth, resultValidation, validate, labController.recordTestResults);
router.get('/tests/pending', auth, labController.getPendingTests);
router.get('/tests/completed', auth, labController.getCompletedTests);

// Sample Management routes
router.get('/samples', auth, labController.getSamples);
router.post('/samples', auth, labController.collectSample);
router.put('/samples/:id/status', auth, labController.updateSampleStatus);

// Test Results routes
router.get('/test-results', auth, labController.getTestResults);
router.post('/test-results', auth, labController.addTestResult);
router.put('/test-results/:id', auth, labController.updateTestResult);
router.get('/tests/ready-for-results', labController.getTestsReadyForResults);

// Inventory routes
router.get('/inventory', auth, labController.getInventory);
router.post('/inventory', auth, labController.addInventoryItem);
router.put('/inventory/:id', auth, labController.updateInventoryItem);
router.put('/inventory', auth, inventoryValidation, validate, labController.updateInventory);
router.delete('/inventory/:id', labController.deleteInventoryItem);

// Lists routes
router.get('/patients-list', auth, labController.getPatientsList);
router.get('/doctors-list', auth, labController.getDoctorsList);

// Reorder requests routes
router.get('/reorder-requests', auth, labController.getReorderRequests);
router.post('/reorder-requests', auth, inventoryValidation, validate, labController.createReorderRequest);



module.exports = router;