const router = require('express').Router();
const nurseController = require('../controllers/nurseController');
const { nurseValidation, updateNurseValidation } = require('../middleware/nurseValidation');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');

router.post('/', auth, nurseValidation, validate, nurseController.create);
router.get('/', auth, nurseController.getAll);
router.get('/:id', auth, nurseController.getById);
router.put('/:id', auth, updateNurseValidation, validate, nurseController.update);
router.delete('/:id', auth, nurseController.delete);

module.exports = router;