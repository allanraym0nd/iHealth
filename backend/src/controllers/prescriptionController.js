const Prescription = require('../models/Prescription');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const { AppError } = require('../middleware/errorHandler');

const prescriptionController = {
  // Create new prescription
  create: async (req, res, next) => {
    try {
      const doctor = await Doctor.findOne({ userId: req.user.id });
      if (!doctor) {
        throw new AppError('Doctor not found', 404);
      }

      const prescription = new Prescription({
        doctor: doctor._id,
        patient: req.body.patientId,
        medications: req.body.medications,
        notes: req.body.notes
      });

      await prescription.save();

      res.status(201).json({
        status: 'success',
        data: prescription
      });
    } catch (error) {
      next(error);
    }
  },

  // Get all prescriptions for a doctor
  getAll: async (req, res, next) => {
    try {
      const doctor = await Doctor.findOne({ userId: req.user.id });
      const prescriptions = await Prescription.find({ doctor: doctor._id })
        .populate('patient', 'name')
        .sort('-createdAt');

      res.json({
        status: 'success',
        data: prescriptions
      });
    } catch (error) {
      next(error);
    }
  },

  // Get a specific prescription
  getById: async (req, res, next) => {
    try {
      const prescription = await Prescription.findById(req.params.id)
        .populate('patient', 'name')
        .populate('doctor', 'name');

      if (!prescription) {
        throw new AppError('Prescription not found', 404);
      }

      res.json({
        status: 'success',
        data: prescription
      });
    } catch (error) {
      next(error);
    }
  },

  // Update prescription status
  updateStatus: async (req, res, next) => {
    try {
      const prescription = await Prescription.findByIdAndUpdate(
        req.params.id,
        { status: req.body.status },
        { new: true, runValidators: true }
      );

      if (!prescription) {
        throw new AppError('Prescription not found', 404);
      }

      res.json({
        status: 'success',
        data: prescription
      });
    } catch (error) {
      next(error);
    }
  },

  // Get patient prescriptions
  getPatientPrescriptions: async (req, res, next) => {
    try {
      const prescriptions = await Prescription.find({ 
        patient: req.params.patientId 
      })
      .populate('doctor', 'name')
      .sort('-createdAt');

      res.json({
        status: 'success',
        data: prescriptions
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = prescriptionController;