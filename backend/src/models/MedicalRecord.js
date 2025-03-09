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
  type: {
    type: String,
    enum: ['General', 'Check-up', 'Emergency', 'Surgery', 'Follow-up', 'Consultation'],
    default: 'General'
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
  notes: String,
  attachments: [String]
}, { timestamps: true });

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);