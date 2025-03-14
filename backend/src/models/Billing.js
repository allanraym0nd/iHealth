const mongoose = require('mongoose');

const billingSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  invoices: [{
    items: [{
      service: {
        type: String,
        required: true
      },
      description: {
        type: String,
        default: ''
      },
      amount: {
        type: Number,
        required: true,
        min: 0
      }
    }],
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: ['Pending', 'Paid', 'Overdue', 'Cancelled'],
      default: 'Pending'
    },
    dueDate: {
      type: Date,
      required: true
    },
    paidDate: Date,
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Credit Card', 'Bank Transfer', 'Insurance','M-Pesa'],
      required: false
    }
  }],
  expenses: [{
    category: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    date: {
      type: Date,
      default: Date.now
    },
    description: {
      type: String,
      default: ''
    }
  }],
  insuranceClaims: [{
    provider: {
      type: String,
      required: true
    },
    claimNumber: {
      type: String,
      required: true,
      unique: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: ['Submitted', 'Processing', 'Approved', 'Rejected', 'Paid'],
      default: 'Submitted'
    },
    submissionDate: {
      type: Date,
      default: Date.now
    },
    responseDate: Date,
    notes: {
      type: String,
      default: ''
    }
  }]
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Billing', billingSchema);