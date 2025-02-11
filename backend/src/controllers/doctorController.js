const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const { AppError } = require('../middleware/errorHandler');
const Appointment = require('../models/Appointment');


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
  createPatient: async (req, res, next) => {
    try {
      const doctor = await Doctor.findOne({ userId: req.user.id });
      if (!doctor) {
        throw new AppError('Doctor not found', 404);
      }
  
      const patient = new Patient({
        name: req.body.name,
        age: req.body.age,
        gender: req.body.gender || 'Other', // Add a default if not provided
        contact: {
          phone: req.body.contact.phone,
          email: req.body.contact.email
        },
        status: req.body.status || 'active'
      });
  
      await patient.save();
      doctor.patients.push(patient._id);
      await doctor.save();
  
      res.status(201).json({ status: 'success', data: patient });
    } catch (error) {
      next(error);
    }
  },
  getPatients: async (req, res, next) => {
    try {
      console.log('User ID:', req.user.id);
      
      // Check if doctor exists
      const doctorExists = await Doctor.findOne({ userId: req.user.id });
      console.log('Doctor exists:', !!doctorExists);
  
      if (!doctorExists) {
        console.log('No doctor found. Creating new doctor...');
        const newDoctor = new Doctor({
          userId: req.user.id,
          name: 'Default Doctor',
          specialization: 'General',
          patients: []
        });
        await newDoctor.save();
      }
  
      // Fetch doctor with populated patients
      const doctor = await Doctor.findOne({ userId: req.user.id })
        .populate('patients');
      
      console.log('Patients count:', doctor.patients.length);
      
      res.json({
        status: 'success',
        data: doctor.patients
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

createAppointment: async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (!doctor) {
      throw new AppError('Doctor not found', 404);
    }

    const appointment = new Appointment({
      doctor: doctor._id,
      patient: req.body.patientId,
      date: req.body.date,
      time: req.body.time,
      type: req.body.type,
      notes: req.body.notes,
      status: 'scheduled'
    });

    await appointment.save();
    doctor.appointments.push(appointment._id);
    await doctor.save();

    res.status(201).json({
      status: 'success',
      data: appointment
    });
  } catch (error) {
    next(error);
  }
},

getAppointments: async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user.id })
      .populate({
        path: 'appointments',
        populate: {
          path: 'patient',
          model: 'Patient'
        }
      });
    
    res.json({
      status: 'success',
      data: doctor.appointments || []
    });
  } catch (error) {
    next(error);
  }
},

cancelAppointment: async (req, res, next) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: 'Cancelled' },
      { new: true }
    );

    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    res.json({
      status: 'success',
      data: appointment
    });
  } catch (error) {
    next(error);
  }
},

completeAppointment: async (req, res, next) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id, 
      { 
        status: 'completed',
        completedAt: new Date()
      },
      { new: true }
    ).populate('patient');

    if (!appointment) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Appointment not found' 
      });
    }

    res.json({
      status: 'success',
      data: appointment
    });
  } catch (error) {
    next(error);
  }
},

rescheduleAppointment: async (req, res, next) => {
  try {
    const { date, time } = req.body;
    
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { 
        date, 
        time,
        status: 'scheduled' // Reset to scheduled if it was cancelled
      },
      { new: true }
    ).populate('patient');

    if (!appointment) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Appointment not found' 
      });
    }

    res.json({
      status: 'success',
      data: appointment
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