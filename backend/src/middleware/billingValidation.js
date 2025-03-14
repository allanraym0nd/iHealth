const { check, param } = require('express-validator');

const billingValidation = {
  // Invoice validation
  invoiceValidation: [
    // Validate patient ID in route parameter
    param('patientId')
      .notEmpty().withMessage('Patient ID is required')
      .isMongoId().withMessage('Invalid patient ID'),

    // Validate invoice items array
    check('items')
      .isArray({ min: 1 }).withMessage('Invoice must contain at least one item'),

    // Validate each item in the invoice
    check('items.*.service')
      .notEmpty().withMessage('Service name is required')
      .isString().withMessage('Service must be a string')
      .trim(),

    check('items.*.description')
      .optional()
      .isString().withMessage('Description must be a string')
      .trim(),

    check('items.*.amount')
      .notEmpty().withMessage('Item amount is required')
      .isFloat({ min: 0 }).withMessage('Amount must be a positive number')
  ],

  // Payment validation
  paymentValidation: [
    // Validate invoice ID
    param('invoiceId')
      .notEmpty().withMessage('Invoice ID is required'),
     // .isMongoId().withMessage('Invalid invoice ID'),

    // Validate payment method
    check('paymentMethod')
      .notEmpty().withMessage('Payment method is required')
      .isIn(['Cash', 'Credit Card', 'Insurance', 'Bank Transfer', 'M-Pesa'])
      .withMessage('Invalid payment method'),

    // Conditional validation for M-Pesa phone number
    check('phoneNumber')
      .if((value, { req }) => req.body.paymentMethod === 'M-Pesa')
      .notEmpty().withMessage('Phone number is required for M-Pesa payment')
      .matches(/^(07|01|254)\d{8,9}$/)
      .withMessage('Invalid Kenyan phone number format'),

    // Validate payment amount
    check('amount')
      .notEmpty().withMessage('Payment amount is required')
      .isFloat({ min: 0 }).withMessage('Payment amount must be a positive number')
  ],

  // Insurance claim validation
  insuranceClaimValidation: [
    // Validate insurance provider
    check('provider')
      .notEmpty().withMessage('Insurance provider is required')
      .isString().withMessage('Provider must be a string')
      .trim(),

    // Validate claim number
    check('claimNumber')
      .notEmpty().withMessage('Claim number is required')
      .isString().withMessage('Claim number must be a string')
      .trim(),

    // Validate claim amount
    check('amount')
      .notEmpty().withMessage('Claim amount is required')
      .isFloat({ min: 0 }).withMessage('Claim amount must be a positive number'),

    // Validate patient ID
    check('patientId')
      .notEmpty().withMessage('Patient ID is required')
      .isMongoId().withMessage('Invalid patient ID'),

    // Make submission date optional
    check('submissionDate')
      .optional()
      .isISO8601().withMessage('Invalid date format'),

    // Optional notes
    check('notes')
      .optional()
      .isString().withMessage('Notes must be a string')
      .trim()
  ],

  // Expense tracking validation
  expenseValidation: [
    // Validate expense category
    check('category')
      .notEmpty().withMessage('Expense category is required')
      .isString().withMessage('Category must be a string')
      .trim(),

    // Validate expense amount
    check('amount')
      .notEmpty().withMessage('Expense amount is required')
      .isFloat({ min: 0 }).withMessage('Expense amount must be a positive number'),

    // Validate description (optional)
    check('description')
      .optional()
      .isString().withMessage('Description must be a string')
      .trim()
  ]
};

module.exports = billingValidation;