const { check } = require('express-validator');

const labValidation = {
  // Test order validation
  testOrderValidation: [
    check('patient')
      .notEmpty().withMessage('Patient is required'),

    check('doctor')
      .notEmpty().withMessage('Doctor is required'),

    check('testType')
      .notEmpty().withMessage('Test type is required')
      .trim(),

    check('scheduledDate')
      .notEmpty().withMessage('Scheduled date is required')
  ],

  // Keep your other validations as they are
  resultValidation: [
    check('results.data')
      .notEmpty().withMessage('Result data is required'),
    
    check('results.notes')
      .optional()
      .trim(),

    check('results.date')
      .notEmpty().withMessage('Result date is required')
      .isDate().withMessage('Invalid date format')
  ],

  inventoryValidation: [
    check('item')
      .notEmpty().withMessage('Item name is required')
      .trim(),

    check('quantity')
      .notEmpty().withMessage('Quantity is required')
      .isInt({ min: 0 }).withMessage('Quantity must be a positive number'),

    check('reorderLevel')
      .notEmpty().withMessage('Reorder level is required')
      .isInt({ min: 0 }).withMessage('Reorder level must be a positive number')
  ]
};

module.exports = labValidation;