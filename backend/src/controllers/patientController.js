const Patient = require('../models/Patient');
const { AppError } = require('../middleware/errorHandler');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');

const patientController = {
  // Dashboard Data
  getDashboardData: async (req, res, next) => {
    try {
      const patient = await Patient.findOne({ userId: req.user.id });
      
      if (!patient) {
        return res.json({
          status: 'success',
          data: {
            appointments: [],
            stats: {
              totalAppointments: 0,
              upcomingAppointments: 0
            }
          }
        });
      }
  
      const appointments = await Appointment.find({ 
        patient: patient._id 
      })
      .populate('doctor', 'name specialization')
      .sort('-date');
  
      res.json({
        status: 'success',
        data: {
          appointments: appointments,
          stats: {
            totalAppointments: appointments.length,
            upcomingAppointments: appointments.filter(
              apt => new Date(apt.date) > new Date()
            ).length,
          }
        }
      });
    } catch (error) {
      next(error);
    }
  },
  // Profile Methods
  getMyProfile: async (req, res, next) => {
    try {
      const patient = await Patient.findOne({ userId: req.user.id });
      
      if (!patient) {
        throw new AppError('Patient profile not found', 404);
      }
  
      res.json({
        status: 'success',
        data: patient
      });
    } catch (error) {
      next(error);
    }
  },

  // Appointments Methods
  getAppointments: async (req, res, next) => {
    try {
      const patient = await Patient.findOne({ userId: req.user.id });
      
      if (!patient) {
        return res.json({
          status: 'success',
          data: []
        });
      }
      
      const appointments = await Appointment.find({
        patient: patient._id
      })
      .populate('doctor', 'name specialization')
      .sort('-date');
  
      // Add these console logs
      console.log('Appointments Fetched:', appointments.map(apt => ({
        id: apt._id,
        doctorId: apt.doctor._id,
        doctorName: apt.doctor.name
      })));
  
      res.json({
        status: 'success',
        data: appointments
      });
    } catch (error) {
      next(error);
    }
  },

  requestAppointment: async (req, res, next) => {
    try {
      const patient = await Patient.findOne({ userId: req.user.id });
  
      console.log('Request Body:', req.body);
      console.log('Selected Doctor ID:', req.body.doctor);
  
      const doctor = await Doctor.findById(req.body.doctor);
      console.log('Found Doctor:', doctor);
  
      const appointment = new Appointment({
        doctor: req.body.doctor, // Explicitly use the doctor ID
        patient: patient._id,
        date: req.body.date,
        time: req.body.time,
        type: req.body.type,
        notes: req.body.notes || '',
        status: 'scheduled'
      });
  
      await appointment.save();
  
      console.log('Created Appointment:', {
        id: appointment._id,
        doctorId: appointment.doctor,
        doctorName: doctor.name
      });
  
      res.status(201).json({
        status: 'success',
        data: appointment
      });
    } catch (error) {
      console.error('Appointment Creation Error:', error);
      next(error);
    }
  },

  cancelAppointment: async (req, res, next) => {
    try {
      const patient = await Patient.findOne({ userId: req.user.id });
      
      const appointment = await Appointment.findOneAndUpdate(
        { _id: req.params.id, patient: patient._id },
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

  // Prescriptions Methods
  getPrescriptions: async (req, res, next) => {
    try {
      const patient = await Patient.findOne({ userId: req.user.id });
      
      // Placeholder for prescriptions
      const prescriptions = [];
  
      res.json({
        status: 'success',
        data: prescriptions
      });
    } catch (error) {
      next(error);
    }
  },

  getPrescriptionById: async (req, res, next) => {
    try {
      // Placeholder method until prescription model is implemented
      res.json({
        status: 'success',
        data: null
      });
    } catch (error) {
      next(error);
    }
  },

  getBills: async (req, res, next) => {
    try {
      // Placeholder for bills
      res.json({
        status: 'success',
        data: []
      });
    } catch (error) {
      next(error);
    }
  },
  
  getBillById: async (req, res, next) => {
    try {
      // Placeholder for single bill
      res.json({
        status: 'success',
        data: null
      });
    } catch (error) {
      next(error);
    }
  },

  // Doctors Method
  getDoctors: async (req, res, next) => {
    try {
      const doctors = await Doctor.find()
        .select('name specialization');
  
      res.json({
        status: 'success',
        data: doctors
      });
    } catch (error) {
      next(error);
    }
  },

  updateProfile: async (req, res, next) => {
    try {
      const patient = await Patient.findOne({ userId: req.user.id });
      
      if (!patient) {
        throw new AppError('Patient profile not found', 404);
      }
  
      // Update patient profile
      Object.assign(patient, req.body);
      await patient.save();
  
      res.json({
        status: 'success',
        data: patient
      });
    } catch (error) {
      next(error);
    }
  },
  
  getMedicalRecords: async (req, res, next) => {
    try {
      // Placeholder for medical records
      res.json({
        status: 'success',
        data: []
      });
    } catch (error) {
      next(error);
    }
  },
  
  getMedicalRecordById: async (req, res, next) => {
    try {
      // Placeholder for single medical record
      res.json({
        status: 'success',
        data: null
      });
    } catch (error) {
      next(error);
    }
  },

  // CRUD Methods
  create: async (req, res, next) => {
    try {
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

  delete: async (req, res, next) => {
    try {
      const patient = await Patient.findById(req.params.id);

      if (!patient) {
        throw new AppError('Patient not found', 404);
      }

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