const Patient = require('../models/Patient');
const { AppError } = require('../middleware/errorHandler');

const patientController = {
  // Create patient
  create: async (req, res, next) => {
    try {
      // Check if patient already exists
      const existingPatient = await Patient.findOne({ 
        'contact.email': req.body.contact?.email 
      });
      
      if (existingPatient) {
        throw new AppError('Patient with this email already exists', 400);
      }

      const patient = new Patient({
        userId: req.user.id,
        ...req.body
      });
      
      await patient.save();
      
      res.status(201).json({
        status: 'success',
        data: patient
      });
    } catch (error) {
      next(error);
    }
  },

  // Get all patients
  getAll: async (req, res, next) => {
    try {
      const patients = await Patient.find().populate('appointments');
      
      res.json({
        status: 'success',
        results: patients.length,
        data: patients
      });
    } catch (error) {
      next(error);
    }
  },

  // Get patient by ID
  getById: async (req, res, next) => {
    try {
      const patient = await Patient.findById(req.params.id)
        .populate('appointments')
        .populate('prescriptions');

      if (!patient) {
        throw new AppError('Patient not found', 404);
      }

      res.json({
        status: 'success',
        data: patient
      });
    } catch (error) {
      next(error);
    }
  },

  // Update patient
  update: async (req, res, next) => {
    try {
      const patient = await Patient.findByIdAndUpdate(
        req.params.id,
        req.body,
        { 
          new: true,
          runValidators: true 
        }
      );

      if (!patient) {
        throw new AppError('Patient not found', 404);
      }

      res.json({
        status: 'success',
        data: patient
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete patient
  delete: async (req, res, next) => {
    try {
      const patient = await Patient.findById(req.params.id);

      if (!patient) {
        throw new AppError('Patient not found', 404);
      }

      // Check if patient has active appointments
      if (patient.appointments && patient.appointments.length > 0) {
        throw new AppError('Cannot delete patient with active appointments', 400);
      }

      await patient.remove();

      res.json({
        status: 'success',
        message: 'Patient deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = patientController;