const router = require('express').Router();
const labController = require('../controllers/labController');
const { testOrderValidation, resultValidation, inventoryValidation } = require('../middleware/labValidation');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');

router.post('/test-orders', auth, testOrderValidation, validate, labController.createTestOrder);
router.put('/test-orders/:id/results', auth, resultValidation, validate, labController.recordTestResults);
router.put('/inventory', auth, inventoryValidation, validate, labController.updateInventory);
router.post('/reorder-requests', auth, inventoryValidation, validate, labController.createReorderRequest);

module.exports = router;