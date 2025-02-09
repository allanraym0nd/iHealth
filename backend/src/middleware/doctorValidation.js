const { check } = require('express-validator');

const doctorValidation = [
  // Basic info validation
  check('name')
    .notEmpty().withMessage('Name is required')
    .trim(),

  check('specialization')
    .notEmpty().withMessage('Specialization is required')
    .trim(),

  // Contact validation
  check('contact.phone')
    .optional()
    .isMobilePhone().withMessage('Invalid phone number'),

  check('contact.email')
    .optional()
    .isEmail().withMessage('Invalid email format'),
    
  check('contact.office')
    .optional()
    .trim(),

  // Schedule validation
  check('schedule.workDays')
    .optional()
    .isArray().withMessage('Work days must be an array'),

  check('schedule.workHours.start')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid start time format (HH:MM)'),

  check('schedule.workHours.end')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid end time format (HH:MM)')
];

const updateDoctorValidation = [
  check('name').optional().trim(),
  check('specialization').optional().trim(),
  check('contact.phone').optional().isMobilePhone(),
  check('contact.email').optional().isEmail(),
  check('contact.office').optional().trim(),
  check('schedule.workDays').optional().isArray(),
  check('schedule.workHours.start')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  check('schedule.workHours.end')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
];

module.exports = { doctorValidation, updateDoctorValidation };