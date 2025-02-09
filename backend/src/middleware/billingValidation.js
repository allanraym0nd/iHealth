const { check } = require('express-validator');

const billingValidation = {
  // Invoice validation
  invoiceValidation: [
    check('patient')
      .notEmpty().withMessage('Patient ID is required')
      .isMongoId().withMessage('Invalid patient ID'),

    check('items.*.service')
      .notEmpty().withMessage('Service name is required')
      .trim(),

    check('items.*.amount')
      .notEmpty().withMessage('Amount is required')
      .isFloat({ min: 0 }).withMessage('Amount must be a positive number'),

    check('totalAmount')
      .notEmpty().withMessage('Total amount is required')
      .isFloat({ min: 0 }).withMessage('Total amount must be a positive number'),

    check('dueDate')
      .notEmpty().withMessage('Due date is required')
      .isDate().withMessage('Invalid date format')
  ],

  // Payment validation
  paymentValidation: [
    check('amount')
      .notEmpty().withMessage('Payment amount is required')
      .isFloat({ min: 0 }).withMessage('Payment amount must be a positive number'),

    check('paymentMethod')
      .notEmpty().withMessage('Payment method is required')
      .isIn(['Cash', 'Credit Card', 'Insurance', 'Bank Transfer'])
      .withMessage('Invalid payment method')
  ],

  // Insurance claim validation
  insuranceClaimValidation: [
    check('provider')
      .notEmpty().withMessage('Insurance provider is required')
      .trim(),

    check('claimNumber')
      .notEmpty().withMessage('Claim number is required')
      .trim(),

    check('amount')
      .notEmpty().withMessage('Claim amount is required')
      .isFloat({ min: 0 }).withMessage('Amount must be a positive number'),

    check('submissionDate')
      .notEmpty().withMessage('Submission date is required')
      .isDate().withMessage('Invalid date format')
  ]
};

module.exports = billingValidation;