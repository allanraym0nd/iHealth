const mongoose = require('mongoose');

const labSchema = new mongoose.Schema({
  testOrders: [{
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient'
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor'
    },
    testType: String,
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Completed', 'sample_collected'],
      default: 'Pending'
    },
    scheduledDate: Date,
    results: {
      value: String,           // Changed from data: Object
      unit: String,           // Added
      referenceRange: String, // Added
      interpretation: String, // Added
      isCritical: Boolean,   // Added
      notes: String,
      date: Date
    }
  }],
  // ... rest of the schema remains the same
  samples: [{
    testOrder: {
      type: mongoose.Schema.Types.ObjectId
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient'
    },
    testType: String,
    collectionDate: Date,
    storageLocation: String,
    notes: String,
    status: {
      type: String,
      enum: ['collected', 'processing', 'stored', 'disposed'],
      default: 'collected'
    }
  }],
  inventory: [{
    item: String,
    quantity: Number,
    reorderLevel: Number,
    lastRestocked: Date
  }],
  reorderRequests: [{
    item: String,
    quantity: Number,
    requestDate: Date,
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Received']
    }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Lab', labSchema);
