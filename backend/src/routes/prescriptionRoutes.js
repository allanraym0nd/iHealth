const router = require('express').Router();
const prescriptionController = require('../controllers/prescriptionController');
const auth = require('../middleware/auth');

// Create new prescription
router.post('/', auth, prescriptionController.create);

// Get all prescriptions (for doctor)
router.get('/', auth, prescriptionController.getAll);

// Get specific prescription
router.get('/:id', auth, prescriptionController.getById);

// Update prescription status
router.put('/:id/status', auth, prescriptionController.updateStatus);

// Get patient's prescriptions
router.get('/patient/:patientId', auth, prescriptionController.getPatientPrescriptions);

module.exports = router;