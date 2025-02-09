const mongoose = require('mongoose');

const nurseSchema = new mongoose.Schema({
 userId: {
   type: mongoose.Schema.Types.ObjectId,
   ref: 'User',
   required: true
 },
 name: {
   type: String,
   required: true
 },
 department: {
   type: String,
   required: true
 },
 contact: {
   phone: String,
   email: String
 },
 shift: {
   type: String,
   enum: ['Morning', 'Evening', 'Night'],
   required: true
 },
 patients: [{
   type: mongoose.Schema.Types.ObjectId,
   ref: 'Patient'
 }],
 ward: {
   type: String
 }
}, { timestamps: true });

module.exports = mongoose.model('Nurse', nurseSchema);