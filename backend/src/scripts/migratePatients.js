require('dotenv').config();
const mongoose = require('mongoose');
const Patient = require('../models/Patient');
const User = require('../models/User');

const migratePatientsData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const patientsWithoutUser = await Patient.find({ userId: { $exists: false } });
    console.log(`Found ${patientsWithoutUser.length} patients without user accounts`);

    for (const patient of patientsWithoutUser) {
      try {
        // Skip if patient already has a userId
        if (patient.userId) {
          console.log(`Patient ${patient.name} already has a userId, skipping`);
          continue;
        }

        // Check if user already exists with this email
        const existingUser = await User.findOne({ username: patient.contact.email });
        
        if (existingUser) {
          // Check if any other patient is using this userId
          const existingPatientWithUserId = await Patient.findOne({ userId: existingUser._id });
          
          if (existingPatientWithUserId) {
            console.log(`Another patient is already linked to user: ${patient.name}, skipping`);
            continue;
          }

          console.log(`User exists for patient: ${patient.name}, linking patient to existing user`);
          await Patient.findByIdAndUpdate(patient._id, { userId: existingUser._id });
        } else {
          // Create new user account if one doesn't exist
          const user = new User({
            username: patient.contact.email,
            password: '123456',
            role: 'patient'
          });
          await user.save();

          // Update patient with userId
          await Patient.findByIdAndUpdate(patient._id, { userId: user._id });
          console.log(`Created user account for patient: ${patient.name}`);
        }

      } catch (error) {
        console.error(`Error processing patient ${patient.name}:`, error.message);
      }
    }

    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migratePatientsData();