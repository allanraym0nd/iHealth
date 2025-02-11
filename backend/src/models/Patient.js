const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  age: { 
    type: Number, 
    required: true 
  },
  gender: { 
    type: String, 
    required: true, 
    enum: ['Male', 'Female', 'Other'] 
  },
  contact: {
    phone: { 
      type: String, 
      required: true 
    },
    email: { 
      type: String, 
      required: true 
    }
  },
  status: {
    type: String,
    default: 'active',
    enum: ['active', 'inactive']
  }
});

module.exports = mongoose.model('Patient', patientSchema);