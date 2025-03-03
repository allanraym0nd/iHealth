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
},

// Get current appointment queue
getCurrentQueue: async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all appointments for today that are scheduled, waiting, or in-progress
    const queuedAppointments = await Appointment.find({
      date: {
        $gte: today,
        $lt: tomorrow
      },
      status: { $in: ['scheduled', 'waiting', 'in-progress'] }
    })
    .populate('patient', 'name age gender contact')
    .populate('doctor', 'name specialization')
    .sort({ priority: -1, time: 1 });

    res.json({
      status: 'success',
      data: queuedAppointments
    });
  } catch (error) {
    next(new AppError('Failed to fetch appointment queue', 500));
  }
},

// Update appointment status
updateQueueStatus: async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, queuePosition } = req.body;

    // Validate the status
    const validStatuses = ['scheduled', 'waiting', 'in-progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return next(new AppError('Invalid status', 400));
    }

    // Update the appointment
    const appointment = await Appointment.findByIdAndUpdate(
      id,
      { 
        status,
        ...(queuePosition !== undefined && { queuePosition })
      },
      { new: true }
    )
    .populate('patient', 'name age gender contact')
    .populate('doctor', 'name specialization');

    if (!appointment) {
      return next(new AppError('Appointment not found', 404));
    }

    res.json({
      status: 'success',
      message: 'Appointment updated successfully',
      data: appointment
    });
  } catch (error) {
    next(new AppError('Failed to update appointment', 500));
  }
},

// Reorder queue positions
reorderQueue: async (req, res, next) => {
  try {
    const { appointments } = req.body;
    
    if (!Array.isArray(appointments)) {
      return next(new AppError('Invalid input format', 400));
    }

    // Update queue positions in a transaction
    const updatedAppointments = [];
    
    for (const apt of appointments) {
      const { id, queuePosition } = apt;
      const updated = await Appointment.findByIdAndUpdate(
        id,
        { queuePosition },
        { new: true }
      )
      .populate('patient', 'name')
      .populate('doctor', 'name');
      
      if (updated) {
        updatedAppointments.push(updated);
      }
    }

    res.json({
      status: 'success',
      message: 'Queue reordered successfully',
      data: updatedAppointments
    });
  } catch (error) {
    next(new AppError('Failed to reorder queue', 500));
  }
},


calculateWaitingTime: async (req, res, next) => {
  try {
    const { appointmentId } = req.params;
    
    // Get the appointment
    const appointment = await Appointment.findById(appointmentId)
      .populate('doctor')
      .populate('patient');
    
    if (!appointment) {
      return next(new AppError('Appointment not found', 404));
    }
    
    // Get all waiting and in-progress appointments ahead of this one
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const aheadAppointments = await Appointment.find({
      doctor: appointment.doctor._id,
      date: {
        $gte: today,
        $lt: tomorrow
      },
      status: { $in: ['waiting', 'in-progress'] },
      time: { $lt: appointment.time }
    });
    
    // Calculate estimated waiting time
    // Assuming average appointment duration is 15 minutes
    const averageAppointmentDuration = 15; // minutes
    const waitingTime = aheadAppointments.length * averageAppointmentDuration;
    
    // Calculate estimated start time
    const now = new Date();
    const estimatedStartTime = new Date(now.getTime() + waitingTime * 60000);
    
    res.json({
      status: 'success',
      data: {
        estimatedWaitingTime: waitingTime,
        estimatedStartTime: estimatedStartTime,
        aheadInQueue: aheadAppointments.length
      }
    });
  } catch (error) {
    next(new AppError('Failed to calculate waiting time', 500));
  }
},

// Add to receptionController.js

// Get appointment analytics
getAppointmentAnalytics: async (req, res, next) => {
  try {
    const { period } = req.query; // 'day', 'week', 'month'
    
    // Calculate date range based on period
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let startDate = new Date(today);
    
    if (period === 'week') {
      startDate.setDate(today.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(today.getMonth() - 1);
    } else {
      // Default to day
      startDate = today;
    }
    
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 1);
    
    // Get all appointments in the date range
    const appointments = await Appointment.find({
      date: { $gte: startDate, $lt: endDate }
    }).populate('doctor', 'name specialization').populate('patient', 'name');
    
    // Calculate analytics
    const totalAppointments = appointments.length;
    const completedAppointments = appointments.filter(apt => apt.status === 'completed').length;
    const cancelledAppointments = appointments.filter(apt => apt.status === 'cancelled').length;
    
    // Group by status
    const statusCounts = appointments.reduce((acc, apt) => {
      acc[apt.status] = (acc[apt.status] || 0) + 1;
      return acc;
    }, {});
    
    // Group by type
    const typeCounts = appointments.reduce((acc, apt) => {
      acc[apt.type] = (acc[apt.type] || 0) + 1;
      return acc;
    }, {});
    
    // Group by doctor
    const doctorCounts = appointments.reduce((acc, apt) => {
      const doctorName = apt.doctor ? apt.doctor.name : 'Unassigned';
      acc[doctorName] = (acc[doctorName] || 0) + 1;
      return acc;
    }, {});
    
    // Calculate time distribution if there's actual duration data
    let averageDuration = null;
    const appointmentsWithDuration = appointments.filter(apt => apt.actualDuration);
    if (appointmentsWithDuration.length > 0) {
      averageDuration = appointmentsWithDuration.reduce((sum, apt) => sum + apt.actualDuration, 0) / 
        appointmentsWithDuration.length;
    }
    
    // Get patient data for the same period
    const newPatients = await Patient.countDocuments({
      createdAt: { $gte: startDate, $lt: endDate }
    });
    
    res.json({
      status: 'success',
      data: {
        period,
        startDate,
        endDate,
        totalAppointments,
        completedAppointments,
        cancelledAppointments,
        statusCounts,
        typeCounts,
        doctorCounts,
        averageDuration,
        newPatients
      }
    });
  } catch (error) {
    next(new AppError('Failed to get appointment analytics', 500));
  }
}

};

module.exports = receptionController;