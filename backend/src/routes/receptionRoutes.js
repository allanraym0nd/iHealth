// receptionRoutes.js
const router = require('express').Router();
const receptionController = require('../controllers/receptionController');
const auth = require('../middleware/auth');

// Ensure only reception and admin can access these routes
router.use(auth);

router.get('/patients', receptionController.getAllPatients);
router.post('/patients', receptionController.registerPatient);
router.put('/patients/:id', receptionController.updatePatient);
router.get('/appointments/today', receptionController.getTodayAppointments);
router.get('/dashboard-stats', receptionController.getDashboardStats);

module.exports = router;