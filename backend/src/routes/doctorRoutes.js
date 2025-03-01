const router = require('express').Router();
const doctorController = require('../controllers/doctorController');
const medicalRecordController = require('../controllers/medicalRecordController');
const { doctorValidation, updateDoctorValidation } = require('../middleware/doctorValidation');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');

// More specific routes first
router.get('/profile', auth, doctorController.getProfile);
router.post('/patients', auth, doctorController.createPatient);
router.get('/patients', auth, doctorController.getPatients);
router.get('/appointments', auth, doctorController.getAppointments);
router.get('/schedule', auth, doctorController.getSchedule);
router.post('/setup', auth, doctorController.create);

router.post('/appointments', auth, doctorController.createAppointment);
router.get('/appointments', auth, doctorController.getAppointments);
router.put('/appointments/:id/cancel', auth, doctorController.cancelAppointment);

router.put('/appointments/:id/complete', auth, doctorController.completeAppointment);
router.put('/appointments/:id/reschedule', auth, doctorController.rescheduleAppointment);

router.post('/medical-records', auth, medicalRecordController.create);
router.get('/medical-records', auth, medicalRecordController.getAll);
router.get('/medical-records/:id', auth, medicalRecordController.getById);

// Add these routes
router.get('/prescriptions', auth, doctorController.getPrescriptions);
router.post('/prescriptions', auth, doctorController.createPrescription);

// Lab order routes
router.post('/lab-orders', auth, doctorController.createLabOrder);
router.get('/lab-orders', auth, doctorController.getLabOrders);
router.put('/lab-orders/:id/cancel', auth, doctorController.cancelLabOrder);

// General CRUD routes
router.post('/', auth, doctorValidation, validate, doctorController.create);
router.get('/', auth, doctorController.getAll);
router.get('/:id', auth, doctorController.getById);
router.put('/:id', auth, updateDoctorValidation, validate, doctorController.update);
router.delete('/:id', auth, doctorController.delete);

module.exports = router;