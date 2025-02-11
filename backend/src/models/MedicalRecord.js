const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  date: {
    type: Date,
    default: Date.now,
    required: true
  },
  diagnosis: {
    type: String,
    required: true
  },
  symptoms: [String],
  treatment: String,
  prescriptions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prescription'
  }],
  testResults: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestResult'
  }],
  notes: String,
  attachments: [String]
}, { timestamps: true });

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);