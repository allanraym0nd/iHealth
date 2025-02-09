const { check } = require('express-validator');

const nurseValidation = [
  // Basic info validation
  check('name')
    .notEmpty().withMessage('Name is required')
    .trim(),

  check('department')
    .notEmpty().withMessage('Department is required')
    .trim(),

  // Contact validation
  check('contact.phone')
    .optional()
    .isMobilePhone().withMessage('Invalid phone number'),

  check('contact.email')
    .optional()
    .isEmail().withMessage('Invalid email format'),

  // Shift validation
  check('shift')
    .notEmpty().withMessage('Shift is required')
    .isIn(['Morning', 'Evening', 'Night'])
    .withMessage('Invalid shift type'),

  // Ward validation
  check('ward')
    .notEmpty().withMessage('Ward assignment is required')
    .trim()
];

const updateNurseValidation = [
  // Same validations but all fields optional
  check('name').optional().trim(),
  check('department').optional().trim(),
  check('contact.phone').optional().isMobilePhone(),
  check('contact.email').optional().isEmail(),
  check('shift').optional().isIn(['Morning', 'Evening', 'Night']),
  check('ward').optional().trim()
];

module.exports = {
  nurseValidation,
  updateNurseValidation
};