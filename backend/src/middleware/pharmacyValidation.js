const { check } = require('express-validator');

const pharmacyValidation = {
  // Inventory validation
  inventoryValidation: [
    check('inventoryItems.*.medication')
      .notEmpty().withMessage('Medication name is required')
      .trim(),

    check('inventoryItems.*.quantity')
      .notEmpty().withMessage('Quantity is required')
      .isInt({ min: 0 }).withMessage('Quantity must be a positive number'),

    check('inventoryItems.*.reorderLevel')
      .notEmpty().withMessage('Reorder level is required')
      .isInt({ min: 0 }).withMessage('Reorder level must be a positive number'),

    check('inventoryItems.*.expiryDate')
      .notEmpty().withMessage('Expiry date is required')
      .isDate().withMessage('Invalid date format')
  ],

  // Prescription validation
  prescriptionValidation: [
    check('patient')
      .notEmpty().withMessage('Patient ID is required')
      .isMongoId().withMessage('Invalid patient ID'),

    check('medications.*.name')
      .notEmpty().withMessage('Medication name is required')
      .trim(),

    check('medications.*.quantity')
      .notEmpty().withMessage('Quantity is required')
      .isInt({ min: 1 }).withMessage('Quantity must be at least 1'),

    check('medications.*.price')
      .notEmpty().withMessage('Price is required')
      .isFloat({ min: 0 }).withMessage('Price must be a positive number')
  ],

  // Refill request validation
  refillRequestValidation: [
    check('prescription')
      .notEmpty().withMessage('Prescription ID is required')
      .isMongoId().withMessage('Invalid prescription ID'),

    check('patient')
      .notEmpty().withMessage('Patient ID is required')
      .isMongoId().withMessage('Invalid patient ID'),

    check('requestDate')
      .notEmpty().withMessage('Request date is required')
      .isDate().withMessage('Invalid date format'),

    check('notes')
      .optional()
      .trim()
  ]
};

module.exports = pharmacyValidation;