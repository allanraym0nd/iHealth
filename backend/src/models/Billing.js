const mongoose = require('mongoose');

const billingSchema =  new mongoose.Schema( {
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient'
      },
      invoices: [{
        items: [{
          service: String,
          description: String,
          amount: Number
        }],
        totalAmount: Number,
        status: {
          type: String,
          enum: ['Pending', 'Paid', 'Overdue', 'Cancelled']
        },
        dueDate: Date,
        paidDate: Date,
        paymentMethod: String
      }],
      expenses: [{
        category: String,
        amount: Number,
        date: Date,
        description: String
      }],
      insuranceClaims: [{
        provider: String,
        claimNumber: String,
        amount: Number,
        status: String,
        submissionDate: Date,
        responseDate: Date
      }]
     }, { timestamps: true });
     
     module.exports = mongoose.model('Billing', billingSchema);

