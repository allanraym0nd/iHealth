const MedicalRecord = require('../models/MedicalRecord');
const Patient = require('../models/Patient');
const { AppError } = require('../middleware/errorHandler');

const medicalRecordController = {
  create: async (req, res, next) => {
    try {
      const { patientId, diagnosis, symptoms, treatment, notes } = req.body;

      const medicalRecord = new MedicalRecord({
        patient: patientId,
        doctor: req.user.id,
        diagnosis,
        symptoms,
        treatment,
        notes
      });

      await medicalRecord.save();

      res.status(201).json({
        status: 'success',
        data: medicalRecord
      });
    } catch (error) {
      next(error);
    }
  },

  getAll: async (req, res, next) => {
    try {
      const records = await MedicalRecord.find({ doctor: req.user.id })
        .populate('patient')
        .sort('-date');

      res.json({
        status: 'success',
        data: records
      });
    } catch (error) {
      next(error);
    }
  },

  getPatientRecords: async (req, res, next) => {
    try {
      const records = await MedicalRecord.find({ 
        patient: req.params.patientId,
        doctor: req.user.id 
      })
      .populate('patient')
      .sort('-date');

      res.json({
        status: 'success',
        data: records
      });
    } catch (error) {
      next(error);
    }
  },

  getById: async (req, res, next) => {
    try {
      const record = await MedicalRecord.findById(req.params.id)
        .populate('patient')
        .populate('prescriptions')
        .populate('testResults');

      if (!record) {
        throw new AppError('Medical record not found', 404);
      }

      res.json({
        status: 'success',
        data: record
      });
    } catch (error) {
      next(error);
    }
  },

  update: async (req, res, next) => {
    try {
      const record = await MedicalRecord.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );

      if (!record) {
        throw new AppError('Medical record not found', 404);
      }

      res.json({
        status: 'success',
        data: record
      });
    } catch (error) {
      next(error);
    }
  },

  delete: async (req, res, next) => {
    try {
      const record = await MedicalRecord.findById(req.params.id);

      if (!record) {
        throw new AppError('Medical record not found', 404);
      }

      if (record.doctor.toString() !== req.user.id) {
        throw new AppError('Not authorized to delete this record', 403);
      }

      await record.remove();

      res.json({
        status: 'success',
        message: 'Medical record deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = medicalRecordController;