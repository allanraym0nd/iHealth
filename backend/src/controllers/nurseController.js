const Nurse = require('../models/Nurse');
const { AppError } = require('../middleware/errorHandler');

const nurseController = {
  // Create nurse
  create: async (req, res, next) => {
    try {
      // Check if nurse already exists with same email
      const existingNurse = await Nurse.findOne({ 
        'contact.email': req.body.contact?.email 
      });
      
      if (existingNurse) {
        throw new AppError('Nurse with this email already exists', 400);
      }

      const nurse = new Nurse({
        userId: req.user.id,
        ...req.body
      });
      
      await nurse.save();
      
      res.status(201).json({
        status: 'success',
        data: nurse
      });
    } catch (error) {
      next(error);
    }
  },

  // Get all nurses
  getAll: async (req, res, next) => {
    try {
      const nurses = await Nurse.find()
        .populate('patients');
      
      res.json({
        status: 'success',
        results: nurses.length,
        data: nurses
      });
    } catch (error) {
      next(error);
    }
  },

  // Get nurse by ID
  getById: async (req, res, next) => {
    try {
      const nurse = await Nurse.findById(req.params.id)
        .populate('patients');

      if (!nurse) {
        throw new AppError('Nurse not found', 404);
      }

      res.json({
        status: 'success',
        data: nurse
      });
    } catch (error) {
      next(error);
    }
  },

  // Update nurse
  update: async (req, res, next) => {
    try {
      // Validate shift change if provided
      if (req.body.shift) {
        // Check if nurse has ongoing duties in current shift
        const nurse = await Nurse.findById(req.params.id);
        if (nurse && nurse.patients.length > 0) {
          throw new AppError('Cannot change shift while assigned to patients', 400);
        }
      }

      const updatedNurse = await Nurse.findByIdAndUpdate(
        req.params.id,
        req.body,
        { 
          new: true,
          runValidators: true 
        }
      );

      if (!updatedNurse) {
        throw new AppError('Nurse not found', 404);
      }

      res.json({
        status: 'success',
        data: updatedNurse
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete nurse
  delete: async (req, res, next) => {
    try {
      const nurse = await Nurse.findById(req.params.id);

      if (!nurse) {
        throw new AppError('Nurse not found', 404);
      }

      // Check if nurse has assigned patients
      if (nurse.patients && nurse.patients.length > 0) {
        throw new AppError('Cannot delete nurse with assigned patients', 400);
      }

      await nurse.remove();

      res.json({
        status: 'success',
        message: 'Nurse deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = nurseController;