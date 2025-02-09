const router = require('express').Router();
const doctorController = require('../controllers/doctorController');
const { doctorValidation, updateDoctorValidation } = require('../middleware/doctorValidation');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');

// More specific routes first
router.get('/profile', auth, doctorController.getProfile);
router.get('/patients', auth, doctorController.getPatients);
router.get('/appointments', auth, doctorController.getAppointments);
router.get('/schedule', auth, doctorController.getSchedule);
router.post('/setup', auth, doctorController.create);

// General CRUD routes
router.post('/', auth, doctorValidation, validate, doctorController.create);
router.get('/', auth, doctorController.getAll);
router.get('/:id', auth, doctorController.getById);
router.put('/:id', auth, updateDoctorValidation, validate, doctorController.update);
router.delete('/:id', auth, doctorController.delete);

module.exports = router;