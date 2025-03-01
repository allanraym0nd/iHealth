// receptionController.js
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const { AppError } = require('../middleware/errorHandler');

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
  registerPatient: async (req, res, next) => {
    try {
      const { 
        name, 
        age, 
        gender, 
        contact,
        emergencyContact,
        medicalHistory
      } = req.body;

      const newPatient = new Patient({
        name,
        age,
        gender,
        contact,
        emergencyContact,
        medicalHistory,
        status: 'active'
      });

      await newPatient.save();

      res.status(201).json({
        status: 'success',
        message: 'Patient registered successfully',
        data: newPatient
      });
    } catch (error) {
      next(new AppError('Failed to register patient', 500));
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

  // Get dashboard statistics
  getDashboardStats: async (req, res, next) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayAppointmentsCount = await Appointment.countDocuments({
        date: {
          $gte: today,
          $lt: tomorrow
        }
      });

      const newPatientsToday = await Patient.countDocuments({
        createdAt: {
          $gte: today,
          $lt: tomorrow
        }
      });

      const waitingPatients = await Appointment.find({
        date: {
          $gte: today,
          $lt: tomorrow
        },
        status: 'Waiting'
      }).countDocuments();

      res.json({
        status: 'success',
        data: {
          todayAppointments: todayAppointmentsCount,
          newPatients: newPatientsToday,
          waitingPatients
        }
      });
    } catch (error) {
      next(new AppError('Failed to fetch dashboard stats', 500));
    }
  }
};

module.exports = receptionController;