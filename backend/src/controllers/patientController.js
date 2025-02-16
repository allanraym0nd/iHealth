const Patient = require('../models/Patient');
const Billing = require('../models/Billing');
const { AppError } = require('../middleware/errorHandler');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const MedicalRecord = require('../models/MedicalRecord');
const Prescription = require('../models/Prescription');


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
     // console.log('Appointments Fetched:', appointments.map(apt => ({
      //  id: apt._id,
      //  doctorId: apt.doctor._id,
      //  doctorName: apt.doctor.name
   //   })));
  
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
  
   //   console.log('Request Body:', req.body);
    //  console.log('Selected Doctor ID:', req.body.doctor);
  
      const doctor = await Doctor.findById(req.body.doctor);
  //    console.log('Found Doctor:', doctor);
  
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
  
     // console.log('Created Appointment:', {
    //    id: appointment._id,
     //   doctorId: appointment.doctor,
    //    doctorName: doctor.name
     // });
  
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
      
      const prescriptions = await Prescription.find({ patient: patient._id })
        .populate('doctor', 'name')
        .sort('-createdAt');
  
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
      const patient = await Patient.findOne({ userId: req.user.id });
      
      const prescription = await Prescription.findOne({
        _id: req.params.id,
        patient: patient._id
      }).populate('doctor', 'name');
  
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
  getBillingData: async (req, res, next) => {
    try {
      const patient = await Patient.findOne({ userId: req.user.id });
      
      const billing = await Billing.findOne({ patient: patient._id });
      if (!billing) {
        // Create default billing record if none exists
        const newBilling = await Billing.create({
          patient: patient._id,
          invoices: [{
            items: [{
              service: 'General Checkup',
              description: 'Regular medical examination',
              amount: 150
            }],
            totalAmount: 150,
            status: 'Pending',
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
          }],
          expenses: [{
            category: 'Consultation',
            amount: 150,
            date: new Date(),
            description: 'Initial consultation fee'
          }],
          insuranceClaims: [{
            provider: 'Sample Insurance Co',
            claimNumber: 'CLM001',
            amount: 120,
            status: 'Processing',
            submissionDate: new Date()
          }]
        });
  
        return res.json({
          status: 'success',
          data: {
            invoices: newBilling.invoices,
            outstandingBalance: 150,
            lastPayment: null,
            insuranceCoverage: 80
          }
        });
      }
  
      // Calculate outstanding balance
      const outstandingBalance = billing.invoices
        .filter(inv => inv.status === 'Pending')
        .reduce((sum, inv) => sum + inv.totalAmount, 0);
  
      // Get last payment
      const lastPayment = billing.invoices
        .filter(inv => inv.status === 'Paid')
        .sort((a, b) => b.paidDate - a.paidDate)[0];
  
      res.json({
        status: 'success',
        data: {
          invoices: billing.invoices,
          outstandingBalance,
          lastPayment: lastPayment ? {
            amount: lastPayment.totalAmount,
            date: lastPayment.paidDate
          } : null,
          insuranceCoverage: 80
        }
      });
    } catch (error) {
      next(error);
    }
  },
  
  makePayment: async (req, res, next) => {
    try {
      const { invoiceId } = req.params;
      const { paymentMethod } = req.body;
      
      const patient = await Patient.findOne({ userId: req.user.id });
      if (!patient) {
        throw new AppError('Patient not found', 404);
      }
  
      const billing = await Billing.findOne({ patient: patient._id });
      if (!billing) {
        throw new AppError('Billing record not found', 404);
      }
  
      // Find and update the specific invoice
      const invoice = billing.invoices.id(invoiceId);
      if (!invoice) {
        throw new AppError('Invoice not found', 404);
      }
  
      // Update invoice status and payment details
      invoice.status = 'Paid';
      invoice.paidDate = new Date();
      invoice.paymentMethod = paymentMethod;
  
      await billing.save();
  
      res.json({
        status: 'success',
        message: 'Payment processed successfully',
        data: invoice
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
      const patient = await Patient.findOne({ userId: req.user.id });
      
      if (!patient) {
        return res.status(404).json({
          status: 'error',
          message: 'Patient not found'
        });
      }
  
      const medicalRecords = await MedicalRecord.find({ 
        patient: patient._id 
      })
      .populate({
        path: 'doctor',
        select: 'name' // Explicitly select the name field
      })
      .populate('prescriptions')
      .sort('-date');
  
      // Log the records to verify doctor information
      console.log('Medical Records:', JSON.stringify(medicalRecords, null, 2));
  
      res.json({
        status: 'success',
        data: medicalRecords
      });
    } catch (error) {
      console.error('Error in getMedicalRecords:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        errorDetails: error.message
      });
    }
  },
  
  
  getMedicalRecordById: async (req, res, next) => {
    try {
      const patient = await Patient.findOne({ userId: req.user.id });
      
      if (!patient) {
        return res.json({
          status: 'success',
          data: null
        });
      }
  
      const medicalRecord = await MedicalRecord.findOne({ 
        _id: req.params.id,
        patient: patient._id 
      })
      .populate('doctor', 'name specialization')
      .populate('prescriptions')
      .populate('testResults');
  
      res.json({
        status: 'success',
        data: medicalRecord
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