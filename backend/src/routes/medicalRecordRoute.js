const router = require('express').Router();
const medicalRecordController = require('../controllers/medicalRecordController');
const auth = require('../middleware/auth');

// Create new medical record
router.post('/', auth, medicalRecordController.create);

// Get all medical records for logged in doctor
router.get('/', auth, medicalRecordController.getAll);

// Get all records for a specific patient
router.get('/patient/:patientId', auth, medicalRecordController.getPatientRecords);

// Get specific record by ID
router.get('/:id', auth, medicalRecordController.getById);

// Update medical record
router.put('/:id', auth, medicalRecordController.update);

// Delete medical record
router.delete('/:id', auth, medicalRecordController.delete);

module.exports = router;