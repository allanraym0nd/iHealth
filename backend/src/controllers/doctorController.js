const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const bcrypt = require('bcryptjs');
const { AppError } = require('../middleware/errorHandler');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Prescription = require('../models/Prescription');
const Lab = require('../models/Lab');



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
  
      // Hash the default password
      const hashedPassword = await bcrypt.hash('123456', 10);
  
      // Create a user account for the patient
      const user = new User({
        username: req.body.contact.email,
        password: hashedPassword, // Use hashed password
        role: 'patient'
      });
  
      await user.save();
  
      const patient = new Patient({
        userId: user._id,
        name: req.body.name,
        age: req.body.age,
        gender: req.body.gender || 'Other',
        contact: {
          phone: req.body.contact.phone,
          email: req.body.contact.email
        },
        status: req.body.status || 'active'
      });
  
      await patient.save();
      doctor.patients.push(patient._id);
      await doctor.save();
  
      res.status(201).json({ 
        status: 'success', 
        data: patient 
      });
    } catch (error) {
      next(error);
    }
  },
  
    
  getPatients: async (req, res, next) => {
    try {
      // Fetch all patients, not just those associated with a specific doctor
      const patients = await Patient.find()
        .select('name age gender contact status')
        .sort({ createdAt: -1});
      
      res.json({
        status: 'success',
        data: patients
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
    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (!doctor) {
      throw new AppError('Doctor not found', 404);
    }

    // Get date filter from query parameters (defaulting to today)
    const { dateFilter } = req.query;
    
    let dateQuery = {};
    
    if (dateFilter === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      dateQuery = {
        date: {
          $gte: today,
          $lt: tomorrow
        }
      };
    } else if (dateFilter === 'week') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekLater = new Date(today);
      weekLater.setDate(weekLater.getDate() + 7);
      
      dateQuery = {
        date: {
          $gte: today,
          $lt: weekLater
        }
      };
    } else if (dateFilter === 'all') {
      // No date filter - show all
      dateQuery = {};
    } else {
      // Default to today if no valid filter specified
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      dateQuery = {
        date: {
          $gte: today,
          $lt: tomorrow
        }
      };
    }

    // Find all appointments for this doctor with date filter
    const appointments = await Appointment.find({ 
      doctor: doctor._id,
      ...dateQuery
    })
      .populate('patient')
      .sort({ date: 1, time: 1 });
    
    res.json({
      status: 'success',
      data: appointments || []
    });
  } catch (error) {
    next(error);
  }
},

cancelAppointment: async (req, res, next) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled' }, // changed from 'Cancelled' to 'cancelled'
      { new: true }
    );

    // rest of the code
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
},
getPrescriptions: async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user.id });
    const prescriptions = await Prescription.find({ doctor: doctor._id })
      .populate('patient')
      .sort('-createdAt');

    res.json({
      status: 'success',
      data: prescriptions
    });
  } catch (error) {
    next(error);
  }
},

createPrescription: async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (!doctor) {
      throw new AppError('Doctor not found', 404);
    }

    const prescription = new Prescription({
      doctor: doctor._id,
      patient: req.body.patientId,
      medications: req.body.medications,
      notes: req.body.notes,
      status: 'active'
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

// Add to doctorController.js
createLabOrder: async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (!doctor) {
      throw new AppError('Doctor not found', 404);
    }

    // Check if patient exists
    const patient = await Patient.findById(req.body.patientId);
    if (!patient) {
      throw new AppError('Patient not found', 404);
    }

    // Get the lab record (assuming there's a single lab record for the system)
    let lab = await Lab.findOne();
    if (!lab) {
      lab = new Lab(); // Create a new lab record if none exists
    }

    // Create the new test order
    const newTestOrder = {
      patient: req.body.patientId,
      doctor: doctor._id,
      testType: req.body.testType,
      status: 'Pending',
      scheduledDate: req.body.scheduledDate || new Date(),
      notes: req.body.notes,
      priority: req.body.priority || 'routine'
    };

    // Add the test order to the lab's testOrders array
    lab.testOrders.push(newTestOrder);
    await lab.save();

    // Get the newly created test order
    const testOrder = lab.testOrders[lab.testOrders.length - 1];

    res.status(201).json({
      status: 'success',
      data: testOrder
    });
  } catch (error) {
    next(error);
  }
},

// In doctorController.js - method for getting lab orders
getLabOrders: async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user.id });
    
    // Fetch all lab data
    const lab = await Lab.findOne();
    
    // Filter orders for this doctor
    const doctorOrders = lab.testOrders.filter(order => 
      order.doctor && doctor._id && 
      order.doctor.toString() === doctor._id.toString()
    );
    
    // Populate with patient data
    const populatedOrders = await Promise.all(
      doctorOrders.map(async order => {
        let patient = null;
        if (order.patient) {
          patient = await Patient.findById(order.patient);
        }
        
        return {
          ...order.toObject(),
          patient: patient || { name: 'Unknown Patient' }
        };
      })
    );
    
    res.json({
      status: 'success',
      data: populatedOrders
    });
  } catch (error) {
    next(error);
  }
},

cancelLabOrder: async (req, res, next) => {
  try {
    const lab = await Lab.findOne({ 'testOrders._id': req.params.id });
    if (!lab) {
      throw new AppError('Lab order not found', 404);
    }

    // Find the test order and update its status
    const testOrderIndex = lab.testOrders.findIndex(
      order => order._id.toString() === req.params.id
    );

    if (testOrderIndex === -1) {
      throw new AppError('Lab order not found', 404);
    }

    lab.testOrders[testOrderIndex].status = 'Cancelled';
    await lab.save();

    res.json({
      status: 'success',
      data: lab.testOrders[testOrderIndex]
    });
  } catch (error) {
    next(error);
  }
}

};



module.exports = doctorController;