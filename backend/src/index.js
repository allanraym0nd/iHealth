require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

require('./models/User');
require('./models/Doctor');
require('./models/Patient');
require('./models/Nurse');
require('./models/Pharmacy');
require('./models/Lab');
require('./models/Billing');
require('./models/Appointment');
require('./models/MedicalRecord');




// Middleware
app.use(cors());
app.use(express.json());

// Add debug logging for routes
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes with logging
const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/patientRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const nurseRoutes = require('./routes/nurseRoutes');
const pharmacyRoutes = require('./routes/pharmacyRoutes');
const labRoutes = require('./routes/labRoutes');
const billingRoutes = require('./routes/billingRoutes');
const medicalRecordRoute = require('./routes/medicalRecordRoute');
const messageRoutes = require('./routes/messageRoutes');
const userRoutes = require('./routes/userRoutes');
const prescriptionRoutes = require('./routes/prescriptionRoutes'); 


app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/nurses', nurseRoutes);
app.use('/api/pharmacy', pharmacyRoutes);
app.use('/api/lab', labRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/medical-records', medicalRecordRoute);
app.use('/api/messages', messageRoutes);
app.use('/api', userRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
// Database connection with better logging
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    console.log('Server ready to handle requests');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
console.log(`Server running on port ${PORT}`);
console.log('Routes configured:');
console.log('- /api/auth');
console.log('- /api/doctors');
console.log('- /api/patients');
  // ... etc
});