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
  }]
}, { timestamps: true });

module.exports = mongoose.model('Pharmacy', pharmacySchema);