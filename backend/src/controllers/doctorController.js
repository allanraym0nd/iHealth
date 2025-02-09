const Doctor = require('../models/Doctor');
const { AppError } = require('../middleware/errorHandler');


const doctorController = {
  // Create doctor
  create: async (req, res, next) => {
    try {
      // Check if doctor already exists with same email
      const existingDoctor = await Doctor.findOne({ 
        'contact.email': req.body.contact?.email 
      });
      
      if (existingDoctor) {
        throw new AppError('Doctor with this email already exists', 400);
      }

      const doctor = new Doctor({
        userId: req.user.id,
        ...req.body
      });
      
      await doctor.save();
      
      res.status(201).json({
        status: 'success',
        data: doctor
      });
    } catch (error) {
      next(error);
    }
  },

  // Get all doctors
  getAll: async (req, res, next) => {
    try {
      const doctors = await Doctor.find();
      res.json({
        status: 'success',
        data: doctors
      });
    } catch (error) {
      next(error);
    }
  },

  getPatients: async (req, res, next) => {
    try {
      console.log('Getting patients for user:', req.user.id);
      
      // First try to find the doctor
      let doctor = await Doctor.findOne({ userId: req.user.id });
      
      // If no doctor record exists, create one
      if (!doctor) {
        console.log('No doctor record found, creating one...');
        doctor = new Doctor({
          userId: req.user.id,
          name: 'Dr. Smith', // Default name
          specialization: 'General',
          patients: []
        });
        await doctor.save();
        console.log('Created new doctor record');
      }
  
      // Return patients (even if empty array)
      res.json({
        status: 'success',
        data: doctor.patients || []
      });
    } catch (error) {
      console.error('Error in getPatients:', error);
      next(error);
    }
  },

  // Get doctor by ID
  getById: async (req, res, next) => {
    try {
      const doctor = await Doctor.findById(req.params.id)
        .populate('patients')
        .populate('appointments');

      if (!doctor) {
        throw new AppError('Doctor not found', 404);
      }

      res.json({
        status: 'success',
        data: doctor
      });
    } catch (error) {
      next(error);
    }
  },

  // Update doctor
  update: async (req, res, next) => {
    try {
      // Check if schedule update is valid
      if (req.body.schedule) {
        const { workHours } = req.body.schedule;
        if (workHours) {
          // Validate work hours format and logic
          const startTime = new Date(`2000-01-01 ${workHours.start}`);
          const endTime = new Date(`2000-01-01 ${workHours.end}`);
          
          if (startTime >= endTime) {
            throw new AppError('End time must be after start time', 400);
          }
        }
      }

      const doctor = await Doctor.findByIdAndUpdate(
        req.params.id,
        req.body,
        { 
          new: true,
          runValidators: true 
        }
      );

      if (!doctor) {
        throw new AppError('Doctor not found', 404);
      }

      res.json({
        status: 'success',
        data: doctor
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete doctor
  delete: async (req, res, next) => {
    try {
      const doctor = await Doctor.findById(req.params.id);

      if (!doctor) {
        throw new AppError('Doctor not found', 404);
      }

      // Check if doctor has active appointments
      if (doctor.appointments && doctor.appointments.length > 0) {
        throw new AppError('Cannot delete doctor with active appointments', 400);
      }

      // Check if doctor has assigned patients
      if (doctor.patients && doctor.patients.length > 0) {
        throw new AppError('Cannot delete doctor with assigned patients', 400);
      }

      await doctor.remove();

      res.json({
        status: 'success',
        message: 'Doctor deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // Get doctor's schedule
  getSchedule: async (req, res, next) => {
    try {
      const doctor = await Doctor.findById(req.params.id)
        .select('schedule appointments');

      if (!doctor) {
        throw new AppError('Doctor not found', 404);
      }

      res.json({
        status: 'success',
        data: {
          workDays: doctor.schedule.workDays,
          workHours: doctor.schedule.workHours,
          appointments: doctor.appointments
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Add these to your existing doctorController object
getProfile: async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (!doctor) {
      throw new AppError('Doctor not found', 404);
    }
    res.json({
      status: 'success',
      data: doctor
    });
  } catch (error) {
    next(error);
  }
},



getAppointments: async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user.id });

    if (!doctor) {
      throw new AppError('Doctor not found', 404);
    }

    // Return empty array if no appointments
    res.json({
      status: 'success',
      data: []  // Initially return empty array since we haven't added any appointments yet
    });
  } catch (error) {
    next(error);
  }
},

getSchedule: async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user.id });
    res.json({
      status: 'success',
      data: doctor.schedule
    });
  } catch (error) {
    next(error);
  }
}
};

module.exports = doctorController;