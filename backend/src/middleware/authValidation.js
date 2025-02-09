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
    .isIn(['doctor', 'nurse', 'patient', 'pharmacy', 'lab', 'billing'])
    .withMessage('Invalid role')
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