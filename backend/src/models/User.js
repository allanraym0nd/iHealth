const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['doctor', 'nurse', 'patient', 'pharmacy', 'lab', 'billing', 'reception'], 
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);