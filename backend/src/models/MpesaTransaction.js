// models/MpesaTransaction.js
const mongoose = require('mongoose');


const mpesaTransactionSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  invoice: {
    type: mongoose.Schema.Types.ObjectId, // This will be the _id of the invoice within the Billing document
    required: true
  },
  billingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Billing',
    required: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  merchantRequestId: String,
  checkoutRequestId: String,
  mpesaReceiptNumber: String,
  resultCode: Number,
  resultDesc: String,
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

module.exports = mongoose.model('MpesaTransaction', mpesaTransactionSchema);