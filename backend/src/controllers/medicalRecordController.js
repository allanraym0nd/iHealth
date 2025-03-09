const MedicalRecord = require('../models/MedicalRecord');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const { AppError } = require('../middleware/errorHandler');


const medicalRecordController = {
  
  create: async (req, res, next) => {
    try {
      const { patientId, diagnosis, symptoms, treatment, notes, type } = req.body;
  
      console.log('Creating medical record:', {
        patientId,
        userId: req.user.id,
        diagnosis,
        symptoms,
        treatment,
        type
      });
  
      // Find the doctor using the logged-in user's ID
      const doctor = await Doctor.findOne({ userId: req.user.id });
  
      console.log('Found Doctor:', doctor);
  
      if (!doctor) {
        throw new AppError('Doctor not found', 404);
      }
  
      const medicalRecord = new MedicalRecord({
        patient: patientId,
        doctor: doctor._id,
        diagnosis,
        symptoms,
        treatment,
        notes,
        type: type || 'General' // Add this line to include the type field with a default
      });
  
      console.log('Medical Record to be saved:', medicalRecord);
  
      await medicalRecord.save();
  
      console.log('Medical Record saved successfully');
  
      res.status(201).json({
        status: 'success',
        data: medicalRecord
      });
    } catch (error) {
      console.error('Error creating medical record:', error);
      next(error);
    }
  },
   
  getAll: async (req, res, next) => {
    try {
      console.log('User ID for medical records:', req.user.id);
  
      const doctor = await Doctor.findOne({ userId: req.user.id });
      console.log('Doctor found:', doctor);
  
      const records = await MedicalRecord.find({ doctor: doctor._id })
        .populate('patient')
        .sort('-date');
  
      console.log('Medical Records found:', records);
  
      res.json({
        status: 'success',
        data: records
      });
    } catch (error) {
      console.error('Error fetching medical records:', error);
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