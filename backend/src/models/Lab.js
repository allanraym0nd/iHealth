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
     enum: ['Pending', 'In Progress', 'Completed']
   },
   scheduledDate: Date,
   results: {
     data: Object,
     date: Date,
     notes: String
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