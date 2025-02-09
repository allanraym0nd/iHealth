const { check } = require('express-validator');

const patientValidation = [
  // Basic info validation
  check('name')
    .notEmpty().withMessage('Name is required')
    .trim(),

  check('dateOfBirth')
    .notEmpty().withMessage('Date of birth is required')
    .isDate().withMessage('Invalid date format'),

  check('gender')
    .notEmpty().withMessage('Gender is required')
    .isIn(['Male', 'Female', 'Other'])
    .withMessage('Invalid gender'),

  // Contact validation
  check('contact.phone')
    .optional()
    .isMobilePhone().withMessage('Invalid phone number'),

  check('contact.email')
    .optional()
    .isEmail().withMessage('Invalid email format'),

  check('contact.address')
    .optional()
    .trim()
];

const updatePatientValidation = [
  // Same validations but all fields optional
  check('name').optional().trim(),
  check('dateOfBirth').optional().isDate(),
  check('gender').optional().isIn(['Male', 'Female', 'Other']),
  check('contact.phone').optional().isMobilePhone(),
  check('contact.email').optional().isEmail(),
  check('contact.address').optional().trim()
];

module.exports = {
  patientValidation,
  updatePatientValidation
};