const Billing = require('../models/Billing');
const { AppError } = require('../middleware/errorHandler');

const billingController = {

  createProfile: async (req, res) => {
    try {
      // Check if user already has a profile
      const existingProfile = await Billing.findOne({ userId: req.user.id });
      if (existingProfile) {
        return res.status(400).json({ message: 'Billing profile already exists for this user' });
      }
      
      // Create new billing profile
      const billing = new Billing({
        userId: req.user.id,
        name: req.body.name,
        department: req.body.department,
        position: req.body.position,
        contact: {
          email: req.body.contact.email,
          phone: req.body.contact.phone
        }
      });
      
      await billing.save();
      res.status(201).json(billing);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Create invoice
  createInvoice: async (req, res, next) => {
    try {
      const billing = await Billing.findOne({ patient: req.params.patientId }) || 
        new Billing({ patient: req.params.patientId, invoices: [] });
  
      // Calculate total amount from items
      const calculatedTotalAmount = req.body.items.reduce((sum, item) => sum + item.amount, 0);
  
      const invoice = {
        items: req.body.items,
        totalAmount: calculatedTotalAmount,
        status: 'Pending',
        dueDate: new Date(Date.now() + 30*24*60*60*1000),
        createdAt: new Date()
      };
  
      const updatedBilling = await Billing.findOneAndUpdate(
        { patient: req.params.patientId },
        { $push: { invoices: invoice }},
        { new: true, upsert: true }
      );
  
      res.status(201).json({
        status: 'success',
        data: updatedBilling.invoices[updatedBilling.invoices.length - 1]
      });
    } catch (error) {
      next(error);
    }
  },

  // Get all invoices

// Get all invoices
getInvoices: async (req, res, next) => {
  try {
    const billings = await Billing.find()
      .populate('patient', 'name');
    
    // Extract and format invoices
    const invoices = [];
    billings.forEach(billing => {
      if (billing.invoices && billing.invoices.length > 0) {
        billing.invoices.forEach(invoice => {
          invoices.push({
            _id: invoice._id,
            patientName: billing.patient ? billing.patient.name : 'Unknown',
            date: invoice.createdAt || new Date(),
            dueDate: invoice.dueDate,
            totalAmount: invoice.totalAmount,
            status: invoice.status,
            items: invoice.items,
            paymentMethod: invoice.paymentMethod
          });
        });
      }
    });
    
    res.status(200).json(invoices);
  } catch (error) {
    next(error);
  }
},

// Get payments
getPayments: async (req, res, next) => {
  try {
    const billings = await Billing.find()
      .populate('patient', 'name');
    
    // Extract paid invoices as payments
    const payments = [];
    billings.forEach(billing => {
      if (billing.invoices && billing.invoices.length > 0) {
        billing.invoices
          .filter(invoice => invoice.status === 'Paid' && invoice.paidDate)
          .forEach(invoice => {
            payments.push({
              _id: invoice._id,
              patientName: billing.patient ? billing.patient.name : 'Unknown',
              date: invoice.paidDate,
              amount: invoice.totalAmount,
              method: invoice.paymentMethod || 'Unknown',
              status: 'completed',
              invoiceId: invoice._id
            });
          });
      }
    });
    
    res.status(200).json(payments);
  } catch (error) {
    next(error);
  }
},

  // Process payment
  processPayment: async (req, res, next) => {
    try {
      const { invoiceId } = req.params;
      const { paymentMethod, amount } = req.body;
  
      // Find the billing record with this invoice
      const billing = await Billing.findOne({ 'invoices._id': invoiceId });
  
      if (!billing) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
  
      // Find the specific invoice
      const invoiceIndex = billing.invoices.findIndex(
        inv => inv._id.toString() === invoiceId
      );
  
      if (invoiceIndex === -1) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
  
      // Validate that payment amount matches invoice total
      if (amount !== billing.invoices[invoiceIndex].totalAmount) {
        return res.status(400).json({ 
          message: 'Payment amount must match the invoice total',
          expectedAmount: billing.invoices[invoiceIndex].totalAmount,
          providedAmount: amount
        });
      }
  
      // Update invoice status and payment details
      billing.invoices[invoiceIndex].status = 'Paid';
      billing.invoices[invoiceIndex].paymentMethod = paymentMethod;
      billing.invoices[invoiceIndex].paidDate = new Date();
  
      // Save the updated billing document
      await billing.save();
  
      res.status(200).json({
        message: 'Payment processed successfully',
        invoice: billing.invoices[invoiceIndex]
      });
    } catch (error) {
      console.error('Payment processing error:', error);
      res.status(500).json({ 
        message: 'Failed to process payment', 
        error: error.message 
      });
    }
  },
  
      
  getAllPatients: async (req, res, next) => {
    try {
      const Patient = require('../models/Patient'); // Import the Patient model
      const patients = await Patient.find().select('name _id');
      res.status(200).json({
        status: 'success',
        data: patients
      });
    } catch (error) {
      next(error);
    }
  },
  // Get patient invoices
  getPatientInvoices: async (req, res, next) => {
    try {
      const billing = await Billing.findOne({ patient: req.params.patientId })
        .populate('patient');

      if (!billing) {
        throw new AppError('No billing records found for this patient', 404);
      }

      res.json({
        status: 'success',
        data: billing.invoices
      });
    } catch (error) {
      next(error);
    }
  },

  // Track expenses
  trackExpenses: async (req, res, next) => {
    try {
      const billing = await Billing.findOneAndUpdate(
        {},
        { $push: { expenses: {
          category: req.body.category,
          amount: req.body.amount,
          date: new Date(),
          description: req.body.description
        }}},
        { new: true }
      );

      res.json({
        status: 'success',
        data: billing.expenses[billing.expenses.length - 1]
      });
    } catch (error) {
      next(error);
    }
  },

  // Submit insurance claim
  submitInsuranceClaim: async (req, res, next) => {
    try {
      const billing = await Billing.findOne({ patient: req.params.patientId });
      
      if (!billing) {
        throw new AppError('No billing records found for this patient', 404);
      }

      billing.insuranceClaims.push({
        provider: req.body.provider,
        claimNumber: req.body.claimNumber,
        amount: req.body.amount,
        submissionDate: new Date(),
        status: 'Pending'
      });

      await billing.save();

      res.status(201).json({
        status: 'success',
        data: billing.insuranceClaims[billing.insuranceClaims.length - 1]
      });
    } catch (error) {
      next(error);
    }
  },

  // Get financial reports
  getFinancialReports: async (req, res, next) => {
    try {
      const billing = await Billing.findOne();
      
      const totalIncome = billing.invoices
        .filter(invoice => invoice.status === 'Paid')
        .reduce((sum, invoice) => sum + invoice.totalAmount, 0);

      const totalExpenses = billing.expenses
        .reduce((sum, expense) => sum + expense.amount, 0);

      const pendingPayments = billing.invoices
        .filter(invoice => invoice.status === 'Pending')
        .reduce((sum, invoice) => sum + invoice.totalAmount, 0);

      res.json({
        status: 'success',
        data: {
          totalIncome,
          totalExpenses,
          netProfit: totalIncome - totalExpenses,
          pendingPayments
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = billingController;