const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  specialization: {
    type: String,
    required: true
  },
  contact: {
    phone: String,
    email: String,
    office: String
  },
  patients: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient'
  }],
  appointments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  }],
  schedule: {
    workDays: [String],
    workHours: {
      start: String,
      end: String
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('Doctor', doctorSchema);