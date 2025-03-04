const mongoose = require('mongoose');
const Doctor = require('./src/models/Doctor');
const Appointment = require('./src/models/Appointment');
const Patient = require('./src/models/Patient');
require('dotenv').config();

async function consolidateDoctorProfiles() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // IDs for reference
    const keepDoctorId = '67af4dcddc369a6ee5232729'; // Rico
    const removeDoctorId = '67a84ec40c610d460a7aaa2f'; // Dr. Smith

    // Find doctors
    const keepDoctor = await Doctor.findById(keepDoctorId);
    const removeDoctor = await Doctor.findById(removeDoctorId);

    if (!keepDoctor || !removeDoctor) {
      console.log('One or both doctors not found');
      return;
    }

    // Log initial state
    console.log('Keeping Doctor:', {
      name: keepDoctor.name,
      patients: keepDoctor.patients.length,
      appointments: keepDoctor.appointments.length
    });

    console.log('Removing Doctor:', {
      name: removeDoctor.name,
      patients: removeDoctor.patients.length,
      appointments: removeDoctor.appointments.length
    });

    // Update appointments to point to Rico
    const appointmentUpdateResult = await Appointment.updateMany(
      { doctor: removeDoctorId },
      { doctor: keepDoctorId }
    );
    console.log('Updated Appointments:', appointmentUpdateResult);

    // Merge patients
    const mergedPatients = [
      ...new Set([
        ...keepDoctor.patients.map(p => p.toString()),
        ...removeDoctor.patients.map(p => p.toString())
      ])
    ];

    // Merge appointments
    const mergedAppointments = [
      ...new Set([
        ...keepDoctor.appointments.map(a => a.toString()),
        ...removeDoctor.appointments.map(a => a.toString())
      ])
    ];

    // Update Rico's profile with merged data
    keepDoctor.patients = mergedPatients;
    keepDoctor.appointments = mergedAppointments;
    
    // Optional: Update any additional fields from Dr. Smith's profile
    if (removeDoctor.schedule && Object.keys(removeDoctor.schedule).length) {
      keepDoctor.schedule = removeDoctor.schedule;
    }

    await keepDoctor.save();

    // Remove Dr. Smith's profile
    await Doctor.findByIdAndDelete(removeDoctorId);

    console.log('Doctor profiles consolidated successfully');
    console.log('Updated Rico Profile:', {
      patients: keepDoctor.patients.length,
      appointments: keepDoctor.appointments.length
    });

  } catch (error) {
    console.error('Error consolidating doctor profiles:', error);
  } finally {
    await mongoose.disconnect();
  }
}

consolidateDoctorProfiles();