const router = require('express').Router();
const patientController = require('../controllers/patientController');
const { patientValidation, updatePatientValidation } = require('../middleware/patientValidation');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');

router.post('/', auth, patientValidation, validate, patientController.create);
router.get('/', auth, patientController.getAll);
router.get('/:id', auth, patientController.getById);
router.put('/:id', auth, updatePatientValidation, validate, patientController.update);
router.delete('/:id', auth, patientController.delete);

module.exports = router;