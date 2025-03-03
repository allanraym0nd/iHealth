// receptionController.js
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const { AppError } = require('../middleware/errorHandler');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const receptionController = {
  // Get all patients
  getAllPatients: async (req, res, next) => {
    try {
      const patients = await Patient.find()
        .select('name age gender contact status')
        .sort({ createdAt: -1 });
      
      res.json({
        status: 'success',
        data: patients
      });
    } catch (error) {
      next(new AppError('Failed to fetch patients', 500));
    }
  },

  // Get today's appointments
  getTodayAppointments: async (req, res, next) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const appointments = await Appointment.find({
        date: {
          $gte: today,
          $lt: tomorrow
        }
      })
      .populate('patient', 'name')
      .populate('doctor', 'name')
      .sort({ date: 1 });

      res.json({
        status: 'success',
        data: appointments
      });
    } catch (error) {
      next(new AppError('Failed to fetch today\'s appointments', 500));
    }
  },

  // Register a new patient
// Modified registerPatient function without transactions
registerPatient: async (req, res, next) => {
  try {
    const { 
      name, 
      age, 
      gender,
      dateOfBirth,
      contact,
      emergencyContact,
      medicalHistory,
      insurance,
      status
    } = req.body;

    console.log('Processing patient registration:', req.body);

    // Generate a default password
    const defaultPassword = Math.random().toString(36).slice(-8);

    // Hash the password
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // Create User with patient's email
    const user = new User({
      username: contact.email, // Use the email from contact
      password: hashedPassword,
      role: 'patient'
    });

    const savedUser = await user.save();

    // Create Patient with user reference
    const newPatient = new Patient({
      userId: savedUser._id,
      name,
      age,
      gender,
      dateOfBirth,
      contact,
      emergencyContact,
      medicalHistory,
      insurance,
      status: status || 'active'
    });

    const savedPatient = await newPatient.save();

    res.status(201).json({
      status: 'success',
      message: 'Patient registered successfully',
      data: {
        patient: savedPatient,
        username: savedUser.username,
        tempPassword: defaultPassword // Only for development
      }
    });
  } catch (error) {
    console.error('Patient registration error:', error);
    return next(new AppError(`Failed to register patient: ${error.message}`, 500));
  }
},
  // Update patient information
  updatePatient: async (req, res, next) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const patient = await Patient.findByIdAndUpdate(
        id, 
        updateData, 
        { new: true, runValidators: true }
      );

      if (!patient) {
        return next(new AppError('Patient not found', 404));
      }

      res.json({
        status: 'success',
        message: 'Patient information updated',
        data: patient
      });
    } catch (error) {
      next(new AppError('Failed to update patient', 500));
    }
  },

  // Get dashboard statistic
 getDashboardStats: async (req, res, next) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Patient Statistics
      const [
        newPatientsToday, 
        totalPatients, 
        patientDemographics, 
        todayAppointments,
        activeDoctors
      ] = await Promise.all([
        Patient.countDocuments({
          createdAt: {
            $gte: today,
            $lt: tomorrow
          }
        }),
        Patient.countDocuments(),
        Patient.aggregate([
          {
            $group: {
              _id: '$gender',
              count: { $sum: 1 }
            }
          }
        ]),
        Appointment.find({
          date: {
            $gte: today,
            $lt: tomorrow
          }
        })
        .populate('patient', 'name')
        .populate('doctor', 'name')
        .sort({ date: 1 }),
        Doctor.countDocuments({
          status: 'active'
        })
      ]);

      const appointmentStats = {
        total: todayAppointments.length,
        scheduled: todayAppointments.filter(apt => apt.status === 'scheduled').length,
        completed: todayAppointments.filter(apt => apt.status === 'completed').length,
        cancelled: todayAppointments.filter(apt => apt.status === 'cancelled').length
      };

      res.json({
        status: 'success',
        data: {
          patients: {
            newToday: newPatientsToday,
            total: totalPatients,
            demographics: patientDemographics
          },
          appointments: {
            total: appointmentStats.total,
            scheduled: appointmentStats.scheduled,
            completed: appointmentStats.completed,
            cancelled: appointmentStats.cancelled,
            details: todayAppointments
          },
          facility: {
            activeDoctors
          }
        }
      });
    } catch (error) {
      next(new AppError('Failed to fetch dashboard statistics', 500));
    }
  },

  // Create appointment from reception
createAppointment: async (req, res, next) => {
  try {
    const { patientId, doctorId, date, time, type, notes, priority } = req.body;

    // Validate patient and doctor exist
    const patient = await Patient.findById(patientId);
    const doctor = await Doctor.findById(doctorId);

    if (!patient) {
      return next(new AppError('Patient not found', 404));
    }

    if (!doctor) {
      return next(new AppError('Doctor not found', 404));
    }

    // Create new appointment
    const newAppointment = new Appointment({
      patient: patientId,
      doctor: doctorId,
      date,
      time,
      type,
      notes,
      createdBy: 'reception',
      priority: priority || 'routine',
      status: 'scheduled'
    });

    await newAppointment.save();

    res.status(201).json({
      status: 'success',
      message: 'Appointment created successfully',
      data: newAppointment
    });
  } catch (error) {
    next(new AppError('Failed to create appointment', 500));
  }
},

// Get available doctors for appointment scheduling
getAvailableDoctors: async (req, res, next) => {
  try {
    const { date, time } = req.query;

    // Find doctors without conflicting appointments
    const conflictingAppointments = await Appointment.find({
      date,
      time,
      status: { $nin: ['cancelled'] }
    });

    const availableDoctors = await Doctor.find({
      _id: { $nin: conflictingAppointments.map(apt => apt.doctor) }
    }).select('name specialization');

    res.json({
      status: 'success',
      data: availableDoctors
    });
  } catch (error) {
    next(new AppError('Failed to fetch available doctors', 500));
  }
},

// Update appointment status (for queue management)
updateAppointmentStatus: async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const appointment = await Appointment.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('patient', 'name').populate('doctor', 'name');

    if (!appointment) {
      return next(new AppError('Appointment not found', 404));
    }

    res.json({
      status: 'success',
      message: 'Appointment status updated',
      data: appointment
    });
  } catch (error) {
    next(new AppError('Failed to update appointment status', 500));
  }
}
};

module.exports = receptionController;