const mongoose = require('mongoose');

const pharmacySchema = new mongoose.Schema({
  inventoryItems: [{
    medication: String,
    quantity: Number,
    reorderLevel: Number,
    expiryDate: Date
  }],
  prescriptions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prescription'
  }],
  transactions: [{
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient'
    },
    medications: [{
      name: String,
      quantity: Number,
      price: Number
    }],
    date: Date,
    status: {
      type: String,
      enum: ['Pending', 'Completed', 'Cancelled']
    }
  }],
  refillRequests: [{
    prescription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prescription'
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient'
    },
    requestDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending'
    },
    notes: String
  }]
}, { timestamps: true });

module.exports = mongoose.model('Pharmacy', pharmacySchema);