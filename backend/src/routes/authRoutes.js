const router = require('express').Router();
const { register, login } = require('../controllers/authController');
const { registerValidation, loginValidation } = require('../middleware/authValidation');
const validate = require('../middleware/validate');

router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);

module.exports = router;