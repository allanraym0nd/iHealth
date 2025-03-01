const { check } = require('express-validator');

const registerValidation = [
  // Username validation
  check('username')
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3 }).withMessage('Username must be at least 3 characters')
    .trim(),

  // Password validation
  check('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),

  // Role validation
  check('role')
    .notEmpty().withMessage('Role is required')
    .isIn(['doctor', 'nurse', 'patient', 'pharmacy', 'lab', 'billing','reception'])
    .withMessage('Invalid role'),

  // Patient specific validations - only required if role is patient
  check('name')
    .if(check('role').equals('patient'))
    .notEmpty().withMessage('Name is required for patients')
    .trim(),

  check('age')
    .if(check('role').equals('patient'))
    .notEmpty().withMessage('Age is required for patients')
    .isNumeric().withMessage('Age must be a number'),

  check('gender')
    .if(check('role').equals('patient'))
    .notEmpty().withMessage('Gender is required for patients')
    .isIn(['Male', 'Female', 'Other'])
    .withMessage('Invalid gender'),

  check('phone')
    .if(check('role').equals('patient'))
    .notEmpty().withMessage('Phone number is required for patients')
    .trim(),

  check('email')
    .if(check('role').equals('patient'))
    .notEmpty().withMessage('Email is required for patients')
    .isEmail().withMessage('Invalid email format')
    .trim()
];

const loginValidation = [
  check('username')
    .notEmpty().withMessage('Username is required')
    .trim(),
    
  check('password')
    .notEmpty().withMessage('Password is required')
];

module.exports = {
  registerValidation,
  loginValidation
};